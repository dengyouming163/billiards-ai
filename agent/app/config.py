from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration loaded from environment variables or ``.env``."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "test"
    agent_database_url: str = (
        "postgresql+psycopg://agent:test-agent-only@127.0.0.1:15432/agent_test"
    )
    langgraph_database_url: str = "postgresql://agent:test-agent-only@127.0.0.1:15432/agent_test"


settings = Settings()
