"""
Enhanced configuration with AI/NLP settings.
"""

import os
from typing import List
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Enhanced application settings."""
    
    def __init__(self):
        # Core Settings
        self.APP_NAME: str = "Amazon Review Intelligence with AI"
        self.APP_VERSION: str = "2.0.0"
        self.DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
        
        # API Configuration
        self.API_V1_PREFIX: str = "/api/v1"
        
        # Apify Configuration
        self.APIFY_API_TOKEN: str = os.getenv("APIFY_API_TOKEN", "")
        
        # AI/NLP Configuration
        self.ENABLE_AI: bool = os.getenv("ENABLE_AI", "True").lower() == "true"
        self.ENABLE_EMOTIONS: bool = os.getenv("ENABLE_EMOTIONS", "True").lower() == "true"
        self.OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
        self.OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.USE_GPU: bool = os.getenv("USE_GPU", "False").lower() == "true"
        
        # Model Settings
        self.SENTIMENT_MODEL: str = os.getenv(
            "SENTIMENT_MODEL",
            "cardiffnlp/twitter-roberta-base-sentiment-latest"
        )
        self.EMOTION_MODEL: str = os.getenv(
            "EMOTION_MODEL",
            "j-hartmann/emotion-english-distilroberta-base"
        )
        
        # Analysis Settings
        self.MAX_REVIEWS_PER_REQUEST: int = int(os.getenv("MAX_REVIEWS_PER_REQUEST", "5"))
        self.MIN_KEYWORD_FREQUENCY: int = int(os.getenv("MIN_KEYWORD_FREQUENCY", "2"))
        self.TOP_KEYWORDS_COUNT: int = int(os.getenv("TOP_KEYWORDS_COUNT", "20"))
        self.NUM_TOPICS: int = int(os.getenv("NUM_TOPICS", "5"))
        
        # Sentiment Thresholds
        self.POSITIVE_THRESHOLD: float = float(os.getenv("POSITIVE_THRESHOLD", "0.1"))
        self.NEGATIVE_THRESHOLD: float = float(os.getenv("NEGATIVE_THRESHOLD", "-0.1"))
        
        # CORS
        self.ALLOWED_ORIGINS: List[str] = [
            "http://localhost:3000",
            "http://127.0.0.1:3000"
        ]
        
        # Server
        self.HOST: str = os.getenv("HOST", "0.0.0.0")
        self.PORT: int = int(os.getenv("PORT", "8000"))
        
        # Paths
        self.DATA_FOLDER: str = os.getenv("DATA_FOLDER", "./data")
        self.EXPORT_FOLDER: str = os.getenv("EXPORT_FOLDER", "./exports")
        self.MODELS_FOLDER: str = os.getenv("MODELS_FOLDER", "./models")
        
        # Create directories
        os.makedirs(self.DATA_FOLDER, exist_ok=True)
        os.makedirs(self.EXPORT_FOLDER, exist_ok=True)
        os.makedirs(self.MODELS_FOLDER, exist_ok=True)

@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()