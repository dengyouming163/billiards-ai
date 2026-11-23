"""Deterministic shift reconciliation.

The rules replicate the semantics confirmed by the PHP characterization tests
in ``billiards/wwwapi/tests/Characterization/ShiftBehaviorTest.php``:

* orders are scoped by ``store_id + operator_id + end_time + status=completed``;
* order-level payments (``order_item_id IS NULL``) and item-level payments are
  listed separately and never summed together;
* ``member_recharge.amount`` is received cash, ``gift_amount`` is bonus balance;
* a recharge cash flow may carry ``amount + gift_amount``;
* merge children count like the legacy summary only when the parent belongs to
  the same store, operator and shift. Cross-store/cross-operator/cross-shift
  parents block automatic attribution and are reported as ``unknown``.

No model, RAG or SQL call happens here: a report is a pure function of the
evidence payload from ``/storeapi/agent.Reconciliation/shiftEvidence``.

``status`` semantics:

* ``insufficient_data``: evidence is truncated, empty, or has no legacy
  snapshot to compare against. Never rendered as "matched".
* ``review_required``: internal differences exist, snapshot fields are missing,
  or attribution is unresolved.
* ``ok``: every check that the evidence can support matched. ``unknowns`` may
  still carry ``OPEN_TABLE_COUNT_NOT_IN_EVIDENCE`` and
  ``EXTERNAL_CONFIRMATION_REQUIRED``; this only means "system totals agree",
  never "financial reconciliation passed".
"""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.domain.money import ZERO, as_decimal, count_str, money_str, money_sum

SOURCE_ENDPOINT = "/storeapi/agent.Reconciliation/shiftEvidence"
REPORT_SCHEMA_VERSION = "reconciliation-report/v1"

SNAPSHOT_FIELDS = (
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
)

COUNT_SNAPSHOT_FIELDS = frozenset({"order_count", "open_table_count"})

LEGACY_TO_RECOMPUTED = (
    ("total_revenue", "order_total"),
    ("order_count", "order_count"),
    ("cash_paid", "cash_total"),
    ("wechat_paid", "wechat_total"),
    ("balance_paid", "balance_total"),
    ("table_revenue", "table_total"),
    ("product_revenue", "product_total"),
    ("assistant_revenue", "assistant_total"),
    ("recharge_total", "recharge_total"),
)

BLOCKING_UNKNOWN_CODES = frozenset(
    {
        "SNAPSHOT_FIELD_MISSING",
        "MERGE_ATTRIBUTION_UNKNOWN",
        "PAYMENT_CLASSIFICATION_UNKNOWN",
        "PAYMENT_TIME_UNKNOWN",
        "CASH_FLOW_UNATTRIBUTED",
    }
)


class MergeInfo(BaseModel):
    model_config = ConfigDict(extra="ignore")

    state: str = "none"
    parent_order_id: str | None = None
    attribution: str = "self"


class ShiftEvidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    store_id: str | None = None
    employee_id: str | None = None
    status: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    snapshot: dict[str, Any] = Field(default_factory=dict)
    snapshot_fields_present: list[str] = Field(default_factory=list)


class OrderEvidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    store_id: str | None = None
    status: str | None = None
    end_time: str | None = None
    final_amount: Any = None
    cash_paid: Any = None
    wechat_paid: Any = None
    alipay_paid: Any = None
    card_paid: Any = None
    balance_paid: Any = None
    table_fee: Any = None
    product_fee: Any = None
    assistant_fee: Any = None
    merged_to_order_id: str | None = None
    merge: MergeInfo = Field(default_factory=MergeInfo)


class PaymentEvidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    order_id: str | None = None
    amount: Any = None
    order_item_id: str | None = None
    classification: str | None = None
    paid_at_status: str | None = None
    merge: MergeInfo = Field(default_factory=MergeInfo)


class RechargeEvidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    amount: Any = None
    gift_amount: Any = None


class CashFlowEvidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str
    order_id: str | None = None
    amount: Any = None
    type: str | None = None
    category: str | None = None


class EvidenceMeta(BaseModel):
    model_config = ConfigDict(extra="ignore")

    generated_at: str | None = None
    limits: int | None = None
    truncated: bool = False
    code_version: str | None = None


