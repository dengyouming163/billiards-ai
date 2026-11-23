from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Runtime configuration; the database URL is intentionally required.

    A missing ``AGENT_DATABASE_URL`` fails fast instead of silently falling
    back to the test database. Service endpoints and model settings are only
    read here: callers and the model never choose them.
    """

    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    agent_database_url: str
    langgraph_database_url: str | None = None

    billiards_base_url: str = "http://127.0.0.1:10002/storeapi"

    # Comma-separated browser origins allowed to call the agent directly (CORS).
    # Auth is still enforced via the Bearer token; this only relaxes the
    # browser same-origin policy for the local demo frontend.
    cors_allow_origins: str = (
        "http://127.0.0.1:3000,http://localhost:3000,"
        "http://127.0.0.1:3001,http://localhost:3001"
    )

    # Dedicated MySQL read-only identity that only sees agent_* views.
    billiards_mysql_ro_url: str | None = None
    sql_timeout_ms: int = Field(default=2000, ge=1, le=60000)
    sql_max_rows: int = Field(default=200, ge=1, le=500)

    rag_base_url: str = "http://127.0.0.1:8000"
    rag_kb_id: str = "billiards-sop-test"
    rag_audience: str = "internal"
    rag_timeout_seconds: float = 10.0

    model_base_url: str = "http://127.0.0.1:9999/v1"
    model_api_key: str | None = None
    model_name: str = "test-tool-model"
    model_timeout_seconds: float = 20.0
    model_max_retries: int = 1


settings = Settings()
