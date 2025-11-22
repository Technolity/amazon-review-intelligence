"""
Amazon Review Intelligence - Production Backend
Full-featured FastAPI application with database, OpenAI, and enterprise features
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
import time
import traceback
from typing import Any

# Core imports
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.db.session import engine, SessionLocal
from app.db.init_db import init_db
from app.api.v1.router import api_router
from app.core.exceptions import AppException
from app.services.cache_service import cache_service

# Background tasks
from app.background.scheduler import start_scheduler

# Setup logging
setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifecycle - startup and shutdown events
    """
    # Startup
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database
    try:
        logger.info("📊 Initializing database...")
        init_db()
        logger.success("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        if not settings.DEBUG:
            raise
    
    # Initialize cache
    try:
        logger.info("💾 Initializing cache service...")
        await cache_service.initialize()
        logger.success("✅ Cache service initialized")
    except Exception as e:
        logger.warning(f"⚠️ Cache initialization failed: {e}")
    
    # Start background scheduler
    if settings.ENABLE_BACKGROUND_TASKS:
        try:
            logger.info("⏰ Starting background scheduler...")
            start_scheduler()
            logger.success("✅ Background scheduler started")
        except Exception as e:
            logger.warning(f"⚠️ Scheduler initialization failed: {e}")
    
    # Log startup complete
    logger.success(f"✨ {settings.APP_NAME} is ready!")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down application...")
    
    # Close cache connections
    await cache_service.close()
    
    # Close database connections
    engine.dispose()
    
    logger.info("✅ Shutdown complete")

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered Amazon product review analysis with advanced NLP and insights generation",
    version=settings.APP_VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs" if settings.SHOW_DOCS else None,
    redoc_url="/redoc" if settings.SHOW_DOCS else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Page", "X-Per-Page"]
)

# Add trusted host middleware for security
if settings.ALLOWED_HOSTS:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS
    )

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """
    Add processing time to response headers
    """
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    """
    Handle application-specific exceptions
    """
    logger.error(f"Application error: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "message": exc.message,
                "code": exc.error_code,
                "details": exc.details
            }
        }
    )

# Generic exception handler
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected exceptions
    """
    error_id = str(time.time())
    logger.error(f"Unexpected error [{error_id}]: {str(exc)}\n{traceback.format_exc()}")
    
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "message": str(exc),
                    "error_id": error_id,
                    "traceback": traceback.format_exc()
                }
            }
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "message": "An unexpected error occurred",
                "error_id": error_id
            }
        }
    )

# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring
    """
    health_status = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": time.time(),
        "services": {}
    }
    
    # Check database
    try:
        db: Session = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        health_status["services"]["database"] = "operational"
    except Exception as e:
        health_status["services"]["database"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check cache
    try:
        await cache_service.ping()
        health_status["services"]["cache"] = "operational"
    except Exception:
        health_status["services"]["cache"] = "unavailable"
    
    # Check external services
    health_status["services"]["apify"] = "configured" if settings.APIFY_API_TOKEN else "not configured"
    health_status["services"]["openai"] = "configured" if settings.OPENAI_API_KEY else "not configured"
    
    return health_status

# Metrics endpoint (Prometheus format)
@app.get("/metrics", tags=["System"])
async def metrics():
    """
    Prometheus-compatible metrics endpoint
    """
    # This would typically integrate with prometheus_client
    # For now, return basic metrics
    metrics_data = []
    
    # Add basic metrics
    metrics_data.append(f'app_info{{version="{settings.APP_VERSION}",environment="{settings.ENVIRONMENT}"}} 1')
    metrics_data.append(f'app_uptime_seconds {time.time()}')
    
    return "\n".join(metrics_data)

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with API information
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "AI-powered Amazon product review analysis",
        "documentation": "/docs" if settings.SHOW_DOCS else None,
        "health": "/health",
        "api": settings.API_V1_PREFIX
    }

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )