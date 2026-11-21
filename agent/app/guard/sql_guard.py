"""Two-layer SQL guard: AST validation plus server-side store scoping.

This module rejects every shape the open-ended analysis agent must never emit:
writes, multiple statements, joins/unions/subqueries/CTEs, base tables, schema
prefixes, `SELECT *`, unknown columns, unapproved functions, locks, `INTO` and
oversized LIMITs. Valid queries are rewritten to:

* inject ``LIMIT <max_rows>`` when the model omitted it;
* append ``AND store_id = :__agent_store_id`` with the original ``WHERE``
  parenthesised, so ``store_id = 'store-b' OR 1=1`` cannot escape the scope.

The executor then runs the SQL with a dedicated read-only MySQL identity and
binds ``__agent_store_id`` from the verified principal.
"""

import re

import sqlglot
from sqlglot import exp

MAX_SQL_LENGTH = 4000
DEFAULT_MAX_ROWS = 200

VIEW_COLUMNS: dict[str, frozenset[str]] = {
    "agent_order_analysis": frozenset(
        {
            "store_id",
            "order_id",
            "order_no",
            "status",
            "operator_id",
            "table_fee",
            "product_fee",
            "assistant_fee",
            "discount_amount",
            "final_amount",
            "balance_paid",
            "cash_paid",
            "wechat_paid",
            "alipay_paid",
            "card_paid",
            "merged_to_order_id",
            "start_time",
            "end_time",
            "created_at",
        }
    ),
    "agent_recharge_analysis": frozenset(
        {
            "store_id",
            "recharge_id",
            "amount",
            "gift_amount",
            "payment_method",
            "status",
            "operator_id",
            "created_at",
        }
    ),
    "agent_shift_analysis": frozenset(
        {
            "store_id",
            "shift_id",
            "employee_id",
            "work_date",
            "status",
            "check_in_time",
            "check_out_time",
            "total_revenue",
            "order_count",
            "cash_paid",
            "wechat_paid",
            "balance_paid",
            "table_revenue",
            "product_revenue",
            "assistant_revenue",
            "open_table_count",
            "recharge_total",
        }
    ),
}

ALLOWED_RESULT_COLUMNS = frozenset().union(*VIEW_COLUMNS.values())

ALLOWED_FUNCTIONS = frozenset(
    {"SUM", "COUNT", "AVG", "MIN", "MAX", "COALESCE", "ROUND", "DATE"}
)

_ALLOWED_FUNCTION_NODES = (
    exp.Sum,
    exp.Count,
    exp.Avg,
    exp.Min,
    exp.Max,
    exp.Coalesce,
    exp.Round,
    exp.TsOrDsToDate,
    exp.Date,
)

# sqlglot models comparison/logical predicates as Func subclasses; they are
# query conditions, not function calls, and carry no execution capability.
_ALLOWED_PREDICATE_NODES = (
    exp.And,
    exp.Or,
    exp.Not,
    exp.EQ,
    exp.NEQ,
    exp.GT,
    exp.GTE,
    exp.LT,
    exp.LTE,
    exp.Is,
    exp.Like,
    exp.ILike,
    exp.Between,
    exp.In,
    exp.NullSafeEQ,
    exp.NullSafeNEQ,
)

FORBIDDEN_NODES = (
    exp.Insert,
    exp.Update,
    exp.Delete,
    exp.Drop,
    exp.Create,
    exp.Alter,
    exp.Union,
    exp.Join,
    exp.Subquery,
    exp.CTE,
    exp.Into,
    exp.Lock,
)

_RESULT_ALIAS = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")


class SqlRejected(Exception):
    """The SQL draft violated the analysis policy."""

    def __init__(self, code: str, message: str | None = None) -> None:
        super().__init__(message or code)
        self.code = code


class SqlExecutionError(Exception):
    """The guarded query could not be executed."""

    def __init__(self, code: str, message: str | None = None) -> None:
        super().__init__(message or code)
        self.code = code


class SqlTimeout(SqlExecutionError):
    def __init__(self) -> None:
        super().__init__("SQL_TIMEOUT", "query exceeded the server time limit")


def _reject(code: str) -> None:
    raise SqlRejected(code)


def _require_single_view(tree: exp.Select) -> tuple[str, str]:
    tables = list(tree.find_all(exp.Table))
    if len(tables) != 1:
        _reject("QUERY_SHAPE_FORBIDDEN")
    table = tables[0]
    if table.args.get("db") or table.args.get("catalog"):
        _reject("SCHEMA_PREFIX_FORBIDDEN")
    name = table.name.lower()
    if name not in VIEW_COLUMNS:
        _reject("TABLE_NOT_ALLOWED")
    alias = table.alias.lower() if table.alias else name
    return name, alias


