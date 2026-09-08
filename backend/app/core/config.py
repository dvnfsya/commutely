from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Commute.ly API"
    cors_origins: list[str] = ["http://localhost:3000"]
    mapid_api_key: SecretStr = SecretStr("")
    database_url: SecretStr = SecretStr("")
    ors_api_key: SecretStr = SecretStr("")
    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", pattern=r"^gemini-[a-zA-Z0-9.-]+$")
