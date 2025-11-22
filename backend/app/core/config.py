"""
Core configuration using Pydantic Settings
Manages all application settings with validation and type safety
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator, PostgresDsn, RedisDsn
from typing import List, Optional, Dict, Any
import secrets
import os
from pathlib import Path

class Settings(BaseSettings):
    """
    Application settings with environment variable support
    """
    
    # Application
    APP_NAME: str = "Amazon Review Intelligence"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = Field("development", env="ENVIRONMENT")
    DEBUG: bool = Field(True, env="DEBUG")
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    API_V1_PREFIX: str = "/api/v1"
    
    # Server
    HOST: str = Field("0.0.0.0", env="HOST")
    PORT: int = Field(8000, env="PORT")
    WORKERS: int = Field(4, env="WORKERS")
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        ["http://localhost:3000", "http://127.0.0.1:3000"],
        env="ALLOWED_ORIGINS"
    )
    ALLOWED_HOSTS: List[str] = Field(["*"], env="ALLOWED_HOSTS")
    
    # Database
    DATABASE_URL: PostgresDsn = Field(
        "postgresql://postgres:postgres@localhost:5432/review_intelligence",
        env="DATABASE_URL"
    )
    DATABASE_POOL_SIZE: int = Field(20, env="DATABASE_POOL_SIZE")
    DATABASE_MAX_OVERFLOW: int = Field(40, env="DATABASE_MAX_OVERFLOW")
    DATABASE_ECHO: bool = Field(False, env="DATABASE_ECHO")
    
    # Redis Cache
    REDIS_URL: Optional[RedisDsn] = Field(None, env="REDIS_URL")
    REDIS_PASSWORD: Optional[str] = Field(None, env="REDIS_PASSWORD")
    CACHE_TTL: int = Field(3600, env="CACHE_TTL")  # 1 hour default
    CACHE_ENABLED: bool = Field(True, env="CACHE_ENABLED")
    
    # Apify Configuration
    APIFY_API_TOKEN: Optional[str] = Field(None, env="APIFY_API_TOKEN")
    APIFY_ACTOR_ID: str = Field(
        "junglee/amazon-reviews-scraper",
        env="APIFY_ACTOR_ID"
    )
    APIFY_TIMEOUT_SECONDS: int = Field(300, env="APIFY_TIMEOUT_SECONDS")
    APIFY_MAX_REVIEWS: int = Field(100, env="APIFY_MAX_REVIEWS")
    APIFY_MEMORY_MBYTES: int = Field(1024, env="APIFY_MEMORY_MBYTES")
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = Field(None, env="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field("gpt-4-turbo-preview", env="OPENAI_MODEL")
    OPENAI_MAX_TOKENS: int = Field(4000, env="OPENAI_MAX_TOKENS")
    OPENAI_TEMPERATURE: float = Field(0.7, env="OPENAI_TEMPERATURE")
    ENABLE_OPENAI: bool = Field(True, env="ENABLE_OPENAI")
    
    # NLP Configuration
    ENABLE_ADVANCED_NLP: bool = Field(True, env="ENABLE_ADVANCED_NLP")
    NLP_MODEL_NAME: str = Field(
        "nlptown/bert-base-multilingual-uncased-sentiment",
        env="NLP_MODEL_NAME"
    )
    USE_GPU: bool = Field(False, env="USE_GPU")
    
    # AWS S3 (for file storage)
    AWS_ACCESS_KEY_ID: Optional[str] = Field(None, env="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = Field(None, env="AWS_SECRET_ACCESS_KEY")
    AWS_S3_BUCKET: Optional[str] = Field(None, env="AWS_S3_BUCKET")
    AWS_REGION: str = Field("us-east-1", env="AWS_REGION")
    USE_S3: bool = Field(False, env="USE_S3")
    
    # Local Storage
    UPLOAD_DIR: Path = Field(Path("/tmp/uploads"), env="UPLOAD_DIR")
    EXPORT_DIR: Path = Field(Path("/tmp/exports"), env="EXPORT_DIR")
    
    # Authentication
    JWT_SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    JWT_ALGORITHM: str = Field("HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(1440, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")  # 24 hours
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(7, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Security
    BCRYPT_ROUNDS: int = Field(12, env="BCRYPT_ROUNDS")
    PASSWORD_MIN_LENGTH: int = Field(8, env="PASSWORD_MIN_LENGTH")
    REQUIRE_EMAIL_VERIFICATION: bool = Field(False, env="REQUIRE_EMAIL_VERIFICATION")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = Field(True, env="RATE_LIMIT_ENABLED")
    RATE_LIMIT_REQUESTS: int = Field(100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_PERIOD: int = Field(3600, env="RATE_LIMIT_PERIOD")  # 1 hour
    
    # Email Configuration
    SMTP_HOST: Optional[str] = Field(None, env="SMTP_HOST")
    SMTP_PORT: int = Field(587, env="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(None, env="SMTP_PASSWORD")
    SMTP_FROM_EMAIL: Optional[str] = Field(None, env="SMTP_FROM_EMAIL")
    SMTP_TLS: bool = Field(True, env="SMTP_TLS")
    
    # Background Tasks
    ENABLE_BACKGROUND_TASKS: bool = Field(True, env="ENABLE_BACKGROUND_TASKS")
    CELERY_BROKER_URL: Optional[str] = Field(None, env="CELERY_BROKER_URL")
    CELERY_RESULT_BACKEND: Optional[str] = Field(None, env="CELERY_RESULT_BACKEND")
    
    # Monitoring
    SENTRY_DSN: Optional[str] = Field(None, env="SENTRY_DSN")
    ENABLE_METRICS: bool = Field(True, env="ENABLE_METRICS")
    
    # Logging
    LOG_LEVEL: str = Field("INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field("json", env="LOG_FORMAT")  # "json" or "console"
    LOG_FILE: Optional[Path] = Field(None, env="LOG_FILE")
    
    # Features
    ENABLE_MOCK_DATA: bool = Field(True, env="ENABLE_MOCK_DATA")
    ENABLE_BOT_DETECTION: bool = Field(True, env="ENABLE_BOT_DETECTION")
    ENABLE_EMOTION_ANALYSIS: bool = Field(True, env="ENABLE_EMOTION_ANALYSIS")
    ENABLE_THEME_EXTRACTION: bool = Field(True, env="ENABLE_THEME_EXTRACTION")
    
    # Documentation
    SHOW_DOCS: bool = Field(True, env="SHOW_DOCS")
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = Field(20, env="DEFAULT_PAGE_SIZE")
    MAX_PAGE_SIZE: int = Field(100, env="MAX_PAGE_SIZE")
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_HOSTS", pre=True)
    def parse_hosts(cls, v):
        if isinstance(v, str):
            return [host.strip() for host in v.split(",")]
        return v
    
    @validator("UPLOAD_DIR", "EXPORT_DIR", "LOG_FILE")
    def create_directories(cls, v):
        if v and not v.exists():
            v.mkdir(parents=True, exist_ok=True)
        return v
    
    @validator("DATABASE_URL", pre=True)
    def validate_database_url(cls, v):
        if isinstance(v, str):
            # Ensure PostgreSQL URL format
            if not v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                raise ValueError("Database URL must be a PostgreSQL URL")
        return v
    
    def get_database_url(self, async_mode: bool = False) -> str:
        """
        Get database URL with optional async support
        """
        url = str(self.DATABASE_URL)
        if async_mode and url.startswith("postgresql://"):
            return url.replace("postgresql://", "postgresql+asyncpg://")
        return url
    
    def get_celery_config(self) -> Dict[str, Any]:
        """
        Get Celery configuration
        """
        return {
            "broker_url": self.CELERY_BROKER_URL or self.REDIS_URL,
            "result_backend": self.CELERY_RESULT_BACKEND or self.REDIS_URL,
            "task_serializer": "json",
            "accept_content": ["json"],
            "result_serializer": "json",
            "timezone": "UTC",
            "enable_utc": True,
        }
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
        # Allow extra fields for forward compatibility
        extra = "allow"

# Create settings instance
settings = Settings()

# Export commonly used settings
__all__ = ["settings"]