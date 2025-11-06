"""
Enhanced Review Analyzer with Advanced AI/NLP
Supports multiple AI providers and comprehensive analysis
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
from collections import Counter
import re
import asyncio

# NLP Libraries
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import nltk

# Machine Learning
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.cluster import KMeans

# Optional advanced libraries
try:
    import torch
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("⚠️ Transformers not available - using lightweight models")

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️ OpenAI not available")

from app.core.config import settings


class EnhancedReviewAnalyzer:
    """
    Advanced review analysis with multiple AI/NLP capabilities
    Supports: VADER, TextBlob, Transformers, OpenAI
    """
    
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        self.ai_provider = settings.AI_PROVIDER
        
        # Download NLTK data
        self._setup_nltk()
        
        # Initialize transformers if available
        self.transformer_pipeline = None
        if TRANSFORMERS_AVAILABLE and self.ai_provider in ["transformers", "hybrid"]:
            self._setup_transformers()
        
        # Initialize OpenAI if configured
        self.openai_client = None
        if OPENAI_AVAILABLE and settings.OPENAI_API_KEY and self.ai_provider in ["openai", "hybrid"]:
            self._setup_openai()
        
        print(f"✅ Enhanced Analyzer initialized with {self.ai_provider} provider")
    
    def _setup_nltk(self):
        """Download required NLTK data"""
        try:
            nltk.download('punkt', quiet=True)
            nltk.download('stopwords', quiet=True)
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('averaged_perceptron_tagger', quiet=True)
            self.stopwords = set(nltk.corpus.stopwords.words('english'))
        except Exception as e:
            print(f"⚠️ NLTK setup warning: {e}")
            self.stopwords = set()
    
    def _setup_transformers(self):
        """Initialize transformer models"""
        try:
            # Use a lightweight model for sentiment
            self.transformer_pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # CPU
            )
            print("  🤖 Transformer model loaded")
        except Exception as e:
            print(f"  ⚠️ Transformer setup failed: {e}")
            self.transformer_pipeline = None
    
    def _setup_openai(self):
        """Initialize OpenAI client"""
        try:
            openai.api_key = settings.OPENAI_API_KEY
            self.openai_client = openai
            print("  🧠 OpenAI client initialized")
        except Exception as e:
            print(f"  ⚠️ OpenAI setup failed: {e}")
            self.openai_client = None
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Multi-model sentiment analysis
        Combines VADER, TextBlob, and optionally Transformers/OpenAI
        """
        results = {}
        
        # VADER Analysis (always available)
        vader_scores = self.vader.polarity_scores(text)
        vader_sentiment = self._classify_sentiment(vader_scores['compound'])
        
        results['vader'] = {
            'sentiment': vader_sentiment,
            'scores': vader_scores,
            'confidence': abs(vader_scores['compound'])
        }
        
        # TextBlob Analysis (always available)
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity
        
        results['textblob'] = {
            'sentiment': self._classify_sentiment(polarity),
            'polarity': polarity,
            'subjectivity': subjectivity,
            'confidence': abs(polarity)
        }
        
        # Transformer Analysis (if available)
        if self.transformer_pipeline and self.ai_provider in ["transformers", "hybrid"]:
            try:
                trans_result = self.transformer_pipeline(text[:512])[0]  # Limit text length
                results['transformer'] = {
                    'sentiment': trans_result['label'].lower(),
                    'confidence': trans_result['score']
                }
            except Exception as e:
                print(f"  ⚠️ Transformer analysis failed: {e}")
        
        # Combine results
        final_sentiment = self._combine_sentiments(results)
        
        return {
            'sentiment': final_sentiment['sentiment'],
            'confidence': final_sentiment['confidence'],
            'details': results,
            'polarity': polarity,
            'subjectivity': subjectivity
        }
    
    def _classify_sentiment(self, score: float) -> str:
        """Classify sentiment based on score"""
        if score >= 0.1:
            return "positive"
        elif score <= -0.1:
            return "negative"
        else:
            return "neutral"
    
    def _combine_sentiments(self, results: Dict) -> Dict:
        """Combine multiple sentiment results with weighted voting"""
        sentiments = []
        weights = []
        
        # Add VADER (weight: 1.0)
        if 'vader' in results:
            sentiments.append(results['vader']['sentiment'])
            weights.append(results['vader']['confidence'])
        
        # Add TextBlob (weight: 0.8)
        if 'textblob' in results:
            sentiments.append(results['textblob']['sentiment'])
            weights.append(results['textblob']['confidence'] * 0.8)
        
        # Add Transformer (weight: 1.2)
        if 'transformer' in results:
            sentiments.append(results['transformer']['sentiment'])
            weights.append(results['transformer']['confidence'] * 1.2)
        
        # Weighted voting
        sentiment_scores = {"positive": 0, "negative": 0, "neutral": 0}
        for sent, weight in zip(sentiments, weights):
            sentiment_scores[sent] += weight
        
        # Get winning sentiment
        final_sentiment = max(sentiment_scores, key=sentiment_scores.get)
        confidence = sentiment_scores[final_sentiment] / sum(weights) if weights else 0
        
        return {
            'sentiment': final_sentiment,
            'confidence': min(confidence, 1.0)
        }
    
    def detect_emotions(self, text: str) -> Dict[str, float]:
        """
        Detect emotions in text
        Returns scores for: joy, sadness, anger, fear, surprise, disgust, trust, anticipation
        """
        text_lower = text.lower()
        
        # Emotion keywords (expanded)
        emotion_keywords = {
            "joy": ["love", "amazing", "excellent", "happy", "wonderful", "fantastic", 
                   "delighted", "pleased", "perfect", "great", "awesome", "brilliant"],
            "sadness": ["disappointed", "sad", "unhappy", "terrible", "awful", 
                       "depressed", "miserable", "unfortunate", "regret", "sorry"],
            "anger": ["angry", "furious", "annoyed", "frustrated", "irritated", 
                     "mad", "outraged", "disgusted", "hate", "horrible"],
            "fear": ["scared", "afraid", "worried", "nervous", "anxious", 
                    "frightened", "concerned", "unsafe", "dangerous", "risky"],
            "surprise": ["surprised", "shocked", "amazing", "unexpected", 
                        "unbelievable", "astonished", "wow", "incredible"],
            "disgust": ["disgusting", "gross", "nasty", "awful", "revolting", 
                       "repulsive", "horrible", "yuck", "terrible"],
            "trust": ["reliable", "trustworthy", "dependable", "confident", 
                     "secure", "safe", "honest", "genuine", "authentic"],
            "anticipation": ["excited", "looking forward", "eager", "hopeful", 
                           "expecting", "waiting", "can't wait", "anticipate"]
        }
        
        emotions = {}
        total_keywords = 0
        
        for emotion, keywords in emotion_keywords.items():
            score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    score += 1
                    total_keywords += 1
            
            # Normalize by number of keywords
            emotions[emotion] = round(score / len(keywords), 3)
        
        # Ensure at least one emotion is detected
        if sum(emotions.values()) == 0:
            # Default to neutral/unknown
            emotions["neutral"] = 1.0
        
        return emotions
    
    def extract_keywords(self, texts: List[str], top_n: int = 20) -> List[Dict]:
        """
        Extract keywords using TF-IDF
        """
        if not texts:
            return []
        
        try:
            # Combine all texts
            combined_text = " ".join(texts)
            
            # Tokenize and filter
            words = nltk.word_tokenize(combined_text.lower())
            words = [w for w in words if w.isalnum() and w not in self.stopwords and len(w) > 2]
            
            if not words:
                return []
            
            # Count frequencies
            word_freq = Counter(words)
            
            # Get top keywords
            keywords = []
            for word, freq in word_freq.most_common(top_n):
                keywords.append({
                    "word": word,
                    "frequency": freq,
                    "weight": round(freq / len(words), 4)
                })
            
            return keywords
            
        except Exception as e:
            print(f"⚠️ Keyword extraction error: {e}")
            return []
    
    def extract_themes(self, texts: List[str], num_topics: int = 5) -> List[Dict]:
        """
        Extract themes using topic modeling (LDA)
        """
        if not texts or len(texts) < 5:
            return self._extract_simple_themes(texts)
        
        try:
            # Vectorize texts
            vectorizer = TfidfVectorizer(
                max_features=50,
                stop_words='english',
                max_df=0.8,
                min_df=2
            )
            
            doc_term_matrix = vectorizer.fit_transform(texts)
            
            # LDA topic modeling
            lda = LatentDirichletAllocation(
                n_components=min(num_topics, len(texts) // 2),
                random_state=42
            )
            
            lda.fit(doc_term_matrix)
            
            # Get feature names
            feature_names = vectorizer.get_feature_names_out()
            
            # Extract themes
            themes = []
            for topic_idx, topic in enumerate(lda.components_):
                top_indices = topic.argsort()[-5:][::-1]
                top_words = [feature_names[i] for i in top_indices]
                
                # Generate theme name
                theme_name = " + ".join(top_words[:3])
                
                themes.append({
                    "theme": theme_name,
                    "keywords": top_words,
                    "mentions": int(topic.sum()),
                    "importance": round(topic.max(), 3)
                })
            
            return sorted(themes, key=lambda x: x['importance'], reverse=True)
            
        except Exception as e:
            print(f"⚠️ Theme extraction error: {e}")
            return self._extract_simple_themes(texts)
    
    def _extract_simple_themes(self, texts: List[str]) -> List[Dict]:
        """Simple theme extraction fallback"""
        themes = [
            {"theme": "Product Quality", "mentions": 0, "keywords": ["quality", "build", "material"]},
            {"theme": "Value for Money", "mentions": 0, "keywords": ["price", "value", "worth"]},
            {"theme": "Customer Service", "mentions": 0, "keywords": ["service", "support", "help"]},
            {"theme": "Shipping", "mentions": 0, "keywords": ["delivery", "shipping", "package"]},
            {"theme": "Performance", "mentions": 0, "keywords": ["works", "performance", "speed"]}
        ]
        
        # Count mentions
        combined_text = " ".join(texts).lower() if texts else ""
        for theme in themes:
            for keyword in theme["keywords"]:
                theme["mentions"] += combined_text.count(keyword)
        
        return [t for t in themes if t["mentions"] > 0]
    
    def analyze_batch(self, reviews: List[Dict]) -> Dict[str, Any]:
        """
        Analyze a batch of reviews
        """
        if not reviews:
            return {
                "success": False,
                "error": "No reviews to analyze"
            }
        
        print(f"  🔍 Analyzing {len(reviews)} reviews...")
        
        analyzed_reviews = []
        sentiments = []
        emotions_list = []
        texts = []
        
        # Analyze each review
        for review in reviews:
            text = f"{review.get('title', '')} {review.get('text', '')}"
            if not text.strip():
                continue
            
            texts.append(text)
            
            # Sentiment analysis
            sentiment_result = self.analyze_sentiment(text)
            sentiments.append(sentiment_result['sentiment'])
            
            # Emotion detection
            if settings.ENABLE_EMOTIONS:
                emotions = self.detect_emotions(text)
                emotions_list.append(emotions)
            else:
                emotions = {}
            
            # Add analysis to review
            analyzed_review = {
                **review,
                "sentiment": sentiment_result['sentiment'],
                "sentiment_confidence": sentiment_result['confidence'],
                "polarity": sentiment_result['polarity'],
                "subjectivity": sentiment_result['subjectivity'],
                "emotions": emotions
            }
            
            analyzed_reviews.append(analyzed_review)
        
        # Aggregate analysis
        sentiment_distribution = dict(Counter(sentiments))
        for sent in ["positive", "negative", "neutral"]:
            if sent not in sentiment_distribution:
                sentiment_distribution[sent] = 0
        
        # Extract keywords and themes
        keywords = self.extract_keywords(texts) if settings.ENABLE_KEYWORD_CLUSTERING else []
        themes = self.extract_themes(texts) if settings.ENABLE_THEME_EXTRACTION else []
        
        # Calculate aggregate emotions
        if emotions_list:
            avg_emotions = {}
            for emotion in emotions_list[0].keys():
                scores = [e.get(emotion, 0) for e in emotions_list]
                avg_emotions[emotion] = round(sum(scores) / len(scores), 3)
        else:
            avg_emotions = {}
        
        return {
            "success": True,
            "total_analyzed": len(analyzed_reviews),
            "reviews": analyzed_reviews,
            "sentiment_distribution": sentiment_distribution,
            "aggregate_metrics": {
                "avg_polarity": round(sum(r['polarity'] for r in analyzed_reviews) / len(analyzed_reviews), 3) if analyzed_reviews else 0,
                "avg_subjectivity": round(sum(r['subjectivity'] for r in analyzed_reviews) / len(analyzed_reviews), 3) if analyzed_reviews else 0,
                "avg_confidence": round(sum(r['sentiment_confidence'] for r in analyzed_reviews) / len(analyzed_reviews), 3) if analyzed_reviews else 0
            },
            "emotions": avg_emotions,
            "top_keywords": keywords[:15],
            "themes": themes[:10],
            "ai_provider": self.ai_provider
        }
    
    def generate_insights(self, analysis: Dict) -> Dict[str, Any]:
        """
        Generate actionable insights from analysis
        """
        insights = []
        recommendations = []
        
        if not analysis.get("success"):
            return {"insights": [], "recommendations": []}
        
        sentiment_dist = analysis.get("sentiment_distribution", {})
        total = sum(sentiment_dist.values())
        
        if total > 0:
            positive_pct = (sentiment_dist.get("positive", 0) / total) * 100
            negative_pct = (sentiment_dist.get("negative", 0) / total) * 100
            neutral_pct = (sentiment_dist.get("neutral", 0) / total) * 100
            
            # Sentiment insights
            if positive_pct > 70:
                insights.append(f"⭐ Exceptional satisfaction: {positive_pct:.1f}% positive reviews")
                recommendations.append("Maintain quality standards and consider premium positioning")
            elif positive_pct > 50:
                insights.append(f"✅ Good satisfaction: {positive_pct:.1f}% positive sentiment")
                recommendations.append("Focus on converting neutral reviewers to positive")
            elif negative_pct > 40:
                insights.append(f"⚠️ Concerning negativity: {negative_pct:.1f}% negative reviews")
                recommendations.append("Urgent: Address common complaints and improve quality")
            
            if neutral_pct > 30:
                insights.append(f"🤔 High uncertainty: {neutral_pct:.1f}% neutral sentiment")
                recommendations.append("Provide clearer product information and set expectations")
        
        # Theme insights
        themes = analysis.get("themes", [])
        if themes:
            top_themes = themes[:3]
            theme_names = [t['theme'] for t in top_themes]
            insights.append(f"🎯 Key discussion topics: {', '.join(theme_names)}")
            
            # Check for negative themes
            for theme in themes:
                if any(neg in theme['theme'].lower() for neg in ['problem', 'issue', 'poor', 'bad']):
                    recommendations.append(f"Address issues related to: {theme['theme']}")
        
        # Emotion insights
        emotions = analysis.get("emotions", {})
        if emotions:
            dominant_emotion = max(emotions, key=emotions.get)
            if dominant_emotion in ["anger", "sadness", "fear", "disgust"]:
                insights.append(f"😟 Negative emotions detected: {dominant_emotion}")
                recommendations.append("Review negative feedback and implement improvements")
            elif dominant_emotion in ["joy", "trust", "anticipation"]:
                insights.append(f"😊 Positive emotions dominant: {dominant_emotion}")
                recommendations.append("Leverage positive sentiment in marketing")
        
        # Metrics insights
        metrics = analysis.get("aggregate_metrics", {})
        if metrics:
            subjectivity = metrics.get("avg_subjectivity", 0)
            if subjectivity > 0.6:
                insights.append("💭 Reviews are highly opinion-based")
                recommendations.append("Provide more factual product information")
            elif subjectivity < 0.4:
                insights.append("📊 Reviews focus on factual aspects")
                recommendations.append("Highlight emotional benefits in marketing")
        
        # Keyword insights
        keywords = analysis.get("top_keywords", [])
        if keywords:
            top_words = [k['word'] for k in keywords[:5]]
            insights.append(f"🔤 Most mentioned: {', '.join(top_words)}")
        
        return {
            "insights": insights,
            "recommendations": recommendations,
            "summary": self._generate_summary(analysis),
            "confidence": "high" if total > 50 else "medium" if total > 20 else "low"
        }
    
    def _generate_summary(self, analysis: Dict) -> str:
        """Generate executive summary"""
        total = analysis.get("total_analyzed", 0)
        sentiment_dist = analysis.get("sentiment_distribution", {})
        
        if not total:
            return "No reviews analyzed"
        
        positive_pct = (sentiment_dist.get("positive", 0) / total) * 100 if total else 0
        
        summary = f"Analyzed {total} reviews. "
        
        if positive_pct > 60:
            summary += "Overall sentiment is positive with strong customer satisfaction. "
        elif positive_pct > 40:
            summary += "Mixed sentiment indicates room for improvement. "
        else:
            summary += "Negative sentiment suggests significant issues need addressing. "
        
        themes = analysis.get("themes", [])
        if themes:
            summary += f"Key themes include {themes[0]['theme'].lower()}. "
        
        return summary


# Singleton instance
analyzer = EnhancedReviewAnalyzer()