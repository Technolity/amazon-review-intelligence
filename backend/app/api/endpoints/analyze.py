"""
FastAPI endpoint for Amazon Review Analysis with AI/NLP toggle
This endpoint supports both raw review fetching and AI-powered analysis
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime

# NLP imports
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk
from collections import Counter
import re

# Apify import (should only be in backend)
try:
    from apify_client import ApifyClient
except ImportError:
    raise ImportError("❌ apify-client not found! Install: pip install apify-client")

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize sentiment analyzer
vader_analyzer = SentimentIntensityAnalyzer()

# Download required NLTK data
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    nltk.download('stopwords')

router = APIRouter()


# ==========================================
# REQUEST/RESPONSE MODELS
# ==========================================

class AnalysisRequest(BaseModel):
    """Request model for review analysis"""
    asin: str = Field(..., description="Amazon ASIN", min_length=10, max_length=10)
    max_reviews: int = Field(50, description="Maximum reviews to analyze", ge=10, le=100)
    enable_ai: bool = Field(True, description="Enable AI/NLP analysis (TextBlob, VADER, HuggingFace)")
    country: str = Field("US", description="Amazon country code")
    
    @validator('asin')
    def validate_asin(cls, v):
        """Validate ASIN format"""
        if not re.match(r'^[A-Z0-9]{10}$', v):
            raise ValueError('Invalid ASIN format. Must be 10 alphanumeric characters.')
        return v


class Review(BaseModel):
    """Individual review model"""
    title: Optional[str] = None
    text: Optional[str] = None
    stars: Optional[int] = None
    date: Optional[str] = None
    verified: Optional[bool] = None
    sentiment: Optional[str] = None  # Only populated if AI enabled
    sentiment_score: Optional[float] = None  # Only populated if AI enabled


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    success: bool
    asin: str
    total_reviews: int
    average_rating: float
    ai_enabled: bool  # NEW: Indicates if AI analysis was performed
    
    # Sentiment data (only if AI enabled)
    sentiment_distribution: Optional[Dict[str, int]] = None
    
    # Keywords (only if AI enabled)
    top_keywords: Optional[List[Dict[str, Any]]] = None
    
    # Themes (only if AI enabled)
    themes: Optional[List[str]] = None
    
    # Reviews (always included, but sentiment only if AI enabled)
    reviews: List[Review]
    
    # Insights (only if AI enabled)
    insights: Optional[Dict[str, Any]] = None
    
    # Metadata
    timestamp: str
    processing_time: Optional[float] = None


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def analyze_sentiment_textblob(text: str) -> tuple:
    """Analyze sentiment using TextBlob"""
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        
        if polarity > 0.1:
            sentiment = "positive"
        elif polarity < -0.1:
            sentiment = "negative"
        else:
            sentiment = "neutral"
            
        return sentiment, polarity
    except Exception as e:
        logger.error(f"TextBlob error: {e}")
        return "neutral", 0.0


def analyze_sentiment_vader(text: str) -> tuple:
    """Analyze sentiment using VADER"""
    try:
        scores = vader_analyzer.polarity_scores(text)
        compound = scores['compound']
        
        if compound >= 0.05:
            sentiment = "positive"
        elif compound <= -0.05:
            sentiment = "negative"
        else:
            sentiment = "neutral"
            
        return sentiment, compound
    except Exception as e:
        logger.error(f"VADER error: {e}")
        return "neutral", 0.0


def extract_keywords(reviews: List[Dict], top_n: int = 10) -> List[Dict[str, Any]]:
    """Extract top keywords from reviews"""
    try:
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize
        
        stop_words = set(stopwords.words('english'))
        all_words = []
        
        for review in reviews:
            text = (review.get('title', '') + ' ' + review.get('text', '')).lower()
            tokens = word_tokenize(text)
            filtered_words = [
                word for word in tokens 
                if word.isalnum() and len(word) > 3 and word not in stop_words
            ]
            all_words.extend(filtered_words)
        
        word_freq = Counter(all_words)
        top_keywords = [
            {"word": word, "count": count} 
            for word, count in word_freq.most_common(top_n)
        ]
        
        return top_keywords
    except Exception as e:
        logger.error(f"Keyword extraction error: {e}")
        return []


def identify_themes(reviews: List[Dict]) -> List[str]:
    """Identify common themes from reviews"""
    themes = []
    
    # Common theme keywords
    theme_patterns = {
        "Quality": ["quality", "well-made", "durable", "sturdy", "premium"],
        "Price": ["price", "value", "expensive", "cheap", "affordable", "worth"],
        "Shipping": ["shipping", "delivery", "arrived", "package", "fast"],
        "Customer Service": ["service", "support", "help", "response", "customer"],
        "Easy to Use": ["easy", "simple", "intuitive", "user-friendly"],
        "Performance": ["performance", "works", "fast", "slow", "efficient"],
    }
    
    all_text = ' '.join([
        (r.get('title', '') + ' ' + r.get('text', '')).lower() 
        for r in reviews
    ])
    
    for theme, keywords in theme_patterns.items():
        if any(keyword in all_text for keyword in keywords):
            themes.append(theme)
    
    return themes[:5]  # Return top 5 themes


def generate_insights(reviews: List[Dict], sentiment_dist: Dict) -> Dict[str, Any]:
    """Generate AI-powered insights"""
    total = sentiment_dist.get('positive', 0) + sentiment_dist.get('neutral', 0) + sentiment_dist.get('negative', 0)
    
    if total == 0:
        return {"summary": "No reviews to analyze", "insights": []}
    
    positive_ratio = sentiment_dist.get('positive', 0) / total
    negative_ratio = sentiment_dist.get('negative', 0) / total
    
    insights = []
    
    if positive_ratio > 0.7:
        insights.append("✅ Overwhelmingly positive feedback from customers")
    elif positive_ratio > 0.5:
        insights.append("👍 Generally positive reception with some concerns")
    
    if negative_ratio > 0.3:
        insights.append("⚠️ Significant negative feedback - review concerns")
    
    if len(reviews) < 20:
        insights.append("📊 Limited review data - results may not be representative")
    
    # Generate summary
    summary = f"Analysis of {total} reviews shows {positive_ratio:.1%} positive, {negative_ratio:.1%} negative sentiment."
    
    return {
        "summary": summary,
        "insights": insights,
        "confidence": "high" if total >= 50 else "medium" if total >= 20 else "low"
    }


# ==========================================
# API ENDPOINT
# ==========================================

@router.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_reviews(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyze Amazon product reviews with optional AI/NLP processing
    
    - **enable_ai=True**: Full AI analysis (sentiment, keywords, themes, insights)
    - **enable_ai=False**: Raw reviews only (no AI processing)
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"Starting analysis for ASIN: {request.asin} (AI: {request.enable_ai})")
        
        # Initialize Apify client
        apify_token = os.getenv("APIFY_API_TOKEN")
        if not apify_token:
            raise HTTPException(status_code=500, detail="APIFY_API_TOKEN not configured")
        
        client = ApifyClient(apify_token)
        
        # Prepare Apify actor input
        actor_input = {
            "asins": [request.asin],
            "maxReviews": request.max_reviews,
            "country": request.country,
        }
        
        # Run Apify actor
        logger.info("Fetching reviews from Apify...")
        run = client.actor("junglee/amazon-reviews-scraper").call(run_input=actor_input)
        
        # Get results
        reviews_data = []
        for item in client.dataset(run["defaultDatasetId"]).iterate_items():
            reviews_data.extend(item.get("reviews", []))
        
        if not reviews_data:
            raise HTTPException(status_code=404, detail="No reviews found for this ASIN")
        
        logger.info(f"Fetched {len(reviews_data)} reviews")
        
        # Calculate basic stats
        total_reviews = len(reviews_data)
        average_rating = sum(r.get('stars', 0) for r in reviews_data) / total_reviews if total_reviews > 0 else 0
        
        # Process reviews based on AI toggle
        processed_reviews = []
        sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0} if request.enable_ai else None
        
        for review in reviews_data:
            review_dict = {
                "title": review.get("title"),
                "text": review.get("text"),
                "stars": review.get("stars"),
                "date": review.get("date"),
                "verified": review.get("verified", False),
            }
            
            # ✅ AI Processing (only if enabled)
            if request.enable_ai:
                combined_text = f"{review.get('title', '')} {review.get('text', '')}"
                
                # Use both TextBlob and VADER for better accuracy
                sentiment_tb, score_tb = analyze_sentiment_textblob(combined_text)
                sentiment_vader, score_vader = analyze_sentiment_vader(combined_text)
                
                # Average the scores
                final_sentiment = sentiment_vader  # VADER is better for social media text
                final_score = (score_tb + score_vader) / 2
                
                review_dict["sentiment"] = final_sentiment
                review_dict["sentiment_score"] = round(final_score, 3)
                
                # Update distribution
                if sentiment_distribution:
                    sentiment_distribution[final_sentiment] += 1
            
            processed_reviews.append(Review(**review_dict))
        
        # ✅ Additional AI analysis (only if enabled)
        top_keywords = None
        themes = None
        insights = None
        
        if request.enable_ai:
            logger.info("Running AI analysis...")
            top_keywords = extract_keywords(reviews_data, top_n=10)
            themes = identify_themes(reviews_data)
            insights = generate_insights(reviews_data, sentiment_distribution)
        
        # Calculate processing time
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Build response
        response = AnalysisResponse(
            success=True,
            asin=request.asin,
            total_reviews=total_reviews,
            average_rating=round(average_rating, 2),
            ai_enabled=request.enable_ai,
            sentiment_distribution=sentiment_distribution,
            top_keywords=top_keywords,
            themes=themes,
            reviews=processed_reviews,
            insights=insights,
            timestamp=datetime.now().isoformat(),
            processing_time=round(processing_time, 2)
        )
        
        logger.info(f"Analysis completed in {processing_time:.2f}s")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Amazon Review Intelligence API"
    }