def _validate_stars(tree: exp.Select) -> None:
    for star in tree.find_all(exp.Star):
        parent = star.parent
        if isinstance(parent, exp.Count):
            continue
        _reject("SELECT_STAR_FORBIDDEN")


def _validate_columns(
    tree: exp.Select, view_name: str, view_alias: str
) -> None:
    allowed = VIEW_COLUMNS[view_name]
    aliases = {
        alias.alias.lower()
        for alias in tree.find_all(exp.Alias)
        if isinstance(alias.alias, str) and alias.alias
    }
    for column in tree.find_all(exp.Column):
        name = column.name.lower()
        if not name:
            continue
        qualifier = column.table.lower()
        if qualifier and qualifier not in {view_name, view_alias}:
            _reject("COLUMN_NOT_ALLOWED")
        if name not in allowed and name not in aliases:
            _reject("COLUMN_NOT_ALLOWED")


def _validate_functions(tree: exp.Select) -> None:
    for node in tree.walk():
        if isinstance(node, exp.Func):
            if isinstance(node, _ALLOWED_FUNCTION_NODES + _ALLOWED_PREDICATE_NODES):
                continue
            if (
                isinstance(node, exp.Anonymous)
                and node.name.upper() in ALLOWED_FUNCTIONS
            ):
                continue
            _reject("FUNCTION_NOT_ALLOWED")


def _apply_limit(tree: exp.Select, max_rows: int) -> None:
    limit = tree.args.get("limit")
    if limit is None:
        tree.set("limit", exp.Limit(expression=exp.Literal.number(max_rows)))
        return
    expression = limit.expression
    if not isinstance(expression, exp.Literal) or not expression.is_int:
        _reject("LIMIT_INVALID")
    value = int(expression.this)
    if value < 1:
        _reject("LIMIT_INVALID")
    if value > max_rows:
        _reject("LIMIT_EXCEEDED")


def _apply_store_scope(tree: exp.Select) -> None:
    scope = exp.EQ(
        this=exp.column("store_id"),
        expression=exp.Placeholder(this="__agent_store_id", kind=":"),
    )
    where = tree.args.get("where")
    if where is None:
        tree.set("where", exp.Where(this=scope))
        return
    tree.set("where", exp.Where(this=exp.and_(exp.Paren(this=where.this), scope)))


def validate_and_scope(raw_sql: str, max_rows: int = DEFAULT_MAX_ROWS) -> str:
    """Return a scoped, read-only MySQL SELECT or raise ``SqlRejected``."""
    if not isinstance(raw_sql, str) or not raw_sql.strip():
        _reject("SQL_EMPTY")
    if len(raw_sql) > MAX_SQL_LENGTH:
        _reject("SQL_TOO_LONG")
    try:
        statements = [statement for statement in sqlglot.parse(raw_sql, read="mysql") if statement]
    except sqlglot.errors.ParseError:
        _reject("SQL_PARSE_ERROR")
    if len(statements) != 1 or not isinstance(statements[0], exp.Select):
        _reject("SINGLE_SELECT_REQUIRED")
    tree = statements[0]

    if tree.args.get("with_"):
        _reject("QUERY_SHAPE_FORBIDDEN")
    if any(isinstance(node, FORBIDDEN_NODES) for node in tree.walk()):
        _reject("QUERY_SHAPE_FORBIDDEN")
    if tree.args.get("locks") or tree.args.get("into"):
        _reject("LOCK_OR_INTO_FORBIDDEN")
    if any(isinstance(node, exp.Placeholder) for node in tree.walk()):
        _reject("PLACEHOLDER_FORBIDDEN")

    view_name, view_alias = _require_single_view(tree)
    _validate_stars(tree)
    _validate_functions(tree)
    _apply_limit(tree, max_rows)
    _validate_columns(tree, view_name, view_alias)
    _apply_store_scope(tree)
    return tree.sql(dialect="mysql")


def validate_result_columns(columns: list[str]) -> None:
    """Reject result columns that are neither view columns nor plain aliases."""
    for column in columns:
        if column.lower() in ALLOWED_RESULT_COLUMNS:
            continue
        if _RESULT_ALIAS.match(column):
            continue
        raise SqlExecutionError("SQL_RESULT_COLUMN_REJECTED")
