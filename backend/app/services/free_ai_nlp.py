"""
Free AI/NLP Service using VADER, TextBlob, and NLTK
No API keys required - 100% free and open source
"""

from typing import Dict, List, Any, Optional
import re
from collections import Counter

# VADER Sentiment (Free, no API needed)
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# TextBlob for additional NLP (Free)
from textblob import TextBlob

# NLTK for text processing
import nltk
import ssl

# Handle SSL certificate issues on some systems
try:
    _create_unverified_https_context = ssl._create_unverified_context
except AttributeError:
    pass
else:
    ssl._create_default_https_context = _create_unverified_https_context

# Download required NLTK data with better error handling
def download_nltk_data():
    """Download all required NLTK data packages"""
    packages = [
        'punkt',
        'punkt_tab',  # New tokenizer
        'stopwords',
        'averaged_perceptron_tagger',
        'averaged_perceptron_tagger_eng',
    ]
    
    for package in packages:
        try:
            nltk.download(package, quiet=True)
        except Exception as e:
            print(f"⚠️  Warning: Could not download NLTK package '{package}': {e}")

# Download data on import
try:
    download_nltk_data()
except Exception as e:
    print(f"⚠️  Warning: NLTK data download failed: {e}")

# Import with fallback
try:
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize
    NLTK_AVAILABLE = True
except Exception as e:
    print(f"⚠️  Warning: NLTK tokenizer not available: {e}")
    NLTK_AVAILABLE = False


class FreeAINLP:
    """
    Free AI/NLP service combining multiple open-source libraries
    - VADER: Sentiment analysis (social media optimized)
    - TextBlob: Polarity, subjectivity, language detection
    - NLTK: Keyword extraction, POS tagging (optional)
    """
    
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        
        # Initialize stopwords with fallback
        if NLTK_AVAILABLE:
            try:
                self.stop_words = set(stopwords.words('english'))
            except Exception as e:
                print(f"⚠️  Warning: Could not load stopwords, using fallback: {e}")
                self.stop_words = self._get_fallback_stopwords()
        else:
            self.stop_words = self._get_fallback_stopwords()
    
    def _get_fallback_stopwords(self) -> set:
        """Fallback stopwords if NLTK is not available"""
        return {
            'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 
            'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
            'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
            'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
            'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
            'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
            'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
            'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
            'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
            'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
            'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
            'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
            'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
            's', 't', 'can', 'will', 'just', 'don', 'should', 'now'
        }
    
    def _simple_tokenize(self, text: str) -> List[str]:
        """Simple word tokenization fallback"""
        # Remove punctuation and split
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        return text.split()
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Comprehensive sentiment analysis using VADER + TextBlob
        """
        # VADER scores (best for social media text)
        vader_scores = self.vader.polarity_scores(text)
        
        # TextBlob analysis
        blob = TextBlob(text)
        
        # Determine sentiment label
        compound = vader_scores['compound']
        if compound >= 0.05:
            sentiment = "positive"
        elif compound <= -0.05:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        # Confidence score
        confidence = abs(compound)
        
        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 3),
            "scores": {
                "positive": round(vader_scores['pos'], 3),
                "neutral": round(vader_scores['neu'], 3),
                "negative": round(vader_scores['neg'], 3),
                "compound": round(compound, 3)
            },
            "polarity": round(blob.sentiment.polarity, 3),
            "subjectivity": round(blob.sentiment.subjectivity, 3)
        }
    
    def detect_emotions(self, text: str) -> Dict[str, float]:
        """
        Basic emotion detection using keyword matching
        Returns emotion scores for: joy, sadness, anger, fear, surprise
        """
        text_lower = text.lower()
        
        emotion_keywords = {
            "joy": ["love", "amazing", "excellent", "great", "perfect", "wonderful", 
                   "fantastic", "happy", "delighted", "impressed", "outstanding"],
            "sadness": ["disappointed", "poor", "waste", "regret", "unhappy", 
                       "terrible", "awful", "worst", "bad", "useless"],
            "anger": ["angry", "frustrated", "furious", "annoyed", "irritated", 
                     "disgusted", "hate", "horrible"],
            "fear": ["worried", "concerned", "nervous", "afraid", "scared", 
                    "dangerous", "unsafe"],
            "surprise": ["unexpected", "surprised", "shocking", "amazing", 
                        "unbelievable", "wow"]
        }
        
        emotions = {}
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text_lower)
            emotions[emotion] = round(score / len(keywords), 3)
        
        return emotions
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """
        Extract important keywords using frequency analysis
        """
        try:
            # Try NLTK tokenization first
            if NLTK_AVAILABLE:
                words = word_tokenize(text.lower())
            else:
                words = self._simple_tokenize(text)
        except Exception as e:
            print(f"⚠️  Tokenization error, using fallback: {e}")
            words = self._simple_tokenize(text)
        
        # Filter words
        words = [w for w in words if w.isalnum() and w not in self.stop_words and len(w) > 3]
        
        # Count frequencies
        word_freq = Counter(words)
        
        # Get top keywords
        keywords = []
        for word, count in word_freq.most_common(top_n):
            keywords.append({
                "word": word,
                "frequency": count,
                "relevance": round(count / len(words), 3) if words else 0
            })
        
        return keywords
    
    def extract_themes(self, reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Identify common themes across reviews
        """
        all_text = " ".join([r.get("text", "") for r in reviews])
        
        # Common product aspects
        aspect_keywords = {
            "quality": ["quality", "build", "material", "durable", "sturdy", "solid"],
            "price": ["price", "expensive", "cheap", "value", "worth", "cost"],
            "performance": ["performance", "works", "fast", "slow", "efficient", "speed"],
            "delivery": ["delivery", "shipping", "arrived", "packaging", "package"],
            "customer_service": ["service", "support", "customer", "help", "response"],
            "features": ["feature", "function", "option", "capability", "easy", "difficult"],
            "design": ["design", "look", "appearance", "style", "color", "size"]
        }
        
        themes = []
        all_text_lower = all_text.lower()
        
        for theme, keywords in aspect_keywords.items():
            mentions = sum(1 for keyword in keywords if keyword in all_text_lower)
            if mentions > 0:
                # Get sentiment for this theme
                theme_text = " ".join([
                    r.get("text", "") for r in reviews 
                    if any(kw in r.get("text", "").lower() for kw in keywords)
                ])
                
                sentiment = self.analyze_sentiment(theme_text) if theme_text else {"sentiment": "neutral", "confidence": 0}
                
                themes.append({
                    "theme": theme.replace("_", " ").title(),
                    "mentions": mentions,
                    "sentiment": sentiment["sentiment"],
                    "confidence": sentiment["confidence"],
                    "keywords": keywords[:3]
                })
        
        # Sort by mentions
        themes.sort(key=lambda x: x["mentions"], reverse=True)
        return themes[:5]
    
    def analyze_review_batch(self, reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze a batch of reviews and return comprehensive insights
        """
        if not reviews:
            return {
                "success": False,
                "error": "No reviews provided"
            }
        
        # Analyze each review
        analyzed_reviews = []
        for review in reviews:
            text = review.get("text", "")
            if not text:
                continue
                
            analysis = self.analyze_sentiment(text)
            emotions = self.detect_emotions(text)
            
            analyzed_reviews.append({
                **review,
                "ai_sentiment": analysis["sentiment"],
                "sentiment_confidence": analysis["confidence"],
                "sentiment_scores": analysis["scores"],
                "polarity": analysis["polarity"],
                "subjectivity": analysis["subjectivity"],
                "emotions": emotions
            })
        
        # Aggregate statistics
        sentiments = [r["ai_sentiment"] for r in analyzed_reviews]
        sentiment_distribution = {
            "positive": sentiments.count("positive"),
            "neutral": sentiments.count("neutral"),
            "negative": sentiments.count("negative")
        }
        
        # Average scores
        avg_confidence = sum(r["sentiment_confidence"] for r in analyzed_reviews) / len(analyzed_reviews)
        avg_polarity = sum(r["polarity"] for r in analyzed_reviews) / len(analyzed_reviews)
        avg_subjectivity = sum(r["subjectivity"] for r in analyzed_reviews) / len(analyzed_reviews)
        
        # Extract themes
        themes = self.extract_themes(reviews)
        
        # Top keywords
        all_text = " ".join([r.get("text", "") for r in reviews])
        keywords = self.extract_keywords(all_text, top_n=15)
        
        return {
            "success": True,
            "total_analyzed": len(analyzed_reviews),
            "reviews": analyzed_reviews,
            "sentiment_distribution": sentiment_distribution,
            "aggregate_metrics": {
                "avg_confidence": round(avg_confidence, 3),
                "avg_polarity": round(avg_polarity, 3),
                "avg_subjectivity": round(avg_subjectivity, 3)
            },
            "themes": themes,
            "top_keywords": keywords,
            "ai_provider": "free_nlp_stack",
            "models_used": ["VADER", "TextBlob", "NLTK" if NLTK_AVAILABLE else "Simple Tokenizer"]
        }
    
    def generate_insights(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate human-readable insights from analysis
        """
        if not analysis.get("success"):
            return {"insights": [], "summary": "No analysis data available"}
        
        insights = []
        sentiment_dist = analysis.get("sentiment_distribution", {})
        total = sum(sentiment_dist.values())
        
        # Sentiment insights
        if total > 0:
            positive_pct = (sentiment_dist.get("positive", 0) / total) * 100
            negative_pct = (sentiment_dist.get("negative", 0) / total) * 100
            
            if positive_pct > 70:
                insights.append(f"⭐ Overwhelmingly positive reception ({positive_pct:.1f}% positive reviews)")
            elif positive_pct > 50:
                insights.append(f"✓ Generally positive feedback ({positive_pct:.1f}% positive)")
            elif negative_pct > 50:
                insights.append(f"⚠ Concerning negative sentiment ({negative_pct:.1f}% negative reviews)")
        
        # Theme insights
        themes = analysis.get("themes", [])
        if themes:
            top_theme = themes[0]
            insights.append(f"🎯 Most discussed: {top_theme['theme']} ({top_theme['mentions']} mentions)")
        
        # Subjectivity insight
        avg_subj = analysis.get("aggregate_metrics", {}).get("avg_subjectivity", 0)
        if avg_subj > 0.6:
            insights.append("💭 Reviews are highly subjective and opinion-based")
        elif avg_subj < 0.4:
            insights.append("📊 Reviews are factual and objective")
        
        # Generate summary
        summary = f"Analyzed {analysis.get('total_analyzed', 0)} reviews using free AI/NLP models. "
        if positive_pct > 60:
            summary += "Overall sentiment is positive with strong customer satisfaction."
        elif negative_pct > 40:
            summary += "Mixed to negative feedback indicates areas needing improvement."
        else:
            summary += "Balanced mix of opinions across the customer base."
        
        # Get confidence level
        avg_confidence = analysis.get("aggregate_metrics", {}).get("avg_confidence", 0)
        
        return {
            "insights": insights,
            "summary": summary,
            "confidence_level": "high" if avg_confidence > 0.6 else "medium"
        }


# Singleton instance
free_ai_nlp = FreeAINLP()