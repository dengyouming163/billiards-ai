from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    """Runtime configuration; the database URL is intentionally required.

    A missing ``AGENT_DATABASE_URL`` fails fast instead of silently falling
    back to the test database.
    """

    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")

    agent_database_url: str
    langgraph_database_url: str | None = None


settings = Settings()
