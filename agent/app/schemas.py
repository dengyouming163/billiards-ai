from pydantic import BaseModel, ConfigDict, Field


class Principal(BaseModel):
    """Verified caller identity.

    Tenant, employee and store are resolved server-side; values supplied by the
    browser or the model are never trusted for authorization.
    """

    model_config = ConfigDict(frozen=True)

    tenant_id: str = Field(min_length=1, max_length=64)
    employee_id: str = Field(min_length=1, max_length=64)
    store_id: str = Field(min_length=1, max_length=64)
