"""
Enhanced FastAPI Application - Production Ready with Apify Integration
Amazon Review Intelligence System
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from datetime import datetime

from app.core.config import settings
from app.services.apify_service import apify_service  # Use service singleton
from app.services.free_ai_nlp import free_ai_nlp
from app.services.exporter import exporter

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 60)
    print(f"📍 Environment: {'Development' if settings.DEBUG else 'Production'}")
    print(f"🔧 Debug Mode: {'ON' if settings.DEBUG else 'OFF'}")
    print(f"🤖 AI Mode: Free NLP Stack (VADER + TextBlob + NLTK)")
    print(f"🌐 CORS Origins: {settings.ALLOWED_ORIGINS}")
    print(f"🔗 Host: {settings.HOST}:{settings.PORT}")
    print("=" * 60)
    
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
    print("\n👋 Shutting down gracefully...")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered Amazon Review Analysis Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "mode": "development" if settings.DEBUG else "production",
        "data_source": "apifyservice",
        "ai_models": "free_nlp_stack",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": {
                "reviews": "/api/v1/reviews/fetch",
                "analyze": "/api/v1/analyze",
                "insights": "/api/v1/insights",
                "export_csv": "/api/v1/export/csv",
                "export_pdf": "/api/v1/export/pdf"
            }
        }
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "api": "operational",
            "nlp": "operational",
            "apify": "operational",
            "export": "operational"
        },
        "ai_models": {
            "sentiment": "VADER (active)",
            "emotions": "keyword_based (active)",
            "themes": "frequency_analysis (active)",
            "insights": "rule_based (active)"
        }
    }

@app.post("/api/v1/reviews/fetch")
async def fetch_reviews(request: dict):
    try:
        asin = request.get("asin", "B08N5WRWNW")
        max_reviews = min(request.get("max_reviews", 50), 100)
        country = request.get("country", "US")
        
        print(f"\n📦 Fetching reviews for ASIN: {asin}, Country: {country}, Max: {max_reviews}")
        
        reviews_data = await apify_service.fetch_reviews(
            asin=asin,
            max_reviews=max_reviews,
            country=country
        )
        
        print(f"✅ Fetched {len(reviews_data['reviews'])} reviews\n")
        
        return reviews_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/analyze")
async def analyze_reviews(request: dict):
    try:
        asin = request.get("asin", "B08N5WRWNW")
        max_reviews = min(request.get("max_reviews", 50), 100)
        enable_ai = request.get("enable_ai", True)
        country = request.get("country", "US")
        
        print(f"\n🔍 Starting analysis for ASIN: {asin}")
        print(f"   Reviews: {max_reviews}, AI: {enable_ai}, Country: {country}")
        
        reviews_data = apify_service.fetch_reviews(
            asin=asin,
            max_reviews=max_reviews,
            country=country
        )
        
        if enable_ai:
            print("   Running AI/NLP analysis...")
            ai_analysis = free_ai_nlp.analyze_review_batch(reviews_data["reviews"])
            print("   Generating insights...")
            insights = free_ai_nlp.generate_insights(ai_analysis)
            result = {
                "success": True,
                "asin": asin,
                "country": country,
                "total_reviews": reviews_data["total_reviews"],
                "average_rating": reviews_data.get("average_rating"),
                "rating_distribution": reviews_data.get("rating_distribution"),
                "sentiment_distribution": ai_analysis["sentiment_distribution"],
                "aggregate_metrics": ai_analysis["aggregate_metrics"],
                "themes": ai_analysis["themes"],
                "top_keywords": ai_analysis["top_keywords"],
                "insights": insights,
                "reviews": ai_analysis["reviews"][:20],
                "product_info": reviews_data.get("product_info"),
                "ai_provider": "free_nlp_stack",
                "data_source": "apify"
            }
        else:
            result = {
                **reviews_data,
                "ai_enabled": False
            }
        
        print("   ✅ Analysis complete!\n")
        return result
        
    except Exception as e:
        print(f"   ❌ Analysis failed: {e}\n")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/analyze/{asin}")
async def analyze_by_asin(asin: str, max_reviews: int = 50, country: str = "US"):
    return analyze_reviews({
        "asin": asin,
        "max_reviews": max_reviews,
        "enable_ai": True,
        "country": country
    })


@app.post("/api/v1/insights")
async def generate_insights(request: dict):
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
async def get_product_info(asin: str, country: str = "US"):
    try:
        product_info = apify_service.get_product_info(asin, country=country)
        return {
            "success": True,
            "product": product_info
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/export/csv")
async def export_csv(request: dict):
    try:
        analysis_data = request.get("analysis_data")
        if not analysis_data:
            raise HTTPException(status_code=400, detail="analysis_data required")
        
        print(f"📤 Exporting CSV for ASIN: {analysis_data.get('asin', 'N/A')}")
        
        result = exporter.export_to_csv(analysis_data)
        
        if result.get("success"):
            file_path = result.get("file_path")
            if os.path.exists(file_path):
                filename = os.path.basename(file_path)
                print(f"✅ CSV export successful: {filename}")
                return FileResponse(
                    path=file_path,
                    media_type="text/csv",
                    filename=filename
                )
            else:
                raise HTTPException(status_code=500, detail="Export file not found")
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Export failed"))
    except Exception as e:
        print(f"❌ CSV export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/export/pdf")
async def export_pdf(request: dict):
    try:
        analysis_data = request.get("analysis_data")
        if not analysis_data:
            raise HTTPException(status_code=400, detail="analysis_data required")
        
        print(f"📤 Exporting PDF for ASIN: {analysis_data.get('asin', 'N/A')}")
        
        result = exporter.export_to_pdf(analysis_data)
        
        if result.get("success"):
            file_path = result.get("file_path")
            if os.path.exists(file_path):
                filename = os.path.basename(file_path)
                print(f"✅ PDF export successful: {filename}")
                return FileResponse(
                    path=file_path,
                    media_type="application/pdf",
                    filename=filename
                )
            else:
                raise HTTPException(status_code=500, detail="Export file not found")
        else:
            raise HTTPException(status_code=500, detail=result.get("error", "Export failed"))
    except Exception as e:
        print(f"❌ PDF export failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if settings.DEBUG else "warning"
    )
