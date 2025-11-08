# ================================================================
# FIXED: backend/app/api/endpoints/analyze.py
# Critical fixes for sentiment classification and review sampling
# ================================================================

"""
Key fixes:
1. Proper sentiment thresholds for VADER (compound score)
2. Separate positive/negative review extraction
3. Enhanced summarization with minimum word counts
4. Product info extraction and validation
"""

import logging
from typing import List, Dict, Any
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

logger = logging.getLogger(__name__)
vader_analyzer = SentimentIntensityAnalyzer()


def analyze_sentiment_enhanced(text: str) -> Dict[str, Any]:
    """
    Enhanced sentiment analysis combining VADER and TextBlob
    
    Returns:
        {
            'sentiment': 'positive' | 'negative' | 'neutral',
            'vader_compound': float,
            'textblob_polarity': float,
            'confidence': float,
            'subjectivity': float
        }
    """
    # VADER analysis (better for social media/reviews)
    vader_scores = vader_analyzer.polarity_scores(text)
    compound = vader_scores['compound']
    
    # TextBlob analysis (good for polarity)
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Determine sentiment with proper thresholds
    # CRITICAL FIX: Use VADER's compound score with correct thresholds
    if compound >= 0.05:  # Positive threshold
        sentiment = "positive"
    elif compound <= -0.05:  # Negative threshold
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    # Calculate confidence (average of absolute values)
    confidence = (abs(compound) + abs(polarity)) / 2
    
    return {
        'sentiment': sentiment,
        'vader_compound': round(compound, 3),
        'textblob_polarity': round(polarity, 3),
        'confidence': round(confidence, 3),
        'subjectivity': round(subjectivity, 3)
    }


def extract_review_samples(reviews_data: List[Dict], sample_size: int = 3) -> Dict[str, List[Dict]]:
    """
    Extract distinct positive and negative review samples
    
    CRITICAL FIX: Properly filter reviews by sentiment score
    """
    positive_reviews = []
    negative_reviews = []
    neutral_reviews = []
    
    for review in reviews_data:
        sentiment_info = review.get('sentiment_analysis', {})
        compound_score = sentiment_info.get('vader_compound', 0)
        
        # FIXED: Use proper threshold-based classification
        if compound_score >= 0.05:
            positive_reviews.append(review)
        elif compound_score <= -0.05:
            negative_reviews.append(review)
        else:
            neutral_reviews.append(review)
    
    # Sort by sentiment score magnitude for best examples
    positive_reviews.sort(key=lambda x: x.get('sentiment_analysis', {}).get('vader_compound', 0), reverse=True)
    negative_reviews.sort(key=lambda x: x.get('sentiment_analysis', {}).get('vader_compound', 0))
    
    return {
        'positive': positive_reviews[:sample_size],
        'negative': negative_reviews[:sample_size],
        'neutral': neutral_reviews[:sample_size]
    }


def generate_comprehensive_summary(reviews_data: List[Dict], sentiment_dist: Dict[str, int]) -> Dict[str, str]:
    """
    Generate comprehensive summaries with minimum word counts
    
    FIXED: Ensure summaries are detailed and informative (100+ words each)
    """
    total_reviews = len(reviews_data)
    if total_reviews == 0:
        return {
            'overall': "No reviews available for analysis.",
            'positive_highlights': "No positive reviews found.",
            'negative_highlights': "No negative reviews found."
        }
    
    # Calculate percentages
    positive_pct = (sentiment_dist.get('positive', 0) / total_reviews) * 100
    negative_pct = (sentiment_dist.get('negative', 0) / total_reviews) * 100
    neutral_pct = (sentiment_dist.get('neutral', 0) / total_reviews) * 100
    
    # Extract common themes
    positive_keywords = extract_top_keywords([r for r in reviews_data if r.get('sentiment_analysis', {}).get('sentiment') == 'positive'], top_n=5)
    negative_keywords = extract_top_keywords([r for r in reviews_data if r.get('sentiment_analysis', {}).get('sentiment') == 'negative'], top_n=5)
    
    # Generate overall summary (minimum 100 words)
    overall_summary = f"""
    Based on comprehensive analysis of {total_reviews} customer reviews, the product demonstrates 
    {'strong positive reception' if positive_pct > 70 else 'mixed customer sentiment' if positive_pct > 40 else 'concerning negative feedback'}.
    
    Sentiment Distribution: {positive_pct:.1f}% positive, {neutral_pct:.1f}% neutral, and {negative_pct:.1f}% negative reviews.
    
    {'Customers are overwhelmingly satisfied with their purchase, with the vast majority recommending the product.' if positive_pct > 70 else ''}
    {'The product receives generally favorable feedback, though there are some areas that could benefit from improvement.' if 40 < positive_pct <= 70 else ''}
    {'Customer feedback indicates significant dissatisfaction, suggesting critical issues that need to be addressed.' if positive_pct <= 40 else ''}
    
    Common themes in customer feedback include {', '.join([kw['word'] for kw in positive_keywords[:3]])} as positive aspects,
    while concerns center around {', '.join([kw['word'] for kw in negative_keywords[:3]])}. This analysis provides actionable
    insights for product improvement and customer satisfaction enhancement.
    """.strip()
    
    # Generate positive highlights (minimum 100 words)
    positive_highlights = f"""
    Positive customer feedback ({positive_pct:.1f}% of reviews) highlights several key strengths:
    
    1. **Quality and Value**: Customers frequently mention {positive_keywords[0]['word'] if positive_keywords else 'quality'} 
       as a standout feature, with many reviewers expressing satisfaction with their purchase decision.
    
    2. **Performance**: The product consistently meets or exceeds customer expectations in terms of functionality and reliability.
       Users appreciate {positive_keywords[1]['word'] if len(positive_keywords) > 1 else 'performance'} aspects.
    
    3. **Customer Experience**: Many positive reviews emphasize smooth transactions, quick delivery, and products arriving
       as described. The {positive_keywords[2]['word'] if len(positive_keywords) > 2 else 'overall experience'} contributes
       significantly to customer satisfaction.
    
    These positive indicators suggest strong product-market fit and customer approval, which bodes well for continued success
    and positive word-of-mouth marketing.
    """.strip()
    
    # Generate negative highlights (minimum 100 words)
    negative_highlights = f"""
    Critical feedback ({negative_pct:.1f}% of reviews) identifies areas requiring attention:
    
    1. **Primary Concerns**: Customer complaints frequently mention {negative_keywords[0]['word'] if negative_keywords else 'quality issues'}
       as a significant pain point. This represents the most common source of dissatisfaction and should be prioritized for improvement.
    
    2. **Performance Issues**: Some customers report problems with {negative_keywords[1]['word'] if len(negative_keywords) > 1 else 'functionality'},
       suggesting potential quality control or product design issues that need investigation.
    
    3. **Customer Expectations**: Negative reviews often cite {negative_keywords[2]['word'] if len(negative_keywords) > 2 else 'expectations'}
       not being met, whether due to product description accuracy, delivery issues, or performance gaps.
    
    Addressing these concerns through product improvements, better quality control, and enhanced customer communication could
    significantly reduce negative sentiment and improve overall customer satisfaction scores.
    """.strip()
    
    return {
        'overall': overall_summary,
        'positive_highlights': positive_highlights,
        'negative_highlights': negative_highlights
    }


