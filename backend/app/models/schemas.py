# ================================================================
# FIXED: backend/app/models/schemas.py
# Corrected response schema for frontend compatibility
# ================================================================

"""
Key fixes:
1. Flat response structure (no nested 'data' wrapper)
2. All fields at top level for easy frontend access
3. Proper typing for TypeScript compatibility
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class ProductInfo(BaseModel):
    """Product metadata"""
    title: Optional[str] = None
    image_url: Optional[str] = None
    asin: Optional[str] = None
    url: Optional[str] = None
    average_rating: Optional[float] = None


class SentimentAnalysis(BaseModel):
    """Detailed sentiment breakdown"""
    sentiment: str  # 'positive', 'negative', or 'neutral'
    vader_compound: float
    textblob_polarity: float
    confidence: float
    subjectivity: float


class Review(BaseModel):
    """Individual review with sentiment"""
    title: Optional[str] = None
    text: Optional[str] = None
    stars: Optional[int] = None
    date: Optional[str] = None
    verified: Optional[bool] = None
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_analysis: Optional[SentimentAnalysis] = None


class Keyword(BaseModel):
    """Keyword with frequency"""
    word: str
    count: int


class Theme(BaseModel):
    """Theme with sentiment"""
    theme: str
    mentions: int
    sentiment: str


class EmotionScores(BaseModel):
    """8-dimension emotion analysis"""
    joy: float
    sadness: float
    anger: float
    fear: float
    surprise: float
    disgust: float
    trust: float
    anticipation: float


class Summaries(BaseModel):
    """Comprehensive summary texts"""
    overall: str
    positive_highlights: str
    negative_highlights: str


class ReviewSamples(BaseModel):
    """Sample reviews by sentiment"""
    positive: List[Review]
    negative: List[Review]
    neutral: List[Review]


# ================================================================
# CRITICAL: FLAT RESPONSE STRUCTURE
# This matches what frontend expects without nested 'data' wrapper
# ================================================================

class AnalysisResponse(BaseModel):
    """
    FLAT response structure - all fields at top level
    NO nested 'data' object
    """
    # Status
    success: bool
    error: Optional[str] = None
    
    # Product Information
    product_info: Optional[ProductInfo] = None
    asin: str
    country: str = "US"
    
    # Core Metrics
    total_reviews: int
    average_rating: float
    
    # Distributions
    rating_distribution: Dict[str, int] = Field(default_factory=dict)  # {"1": 5, "2": 10, ...}
    sentiment_distribution: Dict[str, int] = Field(default_factory=dict)  # {"positive": 45, ...}
    
    # Reviews
    reviews: List[Review] = Field(default_factory=list)
    review_samples: Optional[ReviewSamples] = None
    
    # AI/NLP Results
    ai_enabled: bool = False
    top_keywords: List[Keyword] = Field(default_factory=list)
    themes: List[Theme] = Field(default_factory=list)
    emotions: Optional[EmotionScores] = None
    summaries: Optional[Summaries] = None
    
    # Metadata
    data_source: str = "unknown"  # 'apify', 'mock', 'database'
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    processing_time: Optional[float] = None


# ================================================================
# EXAMPLE USAGE IN ENDPOINT
# ================================================================

"""
@router.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_reviews(request: AnalysisRequest):
    # ... process reviews ...
    
    # Return FLAT structure (no nesting)
    return AnalysisResponse(
        success=True,
        asin=request.asin,
        country=request.country,
        product_info=ProductInfo(
            title="Example Product",
            image_url="https://...",
            asin=request.asin,
            average_rating=4.5
        ),
        total_reviews=50,
        average_rating=4.5,
        rating_distribution={
            "5": 25,
            "4": 15,
            "3": 5,
            "2": 3,
            "1": 2
        },
        sentiment_distribution={
            "positive": 40,
            "neutral": 7,
            "negative": 3
        },
        reviews=processed_reviews,
        review_samples=ReviewSamples(
            positive=positive_samples,
            negative=negative_samples,
            neutral=neutral_samples
        ),
        ai_enabled=request.enable_ai,
        top_keywords=[
            Keyword(word="quality", count=25),
            Keyword(word="fast", count=20)
        ],
        themes=[
            Theme(theme="Quality", mentions=30, sentiment="positive"),
            Theme(theme="Shipping", mentions=15, sentiment="negative")
        ],
        emotions=EmotionScores(
            joy=0.65,
            sadness=0.10,
            anger=0.12,
            fear=0.08,
            surprise=0.15,
            disgust=0.05,
            trust=0.55,
            anticipation=0.40
        ),
        summaries=Summaries(
            overall="Comprehensive summary...",
            positive_highlights="Top strengths...",
            negative_highlights="Key concerns..."
        ),
        data_source="apify",
        processing_time=2.5
    )
"""
