"""
Analysis Endpoint - Main API endpoint for product review analysis
Integrates all services for comprehensive analysis
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import asyncio
import time
import hashlib

from app.core.config import settings
from app.core.logging import logger
from app.db.session import get_db
from app.api.deps import get_current_user, get_current_active_user
from app.models.user import User
from app.models.product import Product
from app.models.review import Review
from app.models.database import AnalysisResult
from app.schemas.analysis import (
    AnalysisRequest,
    AnalysisResponse,
    BatchAnalysisRequest,
    BatchAnalysisResponse
)
from app.services.apify_service import apify_service
from app.services.nlp_service import nlp_service
from app.services.openai_service import openai_service
from app.services.insight_service import insight_service
from app.services.bot_detector import bot_detector
from app.services.cache_service import cache_service
from app.core.exceptions import AppException

router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_product_reviews(
    request: AnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Comprehensive product review analysis with AI/NLP
    
    This endpoint:
    1. Fetches reviews from Amazon via Apify
    2. Performs sentiment analysis using multiple models
    3. Detects emotions and extracts keywords
    4. Identifies themes and patterns
    5. Generates AI-powered insights
    6. Stores results in database
    """
    start_time = time.time()
    
    # Generate cache key
    cache_key = f"analysis:{request.asin}:{request.country}:{request.max_reviews}"
    
    # Check cache if enabled
    if request.use_cache and cache_service.is_available():
        cached_result = await cache_service.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached analysis for ASIN: {request.asin}")
            return AnalysisResponse(**cached_result)
    
    try:
        # Step 1: Fetch reviews from Amazon
        logger.info(f"Starting analysis for ASIN: {request.asin}")
        
        review_data = await apify_service.fetch_reviews(
            asin=request.asin,
            country=request.country,
            max_reviews=request.max_reviews,
            use_cache=request.use_cache,
            db=db
        )
        
        if not review_data.get("success"):
            raise AppException(
                message="Failed to fetch reviews",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                details=review_data.get("error")
            )
        
        # Step 2: Perform NLP analysis
        logger.info(f"Analyzing {len(review_data['reviews'])} reviews")
        
        nlp_results = await nlp_service.analyze_reviews(
            reviews=review_data["reviews"],
            enable_advanced=request.enable_advanced_nlp
        )
        
        # Step 3: Bot detection
        if settings.ENABLE_BOT_DETECTION and bot_detector:
            logger.info("Running bot detection")
            for i, review in enumerate(nlp_results["reviews"]):
                bot_analysis = await bot_detector.analyze_review(review)
                nlp_results["reviews"][i].update(bot_analysis)
        
        # Step 4: Generate AI insights (if OpenAI is enabled)
        ai_insights = None
        ai_summary = None
        
        if request.enable_ai and openai_service and openai_service.is_available():
            logger.info("Generating AI insights")
            
            # Generate insights
            ai_insights = await openai_service.generate_insights(
                reviews=nlp_results["reviews"],
                product_info=review_data["product_info"],
                aggregate_analysis=nlp_results["aggregate"]
            )
            
            # Generate executive summary
            ai_summary = await openai_service.generate_summary(
                reviews=nlp_results["reviews"],
                insights=ai_insights,
                max_length=request.summary_length
            )
        
        # Step 5: Advanced insights generation
        advanced_insights = await insight_service.generate_comprehensive_insights(
            reviews=nlp_results["reviews"],
            nlp_aggregate=nlp_results["aggregate"],
            product_info=review_data["product_info"]
        )
        
        # Step 6: Calculate final metrics
        processing_time = time.time() - start_time
        
        # Prepare response
        response_data = {
            "success": True,
            "asin": request.asin,
            "country": request.country,
            "product_info": review_data["product_info"],
            "total_reviews": len(nlp_results["reviews"]),
            "average_rating": review_data["average_rating"],
            "rating_distribution": review_data["rating_distribution"],
            "sentiment_distribution": nlp_results["aggregate"]["sentiment_distribution"],
            "reviews": nlp_results["reviews"][:request.include_reviews_count] if request.include_reviews else [],
            "keywords": nlp_results["aggregate"]["keywords"][:20],
            "themes": nlp_results["aggregate"]["themes"][:10],
            "emotions": nlp_results["aggregate"]["emotions_summary"],
            "insights": {
                "nlp_insights": nlp_results["insights"],
                "ai_insights": ai_insights,
                "advanced_insights": advanced_insights
            },
            "summary": ai_summary or advanced_insights.get("executive_summary"),
            "data_source": review_data["data_source"],
            "ai_provider": "openai" if ai_insights else "local",
            "processing_time": processing_time,
            "timestamp": datetime.utcnow().isoformat(),
            "cache_ttl": settings.CACHE_TTL
        }
        
        # Step 7: Save analysis results to database
        if request.save_to_db:
            analysis_result = AnalysisResult(
                product_id=review_data.get("product_id"),
                user_id=current_user.id,
                analysis_type=request.analysis_type,
                settings=request.dict(),
                total_reviews_analyzed=len(nlp_results["reviews"]),
                sentiment_scores=nlp_results["aggregate"]["sentiment_distribution"],
                emotion_scores=nlp_results["aggregate"]["emotions_summary"],
                keywords=nlp_results["aggregate"]["keywords"],
                themes=nlp_results["aggregate"]["themes"],
                insights=advanced_insights.get("key_insights", []),
                summary=ai_summary or advanced_insights.get("executive_summary"),
                ai_provider="openai" if ai_insights else "local",
                ai_model=settings.OPENAI_MODEL if ai_insights else "local_nlp",
                processing_time=processing_time
            )
            db.add(analysis_result)
            db.commit()
            
            response_data["analysis_id"] = str(analysis_result.id)
        
        # Step 8: Cache results
        if request.use_cache and cache_service.is_available():
            background_tasks.add_task(
                cache_service.set,
                cache_key,
                response_data,
                ttl=settings.CACHE_TTL
            )
        
        # Step 9: Track API usage
        background_tasks.add_task(
            track_api_usage,
            user_id=current_user.id,
            endpoint="/analyze",
            status_code=200,
            response_time=processing_time * 1000,
            db=db
        )
        
        logger.success(f"Analysis completed for ASIN: {request.asin} in {processing_time:.2f}s")
        return AnalysisResponse(**response_data)
        
    except AppException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed for ASIN {request.asin}: {str(e)}")
        
        # Track error
        background_tasks.add_task(
            track_api_usage,
            user_id=current_user.id,
            endpoint="/analyze",
            status_code=500,
            error_message=str(e),
            db=db
        )
        
        raise AppException(
            message="Analysis failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"error": str(e), "asin": request.asin}
        )


