import os
from pydantic import BaseSettings, Field
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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Export a singleton settings instance
settings = Settings()
