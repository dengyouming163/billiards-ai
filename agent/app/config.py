from pathlib import Path

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
