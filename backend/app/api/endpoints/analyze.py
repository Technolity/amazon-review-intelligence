"""
FastAPI endpoint for Amazon Review Analysis with AI/NLP toggle
FIXED VERSION - Properly extracts and processes all data from Apify
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import os
import re

# NLP imports
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk
from collections import Counter

# Apify import
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
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)

router = APIRouter()


# ==========================================
# REQUEST/RESPONSE MODELS
# ==========================================

class AnalysisRequest(BaseModel):
    """Request model for review analysis"""
    asin: str = Field(..., description="Amazon ASIN", min_length=10, max_length=10)
    max_reviews: int = Field(50, description="Maximum reviews to analyze", ge=10, le=100)
    enable_ai: bool = Field(True, description="Enable AI/NLP analysis")
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
    rating: Optional[float] = None  # Alias for stars
    date: Optional[str] = None
    verified: Optional[bool] = None
    author: Optional[str] = None
    helpful_count: Optional[int] = 0
    sentiment: Optional[str] = None
    sentiment_score: Optional[float] = None
    sentiment_confidence: Optional[float] = None


class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    success: bool
    asin: str
    total_reviews: int
    average_rating: float
    ai_enabled: bool
    
    # Sentiment data (only if AI enabled)
    sentiment_distribution: Optional[Dict[str, int]] = None
    
    # Keywords (only if AI enabled)
    top_keywords: Optional[List[Dict[str, Any]]] = None
    
    # Themes (only if AI enabled)
    themes: Optional[List[Dict[str, Any]]] = None
    
    # Reviews (always included)
    reviews: List[Review]
    
    # Insights (only if AI enabled)
    insights: Optional[Dict[str, Any]] = None
    
    # Product info
    product_info: Optional[Dict[str, Any]] = None
    
    # Metadata
    timestamp: str
    processing_time: Optional[float] = None
    data_source: Optional[str] = "apify"


# ==========================================
# HELPER FUNCTIONS - IMPROVED
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
            
        # Confidence based on absolute polarity
        confidence = min(abs(polarity) * 2, 1.0)
        
        return sentiment, polarity, confidence
    except Exception as e:
        logger.error(f"TextBlob error: {e}")
        return "neutral", 0.0, 0.0


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
        
        # Confidence is the absolute compound score
        confidence = min(abs(compound), 1.0)
        
        return sentiment, compound, confidence
    except Exception as e:
        logger.error(f"VADER error: {e}")
        return "neutral", 0.0, 0.0


def extract_keywords(reviews_data: List[Dict], top_n: int = 15) -> List[Dict[str, Any]]:
    """Extract top keywords from reviews using frequency analysis"""
    try:
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize
        
        stop_words = set(stopwords.words('english'))
        
        # Additional stop words specific to reviews
        additional_stops = {
            'product', 'amazon', 'item', 'buy', 'bought', 'ordered',
            'order', 'purchase', 'purchased', 'review', 'reviews',
            'one', 'get', 'got', 'would', 'could', 'also', 'really',
            'like', 'use', 'used', 'using', 'thing', 'things'
        }
        stop_words.update(additional_stops)
        
        # Collect all text
        all_text = ""
        for review in reviews_data:
            title = review.get('title', '')
            text = review.get('text', '')
            all_text += f" {title} {text}"
        
        # Tokenize and filter
        words = word_tokenize(all_text.lower())
        words = [w for w in words if w.isalpha() and len(w) > 3 and w not in stop_words]
        
        # Count frequency
        word_freq = Counter(words)
        
        # Get top keywords
        top_keywords = []
        for word, count in word_freq.most_common(top_n):
            top_keywords.append({
                "word": word,
                "frequency": count,
                "sentiment": _determine_keyword_sentiment(word, reviews_data)
            })
        
        return top_keywords
    
    except Exception as e:
        logger.error(f"Keyword extraction error: {e}")
        return []


def _determine_keyword_sentiment(keyword: str, reviews_data: List[Dict]) -> str:
    """Determine overall sentiment for a keyword based on context"""
    positive_count = 0
    negative_count = 0
    
    for review in reviews_data:
        text = f"{review.get('title', '')} {review.get('text', '')}".lower()
        if keyword in text:
            rating = review.get('stars', review.get('rating', 3))
            if rating >= 4:
                positive_count += 1
            elif rating <= 2:
                negative_count += 1
    
    if positive_count > negative_count * 1.5:
        return "positive"
    elif negative_count > positive_count * 1.5:
        return "negative"
    return "neutral"


def identify_themes(reviews_data: List[Dict]) -> List[Dict[str, Any]]:
    """Identify common themes from reviews"""
    try:
        # Define theme patterns
        theme_patterns = {
            "Quality": ["quality", "well-made", "durable", "sturdy", "build", "construction"],
            "Value": ["price", "worth", "value", "affordable", "expensive", "cheap"],
            "Performance": ["works", "performance", "function", "effective", "efficient"],
            "Design": ["design", "look", "appearance", "style", "aesthetic", "beautiful"],
            "Ease of Use": ["easy", "simple", "intuitive", "user-friendly", "convenient"],
            "Durability": ["last", "lasting", "broke", "broken", "sturdy", "durable"],
            "Shipping": ["shipping", "delivery", "arrived", "packaging", "package"],
            "Customer Service": ["customer service", "support", "warranty", "return"]
        }
        
        themes_found = []
        
        for theme_name, keywords in theme_patterns.items():
            mentions = 0
            sentiment_scores = []
            
            for review in reviews_data:
                text = f"{review.get('title', '')} {review.get('text', '')}".lower()
                rating = review.get('stars', review.get('rating', 3))
                
                # Check if any keyword is in the review
                if any(keyword in text for keyword in keywords):
                    mentions += 1
                    sentiment_scores.append(rating)
            
            if mentions > 0:
                avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
                sentiment = "positive" if avg_sentiment >= 3.5 else "negative" if avg_sentiment < 2.5 else "neutral"
                
                themes_found.append({
                    "theme": theme_name,
                    "mentions": mentions,
                    "sentiment": sentiment,
                    "avg_rating": round(avg_sentiment, 2),
                    "keywords": keywords[:3]  # Top 3 keywords
                })
        
        # Sort by mentions
        themes_found.sort(key=lambda x: x["mentions"], reverse=True)
        return themes_found[:6]  # Return top 6 themes
    
    except Exception as e:
        logger.error(f"Theme identification error: {e}")
        return []


def generate_insights(reviews_data: List[Dict], sentiment_dist: Dict[str, int]) -> Dict[str, Any]:
    """Generate AI insights from review analysis"""
    try:
        total = sum(sentiment_dist.values())
        if total == 0:
            return {
                "summary": "No reviews to analyze",
                "insights": [],
                "confidence": "low"
            }
        
        positive_pct = (sentiment_dist.get("positive", 0) / total) * 100
        negative_pct = (sentiment_dist.get("negative", 0) / total) * 100
        neutral_pct = (sentiment_dist.get("neutral", 0) / total) * 100
        
        # Calculate average rating
        total_ratings = sum(r.get('stars', r.get('rating', 0)) for r in reviews_data)
        avg_rating = total_ratings / len(reviews_data) if reviews_data else 0
        
        # Generate summary
        if positive_pct > 70:
            sentiment_summary = "overwhelmingly positive"
        elif positive_pct > 50:
            sentiment_summary = "mostly positive"
        elif negative_pct > 50:
            sentiment_summary = "mostly negative"
        else:
            sentiment_summary = "mixed"
        
        summary = (
            f"Analysis of {total} reviews shows {sentiment_summary} customer sentiment "
            f"with {positive_pct:.1f}% positive, {neutral_pct:.1f}% neutral, and {negative_pct:.1f}% negative reviews. "
            f"The average rating is {avg_rating:.1f}/5 stars."
        )
        
        # Generate actionable insights
        insights = []
        
        if positive_pct > 60:
            insights.append("✅ Strong customer satisfaction - Product meets or exceeds expectations")
        
        if negative_pct > 30:
            insights.append("⚠️ Significant negative feedback - Review common complaints for improvement areas")
        
        if avg_rating >= 4.0:
            insights.append("⭐ High rating indicates good product quality and customer satisfaction")
        elif avg_rating < 3.0:
            insights.append("📉 Low average rating suggests product issues need addressing")
        
        # Add insights based on themes (if available)
        themes = identify_themes(reviews_data)
        if themes:
            top_theme = themes[0]
            insights.append(f"🎯 '{top_theme['theme']}' is the most discussed aspect ({top_theme['mentions']} mentions)")
        
        if len(insights) < 3:
            insights.append("💡 Monitor customer feedback regularly for continuous improvement")
        
        return {
            "summary": summary,
            "insights": insights[:5],  # Return top 5 insights
            "confidence": "high" if total >= 50 else "medium" if total >= 20 else "low",
            "metrics": {
                "total_reviews": total,
                "positive_percentage": round(positive_pct, 1),
                "negative_percentage": round(negative_pct, 1),
                "neutral_percentage": round(neutral_pct, 1),
                "average_rating": round(avg_rating, 2)
            }
        }
    
    except Exception as e:
        logger.error(f"Insight generation error: {e}")
        return {
            "summary": "Unable to generate insights",
            "insights": [],
            "confidence": "low"
        }


# ==========================================
# API ENDPOINT - COMPLETELY FIXED
# ==========================================

@router.post("/api/v1/analyze", response_model=AnalysisResponse)
async def analyze_reviews(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """
    Analyze Amazon product reviews with optional AI/NLP processing
    FIXED VERSION - Properly extracts and processes Apify data
    """
    start_time = datetime.now()
    
    try:
        logger.info(f"🔍 Starting analysis for ASIN: {request.asin} (AI: {request.enable_ai})")
        
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
        logger.info("📡 Fetching reviews from Apify...")
        run = client.actor("junglee/amazon-reviews-scraper").call(run_input=actor_input)
        
        # Get results from dataset
        reviews_data = []
        product_info = None
        
        dataset = client.dataset(run["defaultDatasetId"])
        for item in dataset.iterate_items():
            # Extract product info from first item
            if not product_info:
                product_info = {
                    "title": item.get("productTitle", item.get("title", "Unknown Product")),
                    "asin": item.get("asin", request.asin),
                    "image": item.get("thumbnailImage", ""),
                    "rating": item.get("averageRating", 0),
                    "total_reviews": item.get("reviewsCount", 0)
                }
            
            # Extract reviews
            if "reviews" in item and isinstance(item["reviews"], list):
                reviews_data.extend(item["reviews"])
        
        logger.info(f"📦 Fetched {len(reviews_data)} reviews from Apify")
        
        # Handle no reviews case
        if not reviews_data:
            processing_time = (datetime.now() - start_time).total_seconds()
            return AnalysisResponse(
                success=True,
                asin=request.asin,
                total_reviews=0,
                average_rating=0,
                ai_enabled=request.enable_ai,
                sentiment_distribution=None,
                top_keywords=None,
                themes=None,
                reviews=[],
                insights={"summary": "No reviews found", "insights": [], "confidence": "low"},
                product_info=product_info,
                timestamp=datetime.now().isoformat(),
                processing_time=round(processing_time, 2),
                data_source="apify"
            )
        
        # CRITICAL FIX: Calculate basic stats BEFORE processing
        total_reviews = len(reviews_data)
        ratings = [r.get('stars', r.get('rating', 0)) for r in reviews_data if r.get('stars') or r.get('rating')]
        average_rating = sum(ratings) / len(ratings) if ratings else 0
        
        logger.info(f"📊 Average rating: {average_rating:.2f} from {len(ratings)} reviews")
        
        # Process reviews based on AI toggle
        processed_reviews = []
        sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0} if request.enable_ai else None
        
        for review in reviews_data:
            # Extract review data with proper field mapping
            review_dict = {
                "title": review.get("title", review.get("reviewTitle", "")),
                "text": review.get("text", review.get("reviewDescription", review.get("content", ""))),
                "stars": review.get("stars", review.get("rating", 0)),
                "rating": review.get("stars", review.get("rating", 0)),  # Alias
                "date": review.get("date", review.get("reviewDate", "")),
                "verified": review.get("verified", review.get("verifiedPurchase", False)),
                "author": review.get("author", review.get("name", "Anonymous")),
                "helpful_count": review.get("helpful_count", review.get("helpfulVotes", 0))
            }
            
            # AI Processing (only if enabled)
            if request.enable_ai:
                combined_text = f"{review_dict.get('title', '')} {review_dict.get('text', '')}"
                
                # Use both TextBlob and VADER for better accuracy
                sentiment_tb, score_tb, conf_tb = analyze_sentiment_textblob(combined_text)
                sentiment_vader, score_vader, conf_vader = analyze_sentiment_vader(combined_text)
                
                # Average the results (VADER is better for social text)
                final_sentiment = sentiment_vader
                final_score = (score_tb + score_vader) / 2
                final_confidence = (conf_tb + conf_vader) / 2
                
                review_dict["sentiment"] = final_sentiment
                review_dict["sentiment_score"] = round(final_score, 3)
                review_dict["sentiment_confidence"] = round(final_confidence, 3)
                
                # Update distribution
                if sentiment_distribution:
                    sentiment_distribution[final_sentiment] += 1
            
            processed_reviews.append(Review(**review_dict))
        
        # Additional AI analysis (only if enabled)
        top_keywords = None
        themes = None
        insights = None
        
        if request.enable_ai:
            logger.info("🤖 Running AI analysis...")
            top_keywords = extract_keywords(reviews_data, top_n=15)
            themes = identify_themes(reviews_data)
            insights = generate_insights(reviews_data, sentiment_distribution)
            
            logger.info(f"✅ AI Analysis complete: {len(top_keywords)} keywords, {len(themes)} themes")
        
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
            product_info=product_info,
            timestamp=datetime.now().isoformat(),
            processing_time=round(processing_time, 2),
            data_source="apify"
        )
        
        logger.info(f"✅ Analysis completed in {processing_time:.2f}s")
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Analysis error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Amazon Review Intelligence API"
    }
