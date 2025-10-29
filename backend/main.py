"""
Enhanced FastAPI Application - Production Ready with Mock Data
Amazon Review Intelligence System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os

from app.core.config import settings
from app.services.mock_data import mock_generator
from app.services.free_ai_nlp import free_ai_nlp

# Lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("=" * 60)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)
    print(f"📍 Environment: {'Development' if settings.DEBUG else 'Production'}")
    print(f"🔧 Debug Mode: {'ON' if settings.DEBUG else 'OFF'}")
    print(f"🤖 AI Mode: Free NLP Stack (VADER + TextBlob + NLTK)")
    print(f"📊 Data Source: Mock Generator (for development)")
    print(f"🌐 CORS Origins: {settings.ALLOWED_ORIGINS}")
    print(f"🔗 Host: {settings.HOST}:{settings.PORT}")
    print("=" * 60)
    
    # Download NLTK data
    try:
        import nltk
        print("📥 Downloading NLTK data...")
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        print("✅ NLTK data ready")
    except Exception as e:
        print(f"⚠️ NLTK setup warning: {e}")
    
    print("✅ Application ready!\n")
    
    yield
    
    # Shutdown
    print("\n👋 Shutting down gracefully...")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Amazon Review Analysis Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============= ROOT ENDPOINTS =============

@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "mode": "development" if settings.DEBUG else "production",
        "data_source": "mock_generator",
        "ai_models": "free_nlp_stack",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": {
                "reviews": "/api/v1/reviews/fetch",
                "analyze": "/api/v1/analyze",
                "insights": "/api/v1/insights"
            }
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2025-01-01T00:00:00Z",
        "services": {
            "api": "operational",
            "nlp": "operational",
            "mock_data": "operational"
        },
        "ai_models": {
            "sentiment": "VADER (active)",
            "emotions": "keyword_based (active)",
            "themes": "frequency_analysis (active)",
            "insights": "rule_based (active)"
        }
    }


# ============= API V1 ENDPOINTS =============

@app.post("/api/v1/reviews/fetch")
async def fetch_reviews(request: dict):
    """
    Fetch mock reviews for a product
    """
    try:
        asin = request.get("asin", "B08N5WRWNW")
        max_reviews = request.get("max_reviews", 50)
        country = request.get("country", "US")  # NEW: Accept country parameter
        
        print(f"\n📦 Fetching mock reviews for ASIN: {asin}, Country: {country}")
        
        # Generate mock reviews with country awareness
        reviews_data = mock_generator.generate_reviews(
            count=min(max_reviews, 100),
            asin=asin,
            country=country  # Pass country to mock generator
        )
        
        print(f"✅ Generated {reviews_data['total_reviews']} mock reviews for {country}\n")
        
        return reviews_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/analyze")
async def analyze_reviews(request: dict):
    """
    Comprehensive analysis with free AI/NLP
    """
    try:
        asin = request.get("asin", "B08N5WRWNW")
        max_reviews = request.get("max_reviews", 50)
        enable_ai = request.get("enable_ai", True)
        country = request.get("country", "US")  # NEW: Accept country parameter
        
        print(f"\n🔍 Starting analysis for ASIN: {asin}")
        print(f"   Reviews: {max_reviews}, AI: {enable_ai}, Country: {country}")
        
        # Step 1: Get reviews
        print("  1️⃣ Generating mock reviews...")
        reviews_data = mock_generator.generate_reviews(
            count=min(max_reviews, 100),
            asin=asin,
            country=country  # Pass country to mock generator
        )
        
        # Step 2: AI/NLP Analysis
        if enable_ai:
            print("  2️⃣ Running AI/NLP analysis...")
            ai_analysis = free_ai_nlp.analyze_review_batch(reviews_data["reviews"])
            
            print("  3️⃣ Generating insights...")
            insights = free_ai_nlp.generate_insights(ai_analysis)
            
            # Combine results
            result = {
                "success": True,
                "asin": asin,
                "country": country,  # Include country in response 
                "total_reviews": reviews_data["total_reviews"],
                "average_rating": reviews_data["average_rating"],
                "rating_distribution": reviews_data["rating_distribution"],
                "sentiment_distribution": ai_analysis["sentiment_distribution"],
                "aggregate_metrics": ai_analysis["aggregate_metrics"],
                "themes": ai_analysis["themes"],
                "top_keywords": ai_analysis["top_keywords"],
                "insights": insights,
                "reviews": ai_analysis["reviews"][:20],
                "product_info": reviews_data["product_info"],
                "ai_provider": "free_nlp_stack",
                "data_source": "mock_generator"
            }
        else:
            # Basic analysis without AI
            result = {
                **reviews_data,
                "ai_enabled": False
            }
        
        print("  ✅ Analysis complete!\n")
        return result
        
    except Exception as e:
        print(f"  ❌ Analysis failed: {e}\n")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/analyze/{asin}")
async def analyze_by_asin(asin: str, max_reviews: int = 50, country: str = "US"):
    """
    Quick analysis by ASIN (GET request)
    """
    return await analyze_reviews({
        "asin": asin,
        "max_reviews": max_reviews,
        "enable_ai": True,
        "country": country  # NEW: Include country parameter
    })


@app.post("/api/v1/insights")
async def generate_insights(request: dict):
    """
    Generate advanced insights from analysis
    """
    try:
        analysis_data = request.get("analysis_data")
        
        if not analysis_data:
            raise HTTPException(status_code=400, detail="analysis_data required")
        
        insights = free_ai_nlp.generate_insights(analysis_data)
        
        return {
            "success": True,
            "insights": insights
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/product/{asin}")
async def get_product_info(asin: str):
    """
    Get mock product information
    """
    try:
        product_info = mock_generator.get_sample_product_info(asin)
        return {
            "success": True,
            "product": product_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============= ERROR HANDLERS =============

@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "path": str(request.url),
            "tip": "Check /docs for available endpoints"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "tip": "Check logs for details"
        }
    )


# ============= DEVELOPMENT SERVER =============

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )
