"""Configuração do backend FastAPI, sem exigir chaves externas."""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    OPENWEATHER_API_KEY: str | None = None
    TOMTOM_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    EXTERNAL_TIMEOUT_SECONDS: float = 15.0
    STORM_ALERT_THRESHOLD: int = 50
    GEOSAMPA_ACCIDENTS_URL: str | None = None
    SSP_CRIME_DATA_URL: str | None = None
    SSP_DISTRICTS_GEOJSON_URL: str | None = None

    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
