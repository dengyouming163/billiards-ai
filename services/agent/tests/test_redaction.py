from app.services.redaction import (
    REDACTED,
    redact_payload,
    sanitize_arguments,
)


def test_phone_number_variants_are_redacted():
    redacted = redact_payload(
        {
            "country_code": "+8613800138000",
            "country_code_no_plus": "8613800138000",
            "hyphenated": "138-0013-8000",
            "spaced": "138 0013 8000",
            "integer": 13800138000,
        }
    )

    assert redacted == {
        "country_code": REDACTED,
        "country_code_no_plus": REDACTED,
        "hyphenated": REDACTED,
        "spaced": REDACTED,
        "integer": REDACTED,
    }


def test_non_phone_integer_is_preserved():
    redacted = redact_payload({"top_k": 5, "limit": 200})

    assert redacted == {"top_k": 5, "limit": 200}


def test_bearer_and_sk_redaction_still_applies():
    redacted = redact_payload(
        {"auth": "Bearer abc.def-123", "key": "sk-live-abcdefghij"}
    )

    assert redacted == {"auth": REDACTED, "key": REDACTED}


def test_sanitize_arguments_redacts_integer_phone_but_keeps_top_k():
    sanitized = sanitize_arguments(
        "rag_search", {"query": 13800138000, "top_k": 5}
    )

    assert sanitized == {"query": REDACTED, "top_k": 5}
