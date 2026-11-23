from pathlib import Path

import pytest
from conftest import resolve_test_database_url
from pydantic import ValidationError

from app.config import Settings, settings


def test_app_settings_use_injected_test_database():
    assert settings.agent_database_url == resolve_test_database_url()


def test_env_file_is_absolute():
    assert Path(Settings.model_config["env_file"]).is_absolute()


def test_settings_fail_without_database_url(monkeypatch):
    monkeypatch.delenv("AGENT_DATABASE_URL", raising=False)

    with pytest.raises(ValidationError):
        Settings(_env_file=None)