class Evidence(BaseModel):
    model_config = ConfigDict(extra="ignore")

    schema_version: str
    shift: ShiftEvidence
    orders: list[OrderEvidence] = Field(default_factory=list)
    payments: list[PaymentEvidence] = Field(default_factory=list)
    recharges: list[RechargeEvidence] = Field(default_factory=list)
    cash_flows: list[CashFlowEvidence] = Field(default_factory=list)
    exclusions: list[dict[str, Any]] = Field(default_factory=list)
    meta: EvidenceMeta = Field(default_factory=EvidenceMeta)


class MoneyValue(BaseModel):
    value: str
    refs: list[str]


class Difference(BaseModel):
    code: str
    field: str
    legacy: str
    recomputed: str
    delta: str
    refs: list[str]


class ExplainedItem(BaseModel):
    code: str
    message: str
    value: str | None = None
    refs: list[str]


class UnknownItem(BaseModel):
    code: str
    message: str
    attribution: str = "unknown"
    refs: list[str]


class EvidenceRef(BaseModel):
    ref_id: str
    rule_id: str
    source_endpoint: str
    source_ids: list[str]


class Report(BaseModel):
    schema_version: str = REPORT_SCHEMA_VERSION
    status: Literal["ok", "insufficient_data", "review_required"]
    legacy_summary: dict[str, str | None]
    recomputed: dict[str, MoneyValue]
    differences: list[Difference]
    explained: list[ExplainedItem]
    unknowns: list[UnknownItem]
    evidence_refs: list[EvidenceRef]
    narrative: str | None = None
    degraded: bool = False


def _payment_classification(payment: PaymentEvidence) -> str:
    if payment.classification in {"order", "item", "unknown"}:
        return payment.classification
    if payment.order_item_id is None:
        return "order"
    if payment.order_item_id == "":
        return "unknown"
    return "item"


def _merge_reasons(evidence: Evidence) -> dict[str, str]:
    reasons: dict[str, str] = {}
    for exclusion in evidence.exclusions:
        if exclusion.get("type") != "merge_excluded":
            continue
        order_id = exclusion.get("order_id")
        reason = exclusion.get("reason")
        if isinstance(order_id, str) and isinstance(reason, str):
            reasons[order_id] = reason
    return reasons


def _legacy_value(field: str, raw: Any) -> str:
    if field in COUNT_SNAPSHOT_FIELDS:
        return count_str(int(as_decimal(raw)))
    return money_str(as_decimal(raw))


def reconcile(evidence: Evidence) -> Report:
    """Build a deterministic report from one shift evidence payload."""
    registry: dict[str, EvidenceRef] = {}
    ref_order: list[str] = []

    def add_ref(ref_id: str, rule_id: str, source_ids: list[str]) -> str:
        if ref_id not in registry:
            registry[ref_id] = EvidenceRef(
                ref_id=ref_id,
                rule_id=rule_id,
                source_endpoint=SOURCE_ENDPOINT,
                source_ids=list(source_ids),
            )
            ref_order.append(ref_id)
        return ref_id

    shift = evidence.shift
    add_ref("ref-shift", "shift_scope", [shift.id])
    add_ref("ref-snapshot", "legacy_snapshot", [shift.id])

    present = set(shift.snapshot_fields_present)
    legacy_summary: dict[str, str | None] = {}
    for field in SNAPSHOT_FIELDS:
        raw = shift.snapshot.get(field)
        if field in present and raw is not None:
            legacy_summary[field] = _legacy_value(field, raw)
        else:
            legacy_summary[field] = None
    has_snapshot = any(value is not None for value in legacy_summary.values())

    has_rows = bool(
        evidence.orders or evidence.payments or evidence.recharges or evidence.cash_flows
    )

    merge_reasons = _merge_reasons(evidence)

    unknown_merge_orders = sorted(
        (order for order in evidence.orders if order.merge.state == "unknown"),
        key=lambda order: order.id,
    )
    countable_orders = [order for order in evidence.orders if order.merge.state != "unknown"]
    order_ids = sorted(order.id for order in countable_orders)
    add_ref("ref-orders", "order_totals", order_ids)

    def order_total(field: str) -> Any:
        return money_sum(as_decimal(getattr(order, field)) for order in countable_orders)

    order_total_amount = order_total("final_amount")
    cash_total = order_total("cash_paid")
    wechat_total = order_total("wechat_paid")
    alipay_total = order_total("alipay_paid")
    card_total = order_total("card_paid")
    balance_total = order_total("balance_paid")
    table_total = order_total("table_fee")
    product_total = order_total("product_fee")
    assistant_total = order_total("assistant_fee")

    order_payments = [
        payment
        for payment in evidence.payments
        if _payment_classification(payment) == "order"
    ]
    item_payments = [
        payment
        for payment in evidence.payments
        if _payment_classification(payment) == "item"
    ]
    unknown_class_payments = [
        payment
        for payment in evidence.payments
        if _payment_classification(payment) == "unknown"
    ]
    countable_order_payments = [
        payment for payment in order_payments if payment.merge.state != "unknown"
    ]
    unknown_merge_payments = [
        payment for payment in order_payments if payment.merge.state == "unknown"
    ]
    order_payment_ids = sorted(payment.id for payment in countable_order_payments)
    add_ref("ref-order-payments", "order_payment_totals", order_payment_ids)
    add_ref(
        "ref-item-payments",
        "item_payment_excluded",
        sorted(payment.id for payment in item_payments),
    )
    order_payment_total = money_sum(
        as_decimal(payment.amount) for payment in countable_order_payments
    )

    recharge_ids = sorted(recharge.id for recharge in evidence.recharges)
    recharge_id_set = set(recharge_ids)
    add_ref("ref-recharges", "recharge_totals", recharge_ids)
    recharge_total = money_sum(as_decimal(recharge.amount) for recharge in evidence.recharges)
    gift_total = money_sum(as_decimal(recharge.gift_amount) for recharge in evidence.recharges)

    recharge_cash_flows = [
        cash_flow for cash_flow in evidence.cash_flows if cash_flow.order_id in recharge_id_set
    ]
    add_ref(
        "ref-recharge-cashflow",
        "recharge_cash_flow",
        sorted(cash_flow.id for cash_flow in recharge_cash_flows),
    )
    recharge_cash_flow_total = money_sum(
        as_decimal(cash_flow.amount) for cash_flow in recharge_cash_flows
    )
    expected_recharge_cash = recharge_total + gift_total

    all_order_ids = {order.id for order in evidence.orders}
    unattributed_cash_flows = [
        cash_flow
        for cash_flow in evidence.cash_flows
        if cash_flow.order_id not in recharge_id_set
        and cash_flow.order_id not in all_order_ids
    ]

    recomputed: dict[str, MoneyValue] = {
        "order_total": MoneyValue(value=money_str(order_total_amount), refs=["ref-orders"]),
        "order_count": MoneyValue(
            value=count_str(len(countable_orders)), refs=["ref-orders"]
        ),
        "cash_total": MoneyValue(value=money_str(cash_total), refs=["ref-orders"]),
        "wechat_total": MoneyValue(value=money_str(wechat_total), refs=["ref-orders"]),
        "alipay_total": MoneyValue(value=money_str(alipay_total), refs=["ref-orders"]),
        "card_total": MoneyValue(value=money_str(card_total), refs=["ref-orders"]),
        "balance_total": MoneyValue(value=money_str(balance_total), refs=["ref-orders"]),
        "table_total": MoneyValue(value=money_str(table_total), refs=["ref-orders"]),
        "product_total": MoneyValue(value=money_str(product_total), refs=["ref-orders"]),
        "assistant_total": MoneyValue(
            value=money_str(assistant_total), refs=["ref-orders"]
        ),
        "recharge_total": MoneyValue(
            value=money_str(recharge_total), refs=["ref-recharges"]
        ),
        "recharge_gift_total": MoneyValue(value=money_str(gift_total), refs=["ref-recharges"]),
        "order_payment_total": MoneyValue(
            value=money_str(order_payment_total), refs=["ref-order-payments"]
        ),
        "recharge_cash_flow_total": MoneyValue(
            value=money_str(recharge_cash_flow_total), refs=["ref-recharge-cashflow"]
        ),
    }

    explained: list[ExplainedItem] = []
    for order in sorted(
        (order for order in evidence.orders if order.merge.state == "same_shift"),
        key=lambda order: order.id,
    ):
        ref_id = add_ref(
            f"ref-order-merge-same:{order.id}", "merge_same_shift", [order.id]
        )
        parent = order.merge.parent_order_id
        explained.append(
            ExplainedItem(
                code="MERGE_SAME_SHIFT",
                message=(
                    f"order {order.id} is merged into parent {parent} within the same "
                    "shift and is counted like the legacy summary"
                ),
                value=money_str(as_decimal(order.final_amount)),
                refs=[ref_id],
            )
        )

    if item_payments:
        explained.append(
            ExplainedItem(
                code="ITEM_PAYMENTS_NOT_DOUBLE_COUNTED",
                message=(
                    "item-level payments are recorded separately and are not added to "
                    "order-level payment totals"
                ),
                value=money_str(
                    money_sum(as_decimal(payment.amount) for payment in item_payments)
                ),
                refs=["ref-item-payments"],
            )
        )

    if gift_total != ZERO:
        explained.append(
            ExplainedItem(
                code="RECHARGE_GIFT",
                message=(
                    "recharge gift amounts are bonus balance and are not external cash "
                    "receipts"
                ),
                value=money_str(gift_total),
                refs=["ref-recharges"],
            )
        )

    unknowns: list[UnknownItem] = []
    if evidence.meta.truncated:
        unknowns.append(
            UnknownItem(
                code="EVIDENCE_TRUNCATED",
                message="evidence payload was truncated; totals are partial",
                refs=["ref-shift"],
            )
        )

    if not has_rows:
        unknowns.append(
            UnknownItem(
                code="NO_EVIDENCE",
                message="the shift has no orders, payments, recharges or cash flows",
                refs=["ref-shift"],
            )
        )
    elif not has_snapshot:
        unknowns.append(
            UnknownItem(
                code="NO_LEGACY_SNAPSHOT",
                message=(
                    "the shift has no frozen financial snapshot (handover does not "
                    "write one); only recomputed values are available"
                ),
                refs=["ref-snapshot"],
            )
        )
    else:
        for field in SNAPSHOT_FIELDS:
            if legacy_summary[field] is None:
                unknowns.append(
                    UnknownItem(
                        code="SNAPSHOT_FIELD_MISSING",
                        message=f"snapshot field {field} is missing",
                        refs=["ref-snapshot"],
                    )
                )
            elif field == "open_table_count":
                unknowns.append(
                    UnknownItem(
                        code="OPEN_TABLE_COUNT_NOT_IN_EVIDENCE",
                        message=(
                            "open table count cannot be recomputed because the evidence "
                            "payload only contains completed orders"
                        ),
                        refs=["ref-snapshot"],
                    )
                )

    for order in unknown_merge_orders:
        ref_id = add_ref(
            f"ref-order-merge:{order.id}", "merge_attribution", [order.id]
        )
        reason = merge_reasons.get(order.id, "unresolved_parent_merge")
        unknowns.append(
            UnknownItem(
                code="MERGE_ATTRIBUTION_UNKNOWN",
                message=(
                    f"order {order.id} merged to {order.merge.parent_order_id} but "
                    f"attribution is {reason}"
                ),
                refs=[ref_id],
            )
        )

    for payment in sorted(unknown_merge_payments, key=lambda item: item.id):
        ref_id = add_ref(
            f"ref-payment:{payment.id}", "payment_attribution", [payment.id]
        )
        reason = merge_reasons.get(payment.order_id or "", "unresolved_parent_merge")
        unknowns.append(
            UnknownItem(
                code="MERGE_ATTRIBUTION_UNKNOWN",
                message=(
                    f"payment {payment.id} belongs to order {payment.order_id} with "
                    f"unresolved merge attribution ({reason})"
                ),
                refs=[ref_id],
            )
        )

    for payment in sorted(unknown_class_payments, key=lambda item: item.id):
        ref_id = add_ref(
            f"ref-payment:{payment.id}", "payment_attribution", [payment.id]
        )
        unknowns.append(
            UnknownItem(
                code="PAYMENT_CLASSIFICATION_UNKNOWN",
                message=(
                    f"payment {payment.id} has an invalid order_item_id and cannot be "
                    "classified as order-level or item-level"
                ),
                refs=[ref_id],
            )
        )

    for payment in sorted(
        (item for item in evidence.payments if item.paid_at_status == "unknown"),
        key=lambda item: item.id,
    ):
        ref_id = add_ref(
            f"ref-payment:{payment.id}", "payment_attribution", [payment.id]
        )
        unknowns.append(
            UnknownItem(
                code="PAYMENT_TIME_UNKNOWN",
                message=(
                    f"payment {payment.id} has no paid_at and cannot be placed in the "
                    "shift window"
                ),
                refs=[ref_id],
            )
        )

    for cash_flow in sorted(unattributed_cash_flows, key=lambda item: item.id):
        ref_id = add_ref(
            f"ref-cashflow:{cash_flow.id}", "cash_flow_attribution", [cash_flow.id]
        )
        unknowns.append(
            UnknownItem(
                code="CASH_FLOW_UNATTRIBUTED",
                message=(
                    f"cash flow {cash_flow.id} is not linked to an order or recharge in "
                    "this shift"
                ),
                refs=[ref_id],
            )
        )

    differences: list[Difference] = []
    comparison_blocked = (
        evidence.meta.truncated
        or not has_rows
        or not has_snapshot
        or bool(unknown_merge_orders)
        or bool(unknown_merge_payments)
    )
    if not comparison_blocked:
        for legacy_field, recomputed_key in LEGACY_TO_RECOMPUTED:
            legacy = legacy_summary[legacy_field]
            if legacy is None:
                continue
            recomputed_value = recomputed[recomputed_key].value
            if legacy_field in COUNT_SNAPSHOT_FIELDS:
                equal = int(legacy) == int(recomputed_value)
                delta = count_str(int(recomputed_value) - int(legacy))
            else:
                legacy_decimal = as_decimal(legacy)
                recomputed_decimal = as_decimal(recomputed_value)
                equal = legacy_decimal == recomputed_decimal
                delta = money_str(recomputed_decimal - legacy_decimal)
            if equal:
                continue
            differences.append(
                Difference(
                    code=f"{legacy_field.upper()}_MISMATCH",
                    field=legacy_field,
                    legacy=legacy,
                    recomputed=recomputed_value,
                    delta=delta,
                    refs=list(recomputed[recomputed_key].refs),
                )
            )

        order_channel_total = (
            cash_total
            + wechat_total
            + alipay_total
            + card_total
            + balance_total
        )
        if order_channel_total != order_payment_total:
            differences.append(
                Difference(
                    code="ORDER_CHANNEL_PAYMENT_MISMATCH",
                    field="order_payment_total",
                    legacy=money_str(order_channel_total),
                    recomputed=money_str(order_payment_total),
                    delta=money_str(order_payment_total - order_channel_total),
                    refs=["ref-orders", "ref-order-payments"],
                )
            )

        if recharge_cash_flow_total != expected_recharge_cash:
            differences.append(
                Difference(
                    code="CASH_FLOW_MISMATCH",
                    field="recharge_cash_flow_total",
                    legacy=money_str(expected_recharge_cash),
                    recomputed=money_str(recharge_cash_flow_total),
                    delta=money_str(recharge_cash_flow_total - expected_recharge_cash),
                    refs=["ref-recharges", "ref-recharge-cashflow"],
                )
            )

    if has_rows:
        unknowns.append(
            UnknownItem(
                code="EXTERNAL_CONFIRMATION_REQUIRED",
                message=(
                    "cash count and external channel statements are required before "
                    "financial sign-off; system totals alone are not proof of settlement"
                ),
                refs=["ref-shift"],
            )
        )

    if evidence.meta.truncated or not has_rows or not has_snapshot:
        status: Literal["ok", "insufficient_data", "review_required"] = "insufficient_data"
    elif differences or any(
        unknown.code in BLOCKING_UNKNOWN_CODES for unknown in unknowns
    ):
        status = "review_required"
    else:
        status = "ok"

    used_refs: set[str] = set()
    for value in recomputed.values():
        used_refs.update(value.refs)
    for item in [*differences, *explained, *unknowns]:
        used_refs.update(item.refs)

    return Report(
        status=status,
        legacy_summary=legacy_summary,
        recomputed=recomputed,
        differences=differences,
        explained=explained,
        unknowns=unknowns,
        evidence_refs=[registry[ref_id] for ref_id in ref_order if ref_id in used_refs],
    )
