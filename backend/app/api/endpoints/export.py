"""
API endpoints for exporting analysis results.
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os

from app.models.schemas import ExportRequest, ExportResponse
from app.services.amazon_scraper import amazon_scraper
from app.services.analyzer import review_analyzer
from app.services.exporter import exporter
from app.core.config import settings

router = APIRouter()


@router.post("/", response_model=ExportResponse)
async def export_analysis(request: ExportRequest):
    """
    Export analysis results to CSV or PDF.
    
    Args:
        request: ExportRequest with ASIN and format
    
    Returns:
        ExportResponse with file details
    """
    try:
        # Fetch and analyze reviews
        reviews_data = amazon_scraper.fetch_reviews(
            asin_or_url=request.asin,  # Changed from asin to asin_or_url
            max_reviews=500
        )
        
        if not reviews_data.get("success"):
            raise HTTPException(
                status_code=400,
                detail="Failed to fetch reviews"
            )
        
        analysis_result = review_analyzer.analyze_reviews(reviews_data)
        
        if not analysis_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail="Analysis failed"
            )
        
        # Export based on format
        if request.format == "csv":
            reviews = reviews_data.get("reviews") if request.include_raw_reviews else None
            export_result = exporter.export_to_csv(analysis_result, reviews)
        elif request.format == "pdf":
            export_result = exporter.export_to_pdf(analysis_result)
        else:
            raise HTTPException(status_code=400, detail="Invalid format")
        
        if not export_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=export_result.get("error", "Export failed")
            )
        
        return export_result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download/{filename}")
async def download_file(filename: str):
    """
    Download exported file.
    
    Args:
        filename: Name of file to download
    
    Returns:
        FileResponse with the file
    """
    try:
        filepath = os.path.join(settings.EXPORT_FOLDER, filename)
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Determine media type
        media_type = "application/pdf" if filename.endswith(".pdf") else "text/csv"
        
        return FileResponse(
            path=filepath,
            media_type=media_type,
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))