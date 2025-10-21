"""
Enhanced API endpoints for analyzing reviews with AI/NLP.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import Optional, Dict, Any
import traceback

from app.services.amazon_scraper import amazon_scraper
from app.services.analyzer import review_analyzer
from app.services.insights_generator import insight_generator
from app.services.report_generator import report_generator

router = APIRouter()

@router.post("/")
async def analyze_reviews_advanced(
    request: dict,
    background_tasks: BackgroundTasks
):
    """
    Enhanced review analysis with AI/NLP capabilities.
    """
    try:
        # Extract parameters
        asin = request.get("asin") or request.get("input")
        country = request.get("country", "IN")
        multi_country = request.get("multi_country", True)
        max_reviews = request.get("max_reviews", 5)
        enable_ai = request.get("enable_ai", True)
        enable_emotions = request.get("enable_emotions", True)
        
        print(f"\n🤖 AI-Enhanced Analysis for ASIN: {asin}")
        print(f"   AI: {enable_ai}, Emotions: {enable_emotions}")
        
        if not asin:
            raise HTTPException(status_code=400, detail="ASIN is required")
        
        # Fetch reviews
        print("  1️⃣ Fetching reviews...")
        reviews_data = amazon_scraper.fetch_reviews(
            asin_or_url=asin,
            max_reviews=max_reviews,
            country=country,
            multi_country=multi_country
        )
        
        if not reviews_data.get("success"):
            raise HTTPException(
                status_code=503,
                detail={
                    "message": reviews_data.get("error", "Failed to fetch reviews"),
                    "error_type": reviews_data.get("error_type", "unknown")
                }
            )
        
        print(f"  ✅ Fetched {reviews_data.get('total_reviews', 0)} reviews")
        
        # Perform enhanced analysis
        print("  2️⃣ Running AI/NLP analysis...")
        analysis_result = review_analyzer.analyze_reviews(reviews_data)
        
        if not analysis_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=analysis_result.get("error", "Analysis failed")
            )
        
        # Generate advanced insights if enabled
        if enable_ai:
            print("  3️⃣ Generating AI insights...")
            insights = insight_generator.generate_comprehensive_insights(analysis_result)
            analysis_result["advanced_insights"] = insights
        
        # Schedule background report generation
        background_tasks.add_task(
            generate_detailed_report,
            analysis_result,
            asin
        )
        
        print("  ✅ Analysis complete with AI insights\n")
        return analysis_result
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sentiment/{asin}")
async def get_sentiment_analysis(
    asin: str,
    deep_analysis: bool = Query(True, description="Enable deep sentiment analysis")
):
    """
    Get detailed sentiment and emotion analysis.
    """
    try:
        # Fetch minimal reviews for sentiment
        reviews_data = amazon_scraper.fetch_reviews(
            asin_or_url=asin,
            max_reviews=5,
            country="IN"
        )
        
        if not reviews_data.get("success"):
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch reviews"
            )
        
        # Run analysis
        analysis = review_analyzer.analyze_reviews(reviews_data)
        
        # Extract sentiment and emotion data
        return {
            "asin": asin,
            "sentiment_distribution": analysis.get("sentiment_distribution"),
            "emotion_analysis": analysis.get("emotion_analysis"),
            "emotional_tone": analysis.get("emotion_analysis", {}).get("emotional_tone"),
            "confidence_score": analysis.get("sentiment_distribution", {}).get("sentiment_scores", {}).get("confidence"),
            "ai_models_used": analysis.get("ai_models_used", [])
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/insights/{asin}")
async def get_ai_insights(
    asin: str,
    insight_type: str = Query("comprehensive", description="Type of insights")
):
    """
    Get AI-generated business insights.
    """
    try:
        # Get analysis data
        reviews_data = amazon_scraper.fetch_reviews(asin_or_url=asin, max_reviews=5)
        analysis = review_analyzer.analyze_reviews(reviews_data)
        
        # Generate insights
        insights = insight_generator.generate_comprehensive_insights(analysis)
        
        if insight_type == "executive":
            return {
                "asin": asin,
                "executive_summary": insights.get("executive_summary"),
                "recommendations": insights.get("recommendations")[:3]
            }
        elif insight_type == "swot":
            return {
                "asin": asin,
                "strengths": insights.get("strengths"),
                "weaknesses": insights.get("weaknesses"),
                "opportunities": insights.get("opportunities"),
                "threats": insights.get("threats")
            }
        else:
            return insights
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def generate_detailed_report(analysis_data: Dict[str, Any], asin: str):
    """
    Background task to generate detailed report.
    """
    try:
        print(f"📊 Generating detailed report for {asin}...")
        # Implementation for report generation
        # This would save to database or file system
    except Exception as e:
        print(f"❌ Report generation failed: {e}")