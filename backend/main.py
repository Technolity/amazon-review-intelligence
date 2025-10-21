
"""
Enhanced FastAPI application with AI/NLP capabilities.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.core.config import settings
from app.api.endpoints import analyze, reviews, export, insights

# Lifespan context manager for startup/shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"🤖 AI Features: {'Enabled' if settings.ENABLE_AI else 'Disabled'}")
    print(f"💭 Emotion Detection: {'Enabled' if settings.ENABLE_EMOTIONS else 'Disabled'}")
    print(f"🔧 Debug Mode: {'ON' if settings.DEBUG else 'OFF'}")
    
    # Download required NLTK data
    import nltk
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('vader_lexicon', quiet=True)
    
    yield
    
    # Shutdown
    print("👋 Shutting down...")

# Create app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analyze.router, prefix="/api/v1/analyze", tags=["Analysis"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(export.router, prefix="/api/v1/export", tags=["Export"])
app.include_router(insights.router, prefix="/api/v1/insights", tags=["Insights"])

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "ai_enabled": settings.ENABLE_AI,
        "endpoints": {
            "analyze": "/api/v1/analyze",
            "sentiment": "/api/v1/analyze/sentiment/{asin}",
            "insights": "/api/v1/analyze/insights/{asin}",
            "reviews": "/api/v1/reviews",
            "export": "/api/v1/export"
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ai_models": {
            "sentiment": "active" if settings.ENABLE_AI else "disabled",
            "emotions": "active" if settings.ENABLE_EMOTIONS else "disabled",
            "topics": "active",
            "insights": "active" if settings.OPENAI_API_KEY else "limited"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )