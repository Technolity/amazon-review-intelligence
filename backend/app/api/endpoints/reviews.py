"""
API endpoints for fetching reviews.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.models.schemas import ReviewFetchRequest, ReviewsResponse
from app.services.amazon_scraper import amazon_scraper

router = APIRouter()


@router.post("/fetch", response_model=ReviewsResponse)
async def fetch_reviews(request: ReviewFetchRequest):
    """
    Fetch reviews for a product by ASIN.
    
    Args:
        request: ReviewFetchRequest with ASIN and max_reviews
    
    Returns:
        ReviewsResponse with reviews data
    """
    try:
        result = amazon_scraper.fetch_reviews(
            asin_or_url=request.asin,
            max_reviews=request.max_reviews,
            country=request.country,
            multi_country=request.multi_country
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to fetch reviews")
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/fetch/{asin}", response_model=ReviewsResponse)
async def fetch_reviews_by_asin(
    asin: str,
    max_reviews: Optional[int] = Query(500, ge=1, le=1000),
    country: str = Query("IN"),
    multi_country: bool = Query(True)
):
    """
    Fetch reviews using GET request with ASIN in path.
    
    Args:
        asin: Product ASIN
        max_reviews: Maximum number of reviews
        country: Amazon country code
        multi_country: Whether to try multiple countries
    
    Returns:
        ReviewsResponse with reviews data
    """
    try:
        result = amazon_scraper.fetch_reviews(
            asin_or_url=asin.upper(),
            max_reviews=max_reviews,
            country=country,
            multi_country=multi_country
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to fetch reviews")
            )
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))