"""
Core configuration - Simplified version without pydantic-settings.
Uses environment variables with python-dotenv.
"""

import os
from typing import List
from functools import lru_cache
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""
    
    def __init__(self):
        # Application Info
        self.APP_NAME: str = os.getenv("APP_NAME", "Amazon Review Intelligence")
        self.APP_VERSION: str = os.getenv("APP_VERSION", "1.0.0")
        self.DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
        
        # API Configuration
        self.API_V1_PREFIX: str = "/api/v1"
        
        # ScraperAPI
        self.SCRAPER_API_KEY: str = os.getenv("SCRAPER_API_KEY", "")
        self.USE_MOCK_DATA: bool = os.getenv("USE_MOCK_DATA", "False").lower() == "true"
        
        # CORS - Simple comma-separated list
        allowed_origins = os.getenv(
            "ALLOWED_ORIGINS", 
            "http://localhost:3000,http://127.0.0.1:3000"
        )
        self.ALLOWED_ORIGINS: List[str] = [
            origin.strip() for origin in allowed_origins.split(",")
        ]
        
        # Server
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))
        
        # Paths
        self.DATA_FOLDER: str = os.getenv("DATA_FOLDER", "./data")
        self.EXPORT_FOLDER: str = os.getenv("EXPORT_FOLDER", "./exports")
        
        # Analysis Settings
        self.MAX_REVIEWS_PER_REQUEST: int = int(
            os.getenv("MAX_REVIEWS_PER_REQUEST", "100")
        )
        self.MIN_KEYWORD_FREQUENCY: int = int(
            os.getenv("MIN_KEYWORD_FREQUENCY", "3")
        )
        self.TOP_KEYWORDS_COUNT: int = int(
            os.getenv("TOP_KEYWORDS_COUNT", "20")
        )
        
        # Sentiment Thresholds
        self.POSITIVE_THRESHOLD: float = float(
            os.getenv("POSITIVE_THRESHOLD", "4.0")
        )
        self.NEGATIVE_THRESHOLD: float = float(
            os.getenv("NEGATIVE_THRESHOLD", "2.5")
        )
        
        # Rate Limiting
        self.RATE_LIMIT: int = int(os.getenv("RATE_LIMIT", "100"))
        
        # Create necessary folders
        os.makedirs(self.DATA_FOLDER, exist_ok=True)
        os.makedirs(self.EXPORT_FOLDER, exist_ok=True)


@lru_cache()
def get_settings() -> Settings:
    """
    Create cached instance of settings.
    This ensures settings are loaded only once.
    """
    return Settings()


# Singleton instance
settings = get_settings()