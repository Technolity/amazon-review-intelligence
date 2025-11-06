"""
Amazon Review Intelligence - Production Backend
Real-time Apify Integration with AI/NLP Analysis
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import os
import asyncio
import json
import traceback
from collections import defaultdict

# Load environment first
from dotenv import load_dotenv
load_dotenv()

# Core imports
import uvicorn
import pandas as pd
import numpy as np
from loguru import logger

# NLP imports
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk

# Apify import
from apify_client import ApifyClient

# Initialize components
vader_analyzer = SentimentIntensityAnalyzer()

# Simple configuration
class Config:
    # App settings
    APP_NAME = os.getenv("APP_NAME", "Amazon Review Intelligence")
    APP_VERSION = os.getenv("APP_VERSION", "2.0.0")
    DEBUG = os.getenv("DEBUG", "true").lower() == "true"
    
    # Server
    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "8000"))
    
    # CORS
    ALLOWED_ORIGINS = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000"
    ).split(",")
    
    # Apify
    APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN", "")
    APIFY_ACTOR_ID = os.getenv("APIFY_ACTOR_ID", "junglee/amazon-reviews-scraper")
    
    # Features
    ENABLE_AI = os.getenv("ENABLE_AI", "true").lower() == "true"
    MAX_REVIEWS = int(os.getenv("MAX_REVIEWS_PER_REQUEST", "100"))
    USE_MOCK_FALLBACK = os.getenv("USE_MOCK_FALLBACK", "true").lower() == "true"

config = Config()

# Initialize Apify client
apify_client = None
if config.APIFY_API_TOKEN:
    try:
        apify_client = ApifyClient(config.APIFY_API_TOKEN)
        logger.info("✅ Apify client initialized")
    except Exception as e:
        logger.error(f"❌ Apify initialization failed: {e}")

# Growth data storage (in-memory for now)
growth_data_store = defaultdict(list)

# Lifespan manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("=" * 60)
    logger.info(f"🚀 {config.APP_NAME} v{config.APP_VERSION}")
    logger.info(f"📊 Apify Token: {'✅ Configured' if config.APIFY_API_TOKEN else '❌ Not configured'}")
    logger.info(f"🤖 AI Analysis: {'Enabled' if config.ENABLE_AI else 'Disabled'}")
    logger.info(f"🌐 CORS Origins: {config.ALLOWED_ORIGINS}")
    logger.info("=" * 60)
    
    # Download NLTK data
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('vader_lexicon', quiet=True)
        logger.info("✅ NLTK data ready")
    except Exception as e:
        logger.warning(f"⚠️ NLTK setup: {e}")
    
    yield
    
    # Shutdown
    logger.info("👋 Shutting down...")

# Create FastAPI app
app = FastAPI(
    title=config.APP_NAME,
    version=config.APP_VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= HELPER FUNCTIONS =============

def analyze_sentiment(text: str) -> Dict:
    """Analyze sentiment using VADER and TextBlob"""
    # VADER analysis
    vader_scores = vader_analyzer.polarity_scores(text)
    
    # TextBlob analysis
    blob = TextBlob(text)
    
    # Determine overall sentiment
    compound = vader_scores['compound']
    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return {
        "sentiment": sentiment,
        "confidence": abs(compound),
        "scores": {
            "positive": vader_scores['pos'],
            "neutral": vader_scores['neu'],
            "negative": vader_scores['neg'],
            "compound": compound
        },
        "polarity": blob.sentiment.polarity,
        "subjectivity": blob.sentiment.subjectivity
    }

def extract_keywords(texts: List[str], top_n: int = 10) -> List[Dict]:
    """Extract keywords from texts"""
    from collections import Counter
    import re
    
    # Combine all texts
    combined = " ".join(texts).lower()
    
    # Simple tokenization
    words = re.findall(r'\b[a-z]+\b', combined)
    
    # Filter stopwords
    try:
        from nltk.corpus import stopwords
        stop_words = set(stopwords.words('english'))
    except:
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once'}
    
    words = [w for w in words if w not in stop_words and len(w) > 2]
    
    # Count frequencies
    word_freq = Counter(words)
    
    # Return top keywords
    return [
        {"word": word, "frequency": freq}
        for word, freq in word_freq.most_common(top_n)
    ]

def generate_mock_reviews(asin: str, count: int = 50) -> Dict:
    """Generate mock reviews as fallback"""
    import random
    
    reviews = []
    for i in range(count):
        rating = random.choice([5, 5, 4, 4, 4, 3, 3, 2, 1])
        
        positive_texts = [
            "Great product, highly recommend!",
            "Excellent quality and fast shipping.",
            "Exactly as described, very satisfied.",
            "Amazing value for money!",
            "Perfect, couldn't be happier!"
        ]
        
        negative_texts = [
            "Poor quality, disappointed.",
            "Not as described, returning.",
            "Broke after one week.",
            "Waste of money.",
            "Terrible experience."
        ]
        
        neutral_texts = [
            "It's okay, nothing special.",
            "Average product.",
            "Does the job.",
            "Acceptable quality.",
            "Fine for the price."
        ]
        
        if rating >= 4:
            text = random.choice(positive_texts)
        elif rating <= 2:
            text = random.choice(negative_texts)
        else:
            text = random.choice(neutral_texts)
        
        reviews.append({
            "id": f"mock_{i}",
            "rating": rating,
            "title": text.split(',')[0],
            "text": text,
            "author": f"Customer_{i}",
            "date": datetime.now().isoformat(),
            "verified": random.choice([True, False]),
            "helpful_count": random.randint(0, 100)
        })
    
    # Calculate statistics
    ratings = [r['rating'] for r in reviews]
    
    return {
        "success": True,
        "asin": asin,
        "reviews": reviews,
        "total_reviews": len(reviews),
        "average_rating": sum(ratings) / len(ratings) if ratings else 0,
        "rating_distribution": {
            "5": len([r for r in ratings if r == 5]),
            "4": len([r for r in ratings if r == 4]),
            "3": len([r for r in ratings if r == 3]),
            "2": len([r for r in ratings if r == 2]),
            "1": len([r for r in ratings if r == 1])
        },
        "product_info": {
            "title": f"Product {asin}",
            "brand": "Generic Brand",
            "price": "$99.99",
            "image": "https://via.placeholder.com/200"
        },
        "data_source": "mock"
    }

async def fetch_apify_reviews(asin: str, max_reviews: int = 50, country: str = "US") -> Dict:
    """Fetch real reviews from Apify"""
    if not apify_client:
        logger.warning("Apify client not initialized, using mock data")
        return generate_mock_reviews(asin, max_reviews)
    
    try:
        logger.info(f"📡 Fetching reviews from Apify for ASIN: {asin}")
        
        # Prepare Amazon URL
        country_domains = {
            "US": "amazon.com",
            "UK": "amazon.co.uk",
            "DE": "amazon.de",
            "FR": "amazon.fr",
            "IT": "amazon.it",
            "ES": "amazon.es",
            "CA": "amazon.ca",
            "IN": "amazon.in",
            "JP": "amazon.co.jp"
        }
        
        domain = country_domains.get(country, "amazon.com")
        amazon_url = f"https://www.{domain}/dp/{asin}"
        
        # Prepare actor input
        actor_input = {
            "productUrls": [{"url": amazon_url}],
            "maxReviews": max_reviews,
            "sort": "recent",
            "filterByRatings": ["allStars"],
            "scrapeProductDetails": True
        }
        
        # Run the actor
        logger.info(f"🚀 Starting Apify actor: {config.APIFY_ACTOR_ID}")
        run = await asyncio.to_thread(
            apify_client.actor(config.APIFY_ACTOR_ID).call,
            run_input=actor_input,
            wait_secs=60  # Wait up to 60 seconds
        )
        
        # Get results
        dataset_items = []
        if run.get("defaultDatasetId"):
            dataset_client = apify_client.dataset(run["defaultDatasetId"])
            dataset_items = list(dataset_client.iterate_items())
        
        if not dataset_items:
            logger.warning("No data returned from Apify")
            if config.USE_MOCK_FALLBACK:
                return generate_mock_reviews(asin, max_reviews)
            return {"success": False, "error": "No data from Apify"}
        
        # Process results
        all_reviews = []
        product_info = {}
        
        for item in dataset_items:
            # Extract product info
            if "productTitle" in item:
                product_info = {
                    "title": item.get("productTitle", ""),
                    "brand": item.get("brand", ""),
                    "price": item.get("price", ""),
                    "image": item.get("thumbnailImage", ""),
                    "rating": item.get("averageRating", 0),
                    "total_reviews": item.get("totalReviews", 0)
                }
            
            # Extract reviews
            for review_data in item.get("reviews", []):
                try:
                    # Parse rating
                    rating_str = review_data.get("reviewRating", "0")
                    if isinstance(rating_str, str) and "out of" in rating_str:
                        rating = float(rating_str.split()[0])
                    else:
                        rating = float(rating_str) if rating_str else 0
                    
                    review = {
                        "id": review_data.get("id", ""),
                        "title": review_data.get("reviewTitle", ""),
                        "text": review_data.get("reviewDescription", ""),
                        "rating": rating,
                        "author": review_data.get("reviewAuthor", "Anonymous"),
                        "date": review_data.get("reviewDate", ""),
                        "verified": review_data.get("isVerified", False),
                        "helpful_count": review_data.get("helpfulCount", 0)
                    }
                    
                    all_reviews.append(review)
                except Exception as e:
                    logger.error(f"Error processing review: {e}")
                    continue
        
        if not all_reviews:
            logger.warning("No reviews extracted from Apify data")
            if config.USE_MOCK_FALLBACK:
                return generate_mock_reviews(asin, max_reviews)
        
        # Calculate statistics
        ratings = [r['rating'] for r in all_reviews]
        
        logger.info(f"✅ Successfully fetched {len(all_reviews)} reviews from Apify")
        
        return {
            "success": True,
            "asin": asin,
            "reviews": all_reviews[:max_reviews],
            "total_reviews": len(all_reviews),
            "average_rating": sum(ratings) / len(ratings) if ratings else 0,
            "rating_distribution": {
                "5": len([r for r in ratings if r >= 4.5]),
                "4": len([r for r in ratings if 3.5 <= r < 4.5]),
                "3": len([r for r in ratings if 2.5 <= r < 3.5]),
                "2": len([r for r in ratings if 1.5 <= r < 2.5]),
                "1": len([r for r in ratings if r < 1.5])
            },
            "product_info": product_info,
            "data_source": "apify"
        }
        
    except Exception as e:
        logger.error(f"Apify error: {e}\n{traceback.format_exc()}")
        if config.USE_MOCK_FALLBACK:
            logger.info("Falling back to mock data")
            return generate_mock_reviews(asin, max_reviews)
        return {"success": False, "error": str(e)}

def analyze_reviews(reviews: List[Dict]) -> Dict:
    """Analyze reviews with AI/NLP"""
    if not reviews:
        return {}
    
    analyzed = []
    sentiments = []
    texts = []
    
    for review in reviews:
        text = f"{review.get('title', '')} {review.get('text', '')}"
        texts.append(text)
        
        # Sentiment analysis
        sentiment_result = analyze_sentiment(text)
        sentiments.append(sentiment_result['sentiment'])
        
        # Add analysis to review
        analyzed.append({
            **review,
            "sentiment": sentiment_result['sentiment'],
            "sentiment_confidence": sentiment_result['confidence'],
            "polarity": sentiment_result['polarity'],
            "subjectivity": sentiment_result['subjectivity']
        })
    
    # Aggregate metrics
    sentiment_counts = pd.Series(sentiments).value_counts().to_dict()
    
    # Extract keywords
    keywords = extract_keywords(texts, top_n=15)
    
    # Generate insights
    total = len(reviews)
    positive_pct = (sentiment_counts.get('positive', 0) / total * 100) if total else 0
    negative_pct = (sentiment_counts.get('negative', 0) / total * 100) if total else 0
    
    insights = []
    if positive_pct > 70:
        insights.append(f"⭐ Excellent satisfaction: {positive_pct:.1f}% positive reviews")
    elif positive_pct > 50:
        insights.append(f"✅ Good satisfaction: {positive_pct:.1f}% positive reviews")
    
    if negative_pct > 30:
        insights.append(f"⚠️ High negativity: {negative_pct:.1f}% negative reviews")
    
    if keywords:
        top_words = ", ".join([k['word'] for k in keywords[:5]])
        insights.append(f"🔤 Top keywords: {top_words}")
    
    return {
        "reviews": analyzed,
        "sentiment_distribution": {
            "positive": sentiment_counts.get('positive', 0),
            "neutral": sentiment_counts.get('neutral', 0),
            "negative": sentiment_counts.get('negative', 0)
        },
        "top_keywords": keywords,
        "insights": insights,
        "summary": f"Analyzed {total} reviews. Overall sentiment: {'Positive' if positive_pct > 50 else 'Mixed'}"
    }

def generate_growth_data(asin: str, period: str = "week") -> List[Dict]:
    """Generate buyer growth data"""
    import random
    from datetime import datetime, timedelta
    
    data = []
    base_buyers = random.randint(100, 500)
    
    if period == "day":
        hours = 24
        for i in range(hours):
            time = datetime.now() - timedelta(hours=hours-i)
            buyers = base_buyers + random.randint(-20, 50)
            data.append({
                "date": time.strftime("%H:%M"),
                "buyers": buyers,
                "trend": "up" if random.random() > 0.5 else "down"
            })
    else:  # week
        days = 7
        for i in range(days):
            date = datetime.now() - timedelta(days=days-i-1)
            buyers = base_buyers + (i * random.randint(5, 20)) + random.randint(-30, 30)
            data.append({
                "date": date.strftime("%a"),
                "buyers": max(50, buyers),
                "trend": "up" if i > days/2 else "down"
            })
    
    return data

# ============= API ENDPOINTS =============
@app.get("/api/v1/growth/{asin}")
async def get_buyer_growth(asin: str, period: str = "week"):
    """
    Generate buyer growth data for visualization
    This is MOCK DATA for demonstration - integrate with real data source later
    """
    try:
        from datetime import datetime, timedelta
        import random
        
        # Generate mock growth data based on period
        periods = {
            "day": 7,
            "week": 12,
            "month": 6,
            "quarter": 4
        }
        
        data_points = periods.get(period, 12)
        now = datetime.now()
        
        growth_data = []
        base_buyers = 1000
        
        for i in range(data_points):
            if period == "day":
                date = (now - timedelta(days=data_points - i - 1)).strftime("%Y-%m-%d")
                label = (now - timedelta(days=data_points - i - 1)).strftime("%a")
            elif period == "week":
                date = (now - timedelta(weeks=data_points - i - 1)).strftime("%Y-%m-%d")
                label = f"Week {i + 1}"
            elif period == "month":
                date = (now - timedelta(days=30 * (data_points - i - 1))).strftime("%Y-%m-%d")
                label = (now - timedelta(days=30 * (data_points - i - 1))).strftime("%b")
            else:  # quarter
                date = (now - timedelta(days=90 * (data_points - i - 1))).strftime("%Y-%m-%d")
                label = f"Q{i + 1}"
            
            # Generate growth trend with some randomness
            growth_factor = 1 + (i * 0.05) + (random.uniform(-0.1, 0.1))
            buyers = int(base_buyers * growth_factor)
            
            growth_data.append({
                "date": date,
                "label": label,
                "buyers": buyers,
                "growth_rate": round((growth_factor - 1) * 100, 1)
            })
        
        return {
            "success": True,
            "asin": asin,
            "period": period,
            "data": growth_data,
            "metadata": {
                "timestamp": datetime.now().isoformat(),
                "data_points": len(growth_data),
                "note": "This is simulated data for demonstration"
            }
        }
    except Exception as e:
        print(f"Error generating growth data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "app": config.APP_NAME,
        "version": config.APP_VERSION,
        "status": "operational",
        "apify": "connected" if apify_client else "not configured",
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "analyze": "/api/v1/analyze",
            "growth": "/api/v1/growth/{asin}"
        }
    }

@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "api": "operational",
            "apify": "connected" if apify_client else "not configured",
            "ai": "enabled" if config.ENABLE_AI else "disabled"
        }
    }

@app.post("/api/v1/analyze")
async def analyze_product(request: Dict):
    """Main analysis endpoint"""
    try:
        asin = request.get("asin")
        if not asin:
            raise HTTPException(status_code=400, detail="ASIN is required")
        
        max_reviews = min(request.get("max_reviews", 50), config.MAX_REVIEWS)
        enable_ai = request.get("enable_ai", config.ENABLE_AI)
        country = request.get("country", "US")
        
        logger.info(f"🔍 Analyzing ASIN: {asin}")
        
        # Fetch reviews (Apify or mock)
        reviews_data = await fetch_apify_reviews(asin, max_reviews, country)
        
        if not reviews_data.get("success"):
            return reviews_data
        
        # AI/NLP analysis
        if enable_ai and reviews_data.get("reviews"):
            analysis = analyze_reviews(reviews_data["reviews"])
            reviews_data.update(analysis)
        
        # Store growth data point
        growth_data_store[asin].append({
            "timestamp": datetime.utcnow().isoformat(),
            "review_count": reviews_data.get("total_reviews", 0),
            "rating": reviews_data.get("average_rating", 0)
        })
        
        return {
            "success": True,
            "data": reviews_data,
            "metadata": {
                "asin": asin,
                "timestamp": datetime.utcnow().isoformat(),
                "data_source": reviews_data.get("data_source", "unknown"),
                "ai_enabled": enable_ai
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}\n{traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/reviews/fetch")
async def fetch_reviews(request: Dict):
    """Fetch reviews without analysis"""
    try:
        asin = request.get("asin")
        if not asin:
            raise HTTPException(status_code=400, detail="ASIN is required")
        
        max_reviews = min(request.get("max_reviews", 50), config.MAX_REVIEWS)
        country = request.get("country", "US")
        
        logger.info(f"📦 Fetching reviews for ASIN: {asin}")
        
        reviews_data = await fetch_apify_reviews(asin, max_reviews, country)
        
        return reviews_data
        
    except Exception as e:
        logger.error(f"Fetch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/growth/{asin}")
async def get_growth(asin: str, period: str = "week"):
    """Get buyer growth data"""
    try:
        # Generate or retrieve growth data
        growth_data = generate_growth_data(asin, period)
        
        return {
            "success": True,
            "asin": asin,
            "period": period,
            "data": growth_data
        }
        
    except Exception as e:
        logger.error(f"Growth data error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/insights")
async def generate_insights(request: Dict):
    """Generate insights from reviews"""
    try:
        reviews = request.get("reviews", [])
        if not reviews:
            raise HTTPException(status_code=400, detail="Reviews data required")
        
        analysis = analyze_reviews(reviews)
        
        return {
            "success": True,
            "insights": analysis.get("insights", []),
            "summary": analysis.get("summary", ""),
            "keywords": analysis.get("top_keywords", [])
        }
        
    except Exception as e:
        logger.error(f"Insights error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= ERROR HANDLERS =============

@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found"}
    )

@app.exception_handler(500)
async def server_error(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )

# ============= RUN SERVER =============

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=config.DEBUG,
        log_level="info"
    )