def extract_top_keywords(reviews: List[Dict], top_n: int = 10) -> List[Dict[str, Any]]:
    """
    Extract keywords from reviews with frequency counts
    """
    from collections import Counter
    import re
    
    # Common stopwords
    stopwords = {
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'this',
        'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
        'should', 'may', 'might', 'must', 'can', 'it', 'its', 'i', 'me', 'my',
        'you', 'your', 'he', 'him', 'his', 'she', 'her', 'we', 'our', 'they'
    }
    
    all_words = []
    for review in reviews:
        text = f"{review.get('title', '')} {review.get('text', '')}".lower()
        # Extract words (alphanumeric only, 3+ characters)
        words = re.findall(r'\b[a-z]{3,}\b', text)
        filtered_words = [w for w in words if w not in stopwords]
        all_words.extend(filtered_words)
    
    word_freq = Counter(all_words)
    return [
        {'word': word, 'count': count}
        for word, count in word_freq.most_common(top_n)
    ]


def extract_product_info(reviews_data: List[Dict]) -> Dict[str, Any]:
    """
    Extract product information from reviews
    
    FIXED: Properly extract and validate product metadata
    """
    product_info = {
        'title': None,
        'image_url': None,
        'asin': None,
        'url': None
    }
    
    # Try to extract from first review with complete data
    for review in reviews_data:
        if not product_info['title'] and review.get('productTitle'):
            product_info['title'] = review['productTitle']
        
        if not product_info['image_url'] and review.get('productImageUrl'):
            product_info['image_url'] = review['productImageUrl']
        
        if not product_info['asin'] and review.get('asin'):
            product_info['asin'] = review['asin']
        
        if not product_info['url'] and review.get('productUrl'):
            product_info['url'] = review['productUrl']
        
        # Break if we have all info
        if all([product_info['title'], product_info['image_url'], product_info['asin']]):
            break
    
    return product_info


# ================================================================
# USAGE EXAMPLE IN MAIN ENDPOINT
# ================================================================

"""
In your main analyze endpoint, use these functions like this:

async def analyze_reviews(request: AnalysisRequest):
    # ... fetch reviews from Apify ...
    
    processed_reviews = []
    sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0}
    
    for review in reviews_data:
        # Analyze sentiment
        sentiment_info = analyze_sentiment_enhanced(
            f"{review.get('title', '')} {review.get('text', '')}"
        )
        
        review_dict = {
            "title": review.get("title"),
            "text": review.get("text"),
            "stars": review.get("stars"),
            "date": review.get("date"),
            "verified": review.get("verified", False),
            "sentiment": sentiment_info['sentiment'],
            "sentiment_score": sentiment_info['vader_compound'],
            "sentiment_analysis": sentiment_info  # Full analysis
        }
        
        processed_reviews.append(review_dict)
        sentiment_distribution[sentiment_info['sentiment']] += 1
    
    # Extract samples
    review_samples = extract_review_samples(processed_reviews, sample_size=3)
    
    # Generate summaries
    summaries = generate_comprehensive_summary(processed_reviews, sentiment_distribution)
    
    # Extract product info
    product_info = extract_product_info(reviews_data)
    
    # Calculate average rating
    average_rating = sum(r.get('stars', 0) for r in processed_reviews) / len(processed_reviews) if processed_reviews else 0
    
    return {
        "success": True,
        "product_info": product_info,
        "average_rating": round(average_rating, 2),
        "total_reviews": len(processed_reviews),
        "sentiment_distribution": sentiment_distribution,
        "reviews": processed_reviews,
        "review_samples": review_samples,
        "summaries": summaries,
        # ... other fields ...
    }
"""        elif compound <= -0.05:
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
