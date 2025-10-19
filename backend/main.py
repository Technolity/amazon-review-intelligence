"""
Main FastAPI application entry point.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime

from app.core.config import settings
from app.api.endpoints import reviews, analyze, export

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Amazon Review Intelligence API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/")
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


# Include routers
app.include_router(
    reviews.router,
    prefix=f"{settings.API_V1_PREFIX}/reviews",
    tags=["Reviews"]
)

app.include_router(
    analyze.router,
    prefix=f"{settings.API_V1_PREFIX}/analyze",
    tags=["Analysis"]
)

app.include_router(
    export.router,
    prefix=f"{settings.API_V1_PREFIX}/export",
    tags=["Export"]
)


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler with detailed logging."""
    import traceback
    
    # Print full error to console
    print("\n" + "="*50)
    print("❌ ERROR OCCURRED:")
    print("="*50)
    traceback.print_exc()
    print("="*50 + "\n")
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred",
            "type": type(exc).__name__
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )