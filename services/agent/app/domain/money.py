"""Deterministic money helpers for reconciliation.

Every monetary value in the reconciliation domain passes through
``Decimal`` built from ``str(value)`` so binary floating point error cannot
leak into reported totals. MySQL decimals arrive as strings (``"40.00"``),
JSON fixtures may use numbers; both are converted exactly.
"""

from collections.abc import Iterable
from decimal import ROUND_HALF_UP, Decimal

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def as_decimal(value: object) -> Decimal:
    """Convert a database/JSON value to an exact ``Decimal``."""
    if value is None:
        return ZERO
    if isinstance(value, Decimal):
        return value
    if isinstance(value, bool) or value == "":
        raise ValueError(f"not a monetary value: {value!r}")
    return Decimal(str(value))


def money_sum(values: Iterable[Decimal]) -> Decimal:
    """Sum decimal values and round to cents with half-up rounding."""
    return sum(values, ZERO).quantize(CENT, rounding=ROUND_HALF_UP)


def money_str(value: Decimal) -> str:
    """Render a decimal as a fixed two-decimal string."""
    return str(value.quantize(CENT, rounding=ROUND_HALF_UP))


def count_str(value: int) -> str:
    """Render an integer count for the report."""
    return str(int(value))
