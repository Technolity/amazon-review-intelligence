from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from app.models.schemas import InsightRequest, InsightResponse
from app.services.insights import InsightGenerator

router = APIRouter()
insight_generator = InsightGenerator()

@router.post("/insights/generate", response_model=InsightResponse)
async def generate_insights(request: InsightRequest):
    """
    Generate AI-powered insights from analysis data
    """
    try:
        # Get analysis data from storage
        from app.api.endpoints.analyze import analysis_store
        
        if request.analysis_id not in analysis_store:
            raise HTTPException(status_code=404, detail="Analysis not found")
        
        analysis_data = analysis_store[request.analysis_id]
        
        # Generate insights
        insights = insight_generator.generate_insights(analysis_data, request.style)
        
        return InsightResponse(
            analysis_id=insights["analysis_id"],
            summary=insights["insight_summary"],
            key_insights=insights["key_insights"],
            recommendations=insights["recommendations"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Insight generation failed: {str(e)}")

@router.post("/insights/demo")
async def generate_demo_insights():
    """
    Demo endpoint for insight generation
    """
    try:
        # Use the demo analysis if available
        from app.api.endpoints.analyze import analysis_store
        
        # Find any existing analysis
        if analysis_store:
            analysis_id = list(analysis_store.keys())[0]
            analysis_data = analysis_store[analysis_id]
        else:
            # Create demo analysis first
            from app.api.endpoints.analyze import analyzer
            from app.api.endpoints.reviews import reviews_store
            
            if not reviews_store:
                raise HTTPException(status_code=400, detail="No reviews available. Run /reviews/fetch first.")
            
            reviews = list(reviews_store.values())[:5]  # Use first 5 reviews
            analysis_data = analyzer.analyze_with_themes(reviews)
            analysis_id = analysis_data["analysis_id"]
            analysis_store[analysis_id] = analysis_data
        
        # Generate insights
        insights = insight_generator.generate_insights(analysis_data, "professional")
        
        return {
            "message": "Demo insights generated successfully!",
            "analysis_id": analysis_id,
            "insights": insights
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo insight generation failed: {str(e)}")