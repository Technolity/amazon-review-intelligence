"""
Application configuration with environment variables.
"""

import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    # Application
    APP_NAME: str = os.getenv("APP_NAME", "Amazon Review Intelligence")
    APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    ALLOWED_ORIGINS: List[str] = os.getenv(
        "ALLOWED_ORIGINS",
        "https://amazon-review-intelligence.vercel.app/,http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    
    # Data Source Configuration
    # Options: "mock", "apify", "real"
    DATA_SOURCE: str = os.getenv("DATA_SOURCE", "mock").lower()
    
    # AI/NLP Features
    ENABLE_AI: bool = os.getenv("ENABLE_AI", "true").lower() == "true"
    ENABLE_EMOTIONS: bool = os.getenv("ENABLE_EMOTIONS", "true").lower() == "true"
    
    # Apify Settings
    APIFY_API_TOKEN: str = os.getenv("APIFY_API_TOKEN", "")
    APIFY_ACTOR_ID: str = os.getenv("APIFY_ACTOR_ID", "junglee/amazon-reviews-scraper")
    MAX_REVIEWS_PER_REQUEST: int = int(os.getenv("MAX_REVIEWS_PER_REQUEST", "100"))
    
    # OpenAI Settings (Optional)
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    OPENAI_MAX_TOKENS: int = int(os.getenv("OPENAI_MAX_TOKENS", "500"))
    
    # Hugging Face Settings (Optional)
    HUGGINGFACE_API_KEY: str = os.getenv("HUGGINGFACE_API_KEY", "")
    
    # Database Settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Redis Settings
    REDIS_URL: str = os.getenv("REDIS_URL", "")
    
    # Export Settings
    EXPORT_FOLDER: str = os.getenv("EXPORT_FOLDER", "./exports")
    MAX_EXPORT_SIZE_MB: int = int(os.getenv("MAX_EXPORT_SIZE_MB", "10"))
    EXPORT_FORMAT_DEFAULT: str = os.getenv("EXPORT_FORMAT_DEFAULT", "csv")
    
    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE: str = os.getenv("LOG_FILE", "./logs/app.log")
    LOG_MAX_SIZE_MB: int = int(os.getenv("LOG_MAX_SIZE_MB", "50"))
    LOG_BACKUP_COUNT: int = int(os.getenv("LOG_BACKUP_COUNT", "3"))
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
    RATE_LIMIT_PER_HOUR: int = int(os.getenv("RATE_LIMIT_PER_HOUR", "1000"))
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-this-secret-key-in-production")
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-this-jwt-secret")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Feature Flags
    ENABLE_EXPORT_PDF: bool = os.getenv("ENABLE_EXPORT_PDF", "true").lower() == "true"
    ENABLE_EXPORT_CSV: bool = os.getenv("ENABLE_EXPORT_CSV", "true").lower() == "true"
    ENABLE_EXPORT_EXCEL: bool = os.getenv("ENABLE_EXPORT_EXCEL", "true").lower() == "true"
    ENABLE_INSIGHTS_GENERATION: bool = os.getenv("ENABLE_INSIGHTS_GENERATION", "true").lower() == "true"
    ENABLE_THEME_EXTRACTION: bool = os.getenv("ENABLE_THEME_EXTRACTION", "true").lower() == "true"
    ENABLE_KEYWORD_CLUSTERING: bool = os.getenv("ENABLE_KEYWORD_CLUSTERING", "true").lower() == "true"
    
    # Mock Data Settings
    MOCK_DATA_MIN_REVIEWS: int = int(os.getenv("MOCK_DATA_MIN_REVIEWS", "10"))
    MOCK_DATA_MAX_REVIEWS: int = int(os.getenv("MOCK_DATA_MAX_REVIEWS", "100"))
    MOCK_DATA_DEFAULT_REVIEWS: int = int(os.getenv("MOCK_DATA_DEFAULT_REVIEWS", "50"))
    
    # Monitoring
    SENTRY_DSN: str = os.getenv("SENTRY_DSN", "")
    GA_TRACKING_ID: str = os.getenv("GA_TRACKING_ID", "")
    
    # Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM_EMAIL: str = os.getenv("SMTP_FROM_EMAIL", "noreply@yourdomain.com")
    
    # Cloud Storage
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_S3_BUCKET_NAME: str = os.getenv("AWS_S3_BUCKET_NAME", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    
    # Performance
    WORKERS: int = int(os.getenv("WORKERS", "4"))
    MAX_CONCURRENT_REQUESTS: int = int(os.getenv("MAX_CONCURRENT_REQUESTS", "100"))
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "300"))
    
    def is_using_mock_data(self) -> bool:
        """Check if application is using mock data."""
        return self.DATA_SOURCE == "mock"
    
    def is_using_apify(self) -> bool:
        """Check if application is using Apify API."""
        return self.DATA_SOURCE == "apify" and bool(self.APIFY_API_TOKEN)
    
    def has_openai_api(self) -> bool:
        """Check if OpenAI API key is configured."""
        return bool(self.OPENAI_API_KEY)
    
    def has_huggingface_api(self) -> bool:
        """Check if Hugging Face API key is configured."""
        return bool(self.HUGGINGFACE_API_KEY)
    
    def get_data_source_info(self) -> dict:
        """Get information about current data source configuration."""
        return {
            "data_source": self.DATA_SOURCE,
            "using_mock": self.is_using_mock_data(),
            "apify_configured": bool(self.APIFY_API_TOKEN),
            "openai_configured": self.has_openai_api(),
            "huggingface_configured": self.has_huggingface_api(),
            "ai_enabled": self.ENABLE_AI,
            "emotions_enabled": self.ENABLE_EMOTIONS
        }


# Singleton instance
settings = Settings()


# Validation on startup
def validate_settings():
    """Validate settings and print warnings."""
    
    if settings.DATA_SOURCE == "apify" and not settings.APIFY_API_TOKEN:
        print("⚠️  WARNING: DATA_SOURCE is set to 'apify' but APIFY_API_TOKEN is not configured!")
        print("   Falling back to mock data. Set APIFY_API_TOKEN in .env to use real data.")
        settings.DATA_SOURCE = "mock"
    
    if settings.DEBUG:
        print(f"🔧 DEBUG MODE: Enabled")
    
    if settings.is_using_mock_data():
        print(f"📊 DATA SOURCE: Mock Data (no API costs)")
    else:
        print(f"📊 DATA SOURCE: {settings.DATA_SOURCE.upper()}")
    
    if not settings.ENABLE_AI:
        print(f"⚠️  AI/NLP features are disabled")


# Run validation
validate_settings()