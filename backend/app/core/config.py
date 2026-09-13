from pathlib import Path

from pydantic import Field, HttpUrl, SecretStr, field_validator
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
    mapid_activities_url: HttpUrl = HttpUrl("https://server.mapid.io/web/competition/activities")
    mapid_layer_list_url: HttpUrl = HttpUrl("https://geoserver.mapid.io/layers_new/get_layer_list")
    mapid_layer_url: HttpUrl = HttpUrl("https://geoserver.mapid.io/layers_new/get_layer")

    @field_validator("mapid_activities_url")
    @classmethod
    def secure_mapid_url(cls, value):
        if value.scheme != "https" or value.username or value.password or value.query or value.fragment:
            raise ValueError("MAPID URL must use HTTPS without credentials, query, or fragment.")
        return value

    @field_validator("mapid_layer_list_url", "mapid_layer_url")
    @classmethod
    def secure_mapid_layer_url(cls, value):
        # Validate only the base URL; the client adds api_key from MAPID_API_KEY.
        if value.scheme != "https" or value.username or value.password or value.query or value.fragment:
            raise ValueError("GeoMAPID requires an HTTPS base URL without query parameters or credentials; set MAPID_API_KEY separately.")
        return value

    database_url: SecretStr = SecretStr("")
    ors_api_key: SecretStr = SecretStr("")
    gemini_api_key: SecretStr = SecretStr("")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", pattern=r"^gemini-[a-zA-Z0-9.-]+$")
