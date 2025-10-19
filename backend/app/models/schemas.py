"""
Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
import re


# Request Schemas
class ReviewFetchRequest(BaseModel):
    """Request to fetch reviews."""
    asin: str = Field(..., min_length=10, max_length=500)  # Increased max_length for URLs
    max_reviews: Optional[int] = Field(500, ge=1, le=1000)
    country: Optional[str] = Field("IN")
    multi_country: Optional[bool] = Field(True)
    
    @validator('asin')
    def validate_asin(cls, v):
        """Extract ASIN from URL or validate ASIN format."""
        # If it's already a valid ASIN, return it
        asin_pattern = r'^[A-Z0-9]{10}$'
        if re.match(asin_pattern, v.upper()):
            return v.upper()
        
        # Try to extract ASIN from URL patterns
        url_patterns = [
            r'/dp/([A-Z0-9]{10})',
            r'/gp/product/([A-Z0-9]{10})',
            r'/product/([A-Z0-9]{10})',
            r'/dp/product/([A-Z0-9]{10})',
            r'/ASIN/([A-Z0-9]{10})',
            r'amazon\.[^/]+/.*?([A-Z0-9]{10})(?:[/?]|$)'
        ]
        
        for pattern in url_patterns:
            match = re.search(pattern, v, re.IGNORECASE)
            if match and match.group(1):
                return match.group(1).upper()
        
        # If no ASIN found and it's not a valid ASIN, raise error
        if not re.match(asin_pattern, v.upper()):
            raise ValueError('Invalid Amazon ASIN or URL format')
        
        return v.upper()
    
    @validator('country')
    def validate_country(cls, v):
        """Validate country code."""
        valid_countries = ['US', 'IN', 'UK', 'DE', 'FR', 'IT', 'ES', 'CA', 'JP', 'AU', 'BR', 'MX']
        if v.upper() not in valid_countries:
            raise ValueError(f'Invalid country code. Must be one of: {", ".join(valid_countries)}')
        return v.upper()


class AnalyzeRequest(BaseModel):
    """Request to analyze reviews."""
    asin: str = Field(..., min_length=10, max_length=500)  # Increased max_length for URLs
    keyword: Optional[str] = None
    fetch_new: bool = False
    country: Optional[str] = Field("IN")
    multi_country: Optional[bool] = Field(True)
    
    @validator('asin')
    def validate_asin(cls, v):
        """Extract ASIN from URL or validate ASIN format."""
        # If it's already a valid ASIN, return it
        asin_pattern = r'^[A-Z0-9]{10}$'
        if re.match(asin_pattern, v.upper()):
            return v.upper()
        
        # Try to extract ASIN from URL patterns
        url_patterns = [
            r'/dp/([A-Z0-9]{10})',
            r'/gp/product/([A-Z0-9]{10})',
            r'/product/([A-Z0-9]{10})',
            r'/dp/product/([A-Z0-9]{10})',
            r'/ASIN/([A-Z0-9]{10})',
            r'amazon\.[^/]+/.*?([A-Z0-9]{10})(?:[/?]|$)'
        ]
        
        for pattern in url_patterns:
            match = re.search(pattern, v, re.IGNORECASE)
            if match and match.group(1):
                return match.group(1).upper()
        
        # If no ASIN found and it's not a valid ASIN, raise error
        if not re.match(asin_pattern, v.upper()):
            raise ValueError('Invalid Amazon ASIN or URL format')
        
        return v.upper()
    
    @validator('country')
    def validate_country(cls, v):
        """Validate country code."""
        valid_countries = ['US', 'IN', 'UK', 'DE', 'FR', 'IT', 'ES', 'CA', 'JP', 'AU', 'BR', 'MX']
        if v.upper() not in valid_countries:
            raise ValueError(f'Invalid country code. Must be one of: {", ".join(valid_countries)}')
        return v.upper()


class ExportRequest(BaseModel):
    """Request to export analysis results."""
    asin: str
    format: str = Field(..., pattern='^(csv|pdf)$')
    include_raw_reviews: bool = True


# Response Schemas - Add new fields for country support
class KeywordItem(BaseModel):
    """Individual keyword with metadata."""
    word: str
    frequency: int
    tfidf_score: float
    importance: str


class SentimentDistribution(BaseModel):
    """Sentiment analysis results."""
    positive: Dict[str, Any]
    neutral: Dict[str, Any]
    negative: Dict[str, Any]
    average_rating: float
    median_rating: float
    overall_sentiment_score: Optional[float] = 0.0


class RatingDistribution(BaseModel):
    """Star rating distribution."""
    five_star: int = Field(..., alias="5_star")
    four_star: int = Field(..., alias="4_star")
    three_star: int = Field(..., alias="3_star")
    two_star: int = Field(..., alias="2_star")
    one_star: int = Field(..., alias="1_star")
    
    class Config:
        populate_by_name = True


class TemporalTrend(BaseModel):
    """Monthly trend data."""
    month: str
    review_count: int
    average_rating: float


class AnalysisResponse(BaseModel):
    """Complete analysis response."""
    success: bool
    asin: str
    product_title: str
    total_reviews: int
    analyzed_at: str
    sentiment_distribution: SentimentDistribution
    keyword_analysis: Dict[str, Any]
    rating_distribution: Dict[str, int]
    temporal_trends: Dict[str, Any]
    insights: List[str]
    summary: str
    
    # New fields for country and source support
    country: Optional[str] = None
    countries_tried: Optional[List[str]] = None
    successful_country: Optional[str] = None
    source: Optional[str] = None
    fetched_at: Optional[str] = None
    mock_data: Optional[bool] = False
    error_type: Optional[str] = None
    suggestion: Optional[str] = None


class ReviewItem(BaseModel):
    """Individual review."""
    review_id: str
    asin: str
    rating: float
    review_text: str
    review_title: str
    review_date: str
    verified_purchase: bool
    helpful_votes: int
    reviewer_name: Optional[str] = None
    reviewer_id: Optional[str] = None


class ReviewsResponse(BaseModel):
    """Response with reviews list."""
    success: bool
    asin: str
    total_reviews: int
    reviews: List[ReviewItem]
    product_title: str
    fetched_at: str
    mock_data: bool = False
    
    # New fields for country and source support
    country: Optional[str] = None
    countries_tried: Optional[List[str]] = None
    successful_country: Optional[str] = None
    source: Optional[str] = None
    average_rating: Optional[float] = None
    error_type: Optional[str] = None
    suggestion: Optional[str] = None
    error: Optional[str] = None
    error_detail: Optional[str] = None


class ExportResponse(BaseModel):
    """Export operation response."""
    success: bool
    file_path: str
    file_size: int
    format: str
    download_url: str


class ErrorResponse(BaseModel):
    """Error response."""
    success: bool = False
    error: str
    detail: Optional[str] = None
    error_type: Optional[str] = None
    suggestion: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    app_name: str
    version: str
    timestamp: str