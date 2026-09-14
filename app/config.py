from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # API keys – optional, connector will disable if missing
    OPENWEATHER_API_KEY: str | None = None
    TOMTOM_API_KEY: str | None = None
    MAPBOX_API_KEY: str | None = None
    GOOGLE_MAPS_API_KEY: str | None = None

    # Redis URL
    REDIS_URL: str = Field(default="redis://localhost:6379/0")

    # CORS origins for frontend development
    CORS_ORIGINS: List[str] = Field(default_factory=lambda: ["http://localhost:5173", "http://localhost:3000"])

    # Logging level
    LOG_LEVEL: str = "INFO"
    EXTERNAL_TIMEOUT_SECONDS: float = 15.0
    STORM_ALERT_THRESHOLD: int = 50
    GEOSAMPA_ACCIDENTS_URL: str | None = None
    SSP_CRIME_DATA_URL: str | None = None
    SSP_DISTRICTS_GEOJSON_URL: str | None = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Export a singleton settings instance
settings = Settings()