@router.post("/analyze/batch", response_model=BatchAnalysisResponse, tags=["Analysis"])
async def batch_analyze_products(
    request: BatchAnalysisRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Batch analysis for multiple products
    
    Analyzes up to 10 products in parallel
    """
    if len(request.asins) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 ASINs allowed per batch"
        )
    
    start_time = time.time()
    
    # Create analysis tasks
    tasks = []
    for asin in request.asins:
        analysis_request = AnalysisRequest(
            asin=asin,
            country=request.country,
            max_reviews=request.max_reviews_per_product,
            enable_ai=request.enable_ai,
            enable_advanced_nlp=request.enable_advanced_nlp,
            analysis_type=request.analysis_type,
            include_reviews=False,  # Don't include full reviews in batch
            save_to_db=request.save_to_db,
            use_cache=request.use_cache
        )
        
        tasks.append(
            analyze_product_reviews(
                request=analysis_request,
                background_tasks=background_tasks,
                db=db,
                current_user=current_user
            )
        )
    
    # Execute in parallel
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    # Process results
    successful = []
    failed = []
    
    for asin, result in zip(request.asins, results):
        if isinstance(result, Exception):
            failed.append({
                "asin": asin,
                "error": str(result)
            })
        else:
            successful.append(result.dict())
    
    processing_time = time.time() - start_time
    
    return BatchAnalysisResponse(
        success=len(failed) == 0,
        total_products=len(request.asins),
        successful_count=len(successful),
        failed_count=len(failed),
        results=successful,
        errors=failed,
        processing_time=processing_time,
        timestamp=datetime.utcnow().isoformat()
    )


@router.get("/analyze/{analysis_id}", response_model=AnalysisResponse, tags=["Analysis"])
async def get_analysis_result(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieve a previous analysis result by ID
    """
    analysis = db.query(AnalysisResult).filter(
        AnalysisResult.id == analysis_id,
        AnalysisResult.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Get associated product and reviews
    product = db.query(Product).filter(Product.id == analysis.product_id).first()
    reviews = db.query(Review).filter(Review.product_id == analysis.product_id).all()
    
    return AnalysisResponse(
        success=True,
        analysis_id=str(analysis.id),
        asin=product.asin,
        product_info=product.to_dict(),
        total_reviews=analysis.total_reviews_analyzed,
        average_rating=product.average_rating,
        sentiment_distribution=analysis.sentiment_scores,
        emotions=analysis.emotion_scores,
        keywords=analysis.keywords,
        themes=analysis.themes,
        insights={
            "stored_insights": analysis.insights
        },
        summary=analysis.summary,
        ai_provider=analysis.ai_provider,
        processing_time=analysis.processing_time,
        timestamp=analysis.created_at.isoformat()
    )


@router.get("/analyze/history", tags=["Analysis"])
async def get_analysis_history(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user's analysis history
    """
    total = db.query(AnalysisResult).filter(
        AnalysisResult.user_id == current_user.id
    ).count()
    
    analyses = db.query(AnalysisResult).filter(
        AnalysisResult.user_id == current_user.id
    ).order_by(AnalysisResult.created_at.desc()).offset(skip).limit(limit).all()
    
    history = []
    for analysis in analyses:
        product = db.query(Product).filter(Product.id == analysis.product_id).first()
        history.append({
            "id": str(analysis.id),
            "asin": product.asin if product else None,
            "product_title": product.title if product else None,
            "total_reviews": analysis.total_reviews_analyzed,
            "created_at": analysis.created_at.isoformat(),
            "processing_time": analysis.processing_time,
            "ai_provider": analysis.ai_provider
        })
    
    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "history": history
    }


@router.post("/analyze/compare", tags=["Analysis"])
async def compare_products(
    asins: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Compare analysis results for multiple products
    """
    if len(asins) < 2 or len(asins) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide 2-5 ASINs for comparison"
        )
    
    comparison_data = []
    
    for asin in asins:
        # Get latest analysis for each product
        product = db.query(Product).filter(Product.asin == asin).first()
        if not product:
            comparison_data.append({
                "asin": asin,
                "error": "Product not found"
            })
            continue
        
        latest_analysis = db.query(AnalysisResult).filter(
            AnalysisResult.product_id == product.id
        ).order_by(AnalysisResult.created_at.desc()).first()
        
        if not latest_analysis:
            comparison_data.append({
                "asin": asin,
                "error": "No analysis found"
            })
            continue
        
        comparison_data.append({
            "asin": asin,
            "title": product.title,
            "average_rating": product.average_rating,
            "total_reviews": product.total_reviews,
            "sentiment_scores": latest_analysis.sentiment_scores,
            "emotion_scores": latest_analysis.emotion_scores,
            "top_keywords": latest_analysis.keywords[:10] if latest_analysis.keywords else [],
            "analysis_date": latest_analysis.created_at.isoformat()
        })
    
    # Generate comparison insights
    if len([d for d in comparison_data if "error" not in d]) >= 2:
        comparison_insights = await insight_service.generate_comparison_insights(comparison_data)
    else:
        comparison_insights = []
    
    return {
        "products": comparison_data,
        "insights": comparison_insights,
        "timestamp": datetime.utcnow().isoformat()
    }


async def track_api_usage(
    user_id: str,
    endpoint: str,
    status_code: int,
    response_time: float = None,
    error_message: str = None,
    db: Session = None
):
    """
    Track API usage for analytics and rate limiting
    """
    try:
        from app.models.database import APIUsage
        
        usage = APIUsage(
            user_id=user_id,
            endpoint=endpoint,
            method="POST",
            status_code=status_code,
            response_time=response_time,
            error_message=error_message
        )
        
        if db:
            db.add(usage)
            db.commit()
    except Exception as e:
        logger.error(f"Failed to track API usage: {e}")


# Export router
__all__ = ["router"]