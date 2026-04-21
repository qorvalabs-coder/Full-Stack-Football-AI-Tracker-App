from __future__ import annotations

from typing import Any
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Application
    app_name: str = "Football Analytics API"
    environment: str = "development"
    debug: bool = False
    version: str = "1.0.0"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Directories
    data_dir: str = "app/data"
    model_dir: str = "app/models_store"

    # CORS – stored as a comma-separated string, parsed on access
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # Logging
    log_level: str = "INFO"

    # JWT
    jwt_secret_key: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24  # 24 hours
    
    # Infrastructure (Railway)
    database_url: str = "sqlite:///./test.db"
    redis_url: str = "redis://localhost:6379/0"
    media_root: str = "app/data/media"
    data_dir: str = "app/data"
    model_dir: str = "app/models"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
