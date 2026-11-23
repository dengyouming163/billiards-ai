"""Verified caller identity.

A ``Principal`` is never assembled from browser or model input. The only
supported source is the PHP ``agent.Auth/context`` endpoint, which resolves
the employee, merchant and store from the bearer token and validates store
access. The bearer token itself is kept in a request-scoped context variable
so tools can call the PHP API without the model ever seeing it.
"""

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Any

import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.config import settings

_IDENTITY_TIMEOUT_SECONDS = 5.0

_ACCESS_TOKEN: ContextVar[str | None] = ContextVar("agent_access_token", default=None)


class PermissionDenied(Exception):
    """Raised when the verified principal lacks a required permission."""

    code = "PERMISSION_DENIED"

    def __init__(self, permission: str) -> None:
        super().__init__(f"missing permission: {permission}")
        self.permission = permission


class IdentityError(Exception):
    """Raised when verified identity could not be established."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "IDENTITY_UNAVAILABLE",
        status_code: int = 502,
    ) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


class Principal(BaseModel):
    """Verified caller identity.

    Tenant, employee, role and permissions are resolved server-side; values
    supplied by the browser or the model are never trusted for authorization.
    """

    model_config = ConfigDict(frozen=True, extra="forbid")

    tenant_id: str = Field(min_length=1, max_length=64)
    employee_id: str = Field(min_length=1, max_length=64)
    store_id: str = Field(min_length=1, max_length=64)
    role: str = Field(min_length=1, max_length=32)
    permissions: frozenset[str] = Field(default_factory=frozenset)

    def require(self, permission: str) -> None:
        if "*" in self.permissions or permission in self.permissions:
            return
        raise PermissionDenied(permission)


@contextmanager
def access_token_scope(token: str | None):
    """Bind the caller's bearer token to the current request context."""
    handle = _ACCESS_TOKEN.set(token)
    try:
        yield
    finally:
        _ACCESS_TOKEN.reset(handle)


def current_access_token() -> str | None:
    return _ACCESS_TOKEN.get()


class _IdentityContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    employee_id: str = Field(min_length=1, max_length=64)
    merchant_id: str = Field(min_length=1, max_length=64)
    store_id: str = Field(min_length=1, max_length=64)
    role: str = Field(min_length=1, max_length=32)
    permissions: list[str] = Field(default_factory=list)


def _identity_error_for_status(status_code: int) -> IdentityError:
    if status_code == 401:
        return IdentityError("identity is not authenticated", code="UNAUTHENTICATED", status_code=401)
    if status_code == 403:
        return IdentityError("store access denied", code="STORE_ACCESS_DENIED", status_code=403)
    return IdentityError("identity service unavailable", status_code=502)


class BilliardsIdentityClient:
    """Resolve a bearer token into a verified ``Principal`` via PHP."""

    def __init__(
        self,
        *,
        base_url: str | None = None,
        timeout: float = _IDENTITY_TIMEOUT_SECONDS,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self._base_url = (base_url or settings.billiards_base_url).rstrip("/")
        self._timeout = timeout
        self._client = client

    async def resolve(self, access_token: str | None, store_id: str | None) -> Principal:
        if not access_token:
            raise IdentityError("missing access token", code="UNAUTHENTICATED", status_code=401)
        if not store_id:
            raise IdentityError(
                "missing store context", code="INVALID_STORE_CONTEXT", status_code=422
            )

        url = f"{self._base_url}/agent.Auth/context"
        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            response = await self._get(url, params={"store_id": store_id}, headers=headers)
        except httpx.HTTPError:
            # Do not chain: the underlying request carries the bearer token.
            raise IdentityError("identity service unavailable") from None

        if response.status_code != 200:
            raise _identity_error_for_status(response.status_code)

        try:
            payload = response.json()
            context = _IdentityContext.model_validate(payload)
        except (ValueError, TypeError):
            # Do not chain: ValidationError echoes the raw PHP payload, which
            # may contain the bearer token or employee contact details.
            raise IdentityError("identity service returned an invalid payload") from None

        if context.store_id != store_id:
            raise IdentityError(
                "identity store does not match the requested store",
                code="IDENTITY_MISMATCH",
                status_code=403,
            )

        return Principal(
            tenant_id=context.merchant_id,
            employee_id=context.employee_id,
            store_id=context.store_id,
            role=context.role,
            permissions=frozenset(context.permissions),
        )

    async def _get(
        self, url: str, *, params: dict[str, Any], headers: dict[str, str]
    ) -> httpx.Response:
        if self._client is not None:
            return await self._client.get(url, params=params, headers=headers)
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            return await client.get(url, params=params, headers=headers)
