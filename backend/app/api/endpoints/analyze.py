"""
API endpoints for analyzing reviews.
"""

from fastapi import APIRouter, HTTPException

from app.models.schemas import AnalyzeRequest, AnalysisResponse
from app.services.amazon_scraper import amazon_scraper
from app.services.analyzer import review_analyzer

router = APIRouter()


@router.post("/", response_model=AnalysisResponse)
async def analyze_reviews(request: AnalyzeRequest):
    """
    Analyze reviews for a product.
    
    Args:
        request: AnalyzeRequest with ASIN and options
    
    Returns:
        AnalysisResponse with complete analysis
    """
    import traceback
    
    try:
        print(f"\n📊 Analyze request received for ASIN: {request.asin}")
        print(f"   Country: {request.country}, Multi-country: {request.multi_country}")
        
        # Fetch reviews
        print("  1️⃣ Fetching reviews...")
        reviews_data = amazon_scraper.fetch_reviews(
            asin_or_url=request.asin,
            max_reviews=500,
            country=request.country,
            multi_country=request.multi_country
        )
        
        if not reviews_data.get("success"):
            error_msg = reviews_data.get("error", "Failed to fetch reviews")
            error_type = reviews_data.get("error_type", "unknown")
            suggestion = reviews_data.get("suggestion", "")
            
            print(f"  ❌ Fetch failed: {error_msg}")
            
            # Return detailed error to frontend
            raise HTTPException(
                status_code=503 if error_type in ['timeout', 'connection_error'] else 400,
                detail={
                    "message": error_msg,
                    "error_type": error_type,
                    "suggestion": suggestion,
                    "asin": request.asin
                }
            )
        
        print(f"  ✅ Fetched {reviews_data.get('total_reviews', 0)} reviews")
        
        # Analyze reviews
        print("  2️⃣ Analyzing reviews...")
        analysis_result = review_analyzer.analyze_reviews(reviews_data)
        
        if not analysis_result.get("success"):
            print(f"  ❌ Analysis failed: {analysis_result.get('error')}")
            raise HTTPException(
                status_code=400,
                detail=analysis_result.get("error", "Analysis failed")
            )
        
        print("  ✅ Analysis complete\n")
        return analysis_result
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ EXCEPTION in analyze_reviews:")
        print(f"   Error: {e}")
        print(f"   Type: {type(e).__name__}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{asin}")
async def analyze_reviews_by_asin(
    asin: str,
    country: str = "IN",
    multi_country: bool = True
):
    """
    Analyze reviews using GET request with ASIN.
    
    Args:
        asin: Product ASIN
        country: Amazon country code
        multi_country: Whether to try multiple countries
    
    Returns:
        Analysis results
    """
    try:
        # Fetch reviews
        reviews_data = amazon_scraper.fetch_reviews(
            asin_or_url=asin.upper(),
            max_reviews=500,
            country=country,
            multi_country=multi_country
        )
        
        if not reviews_data.get("success"):
            raise HTTPException(
                status_code=400,
                detail=reviews_data.get("error", "Failed to fetch reviews")
            )
        
        # Analyze
        analysis_result = review_analyzer.analyze_reviews(reviews_data)
        
        if not analysis_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=analysis_result.get("error", "Analysis failed")
            )
        
        return analysis_result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))