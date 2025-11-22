"""
Advanced NLP Service - Multi-model sentiment analysis and text processing
Combines VADER, TextBlob, and Transformer models for comprehensive analysis
"""

from typing import List, Dict, Any, Optional, Tuple
import asyncio
from collections import Counter, defaultdict
import re
import statistics
from datetime import datetime

# Core NLP libraries
import nltk
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import spacy

# Advanced NLP
try:
    from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
    import torch
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    
# Scientific computing
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import LatentDirichletAllocation

from app.core.config import settings
from app.core.logging import logger
from app.services.cache_service import cache_service


class NLPService:
    """
    Production-ready NLP service for comprehensive text analysis
    """
    
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        self.nlp = None
        self.transformer_sentiment = None
        self.transformer_emotion = None
        self._initialize_models()
        
    def _initialize_models(self):
        """
        Initialize NLP models with fallback options
        """
        # Download required NLTK data
        required_nltk = ['punkt', 'stopwords', 'vader_lexicon', 'wordnet']
        for resource in required_nltk:
            try:
                nltk.data.find(f'tokenizers/{resource}')
            except LookupError:
                logger.info(f"Downloading NLTK resource: {resource}")
                nltk.download(resource, quiet=True)
        
        # Initialize spaCy
        try:
            self.nlp = spacy.load("en_core_web_sm")
            logger.success("spaCy model loaded")
        except:
            logger.warning("spaCy model not available, installing...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
            try:
                self.nlp = spacy.load("en_core_web_sm")
            except:
                logger.error("Failed to load spaCy model")
        
        # Initialize transformer models if available
        if TRANSFORMERS_AVAILABLE and settings.ENABLE_ADVANCED_NLP:
            try:
                device = 0 if torch.cuda.is_available() and settings.USE_GPU else -1
                
                # Sentiment analysis model
                self.transformer_sentiment = pipeline(
                    "sentiment-analysis",
                    model=settings.NLP_MODEL_NAME,
                    device=device
                )
                logger.success("Transformer sentiment model loaded")
                
                # Emotion detection model
                self.transformer_emotion = pipeline(
                    "text-classification",
                    model="j-hartmann/emotion-english-distilroberta-base",
                    device=device,
                    return_all_scores=True
                )
                logger.success("Transformer emotion model loaded")
                
            except Exception as e:
                logger.error(f"Failed to load transformer models: {e}")
                self.transformer_sentiment = None
                self.transformer_emotion = None
    
    async def analyze_reviews(
        self,
        reviews: List[Dict[str, Any]],
        enable_advanced: bool = True
    ) -> Dict[str, Any]:
        """
        Comprehensive analysis of multiple reviews
        """
        if not reviews:
            return self._empty_analysis_result()
        
        # Analyze individual reviews
        analyzed_reviews = []
        sentiment_scores = []
        emotions_aggregate = defaultdict(list)
        all_texts = []
        
        for review in reviews:
            analysis = await self.analyze_single_review(review, enable_advanced)
            analyzed_reviews.append({**review, **analysis})
            sentiment_scores.append(analysis["sentiment_score"])
            all_texts.append(review.get("text", ""))
            
            if analysis.get("emotions"):
                for emotion, score in analysis["emotions"].items():
                    emotions_aggregate[emotion].append(score)
        
        # Aggregate analysis
        aggregate_analysis = {
            "sentiment_distribution": self._calculate_sentiment_distribution(analyzed_reviews),
            "average_sentiment": statistics.mean(sentiment_scores) if sentiment_scores else 0,
            "sentiment_variance": statistics.variance(sentiment_scores) if len(sentiment_scores) > 1 else 0,
            "emotions_summary": {
                emotion: statistics.mean(scores)
                for emotion, scores in emotions_aggregate.items()
            } if emotions_aggregate else None
        }
        
        # Extract keywords and themes
        if all_texts:
            keywords = await self.extract_keywords(all_texts)
            themes = await self.extract_themes(all_texts)
            aggregate_analysis["keywords"] = keywords
            aggregate_analysis["themes"] = themes
        
        # Generate insights
        insights = await self.generate_insights(analyzed_reviews, aggregate_analysis)
        
        return {
            "reviews": analyzed_reviews,
            "aggregate": aggregate_analysis,
            "insights": insights,
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
    
    async def analyze_single_review(
        self,
        review: Dict[str, Any],
        enable_advanced: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze a single review with multiple NLP models
        """
        text = review.get("text", "")
        if not text:
            return self._empty_review_analysis()
        
        # Cache key for analysis results
        cache_key = f"nlp:review:{hash(text)}"
        if cache_service.is_available():
            cached = await cache_service.get(cache_key)
            if cached:
                return cached
        
        analysis = {}
        
        # VADER Sentiment Analysis
        vader_scores = self.vader.polarity_scores(text)
        analysis["vader_sentiment"] = vader_scores
        analysis["sentiment_score"] = vader_scores["compound"]
        
        # TextBlob Analysis
        try:
            blob = TextBlob(text)
            analysis["polarity"] = blob.sentiment.polarity
            analysis["subjectivity"] = blob.sentiment.subjectivity
            
            # Language detection
            try:
                analysis["language"] = blob.detect_language()
            except:
                analysis["language"] = "en"
                
        except Exception as e:
            logger.error(f"TextBlob analysis failed: {e}")
            analysis["polarity"] = 0
            analysis["subjectivity"] = 0
        
        # Determine overall sentiment
        analysis["sentiment"] = self._determine_sentiment(
            analysis["sentiment_score"],
            analysis["polarity"]
        )
        analysis["sentiment_confidence"] = self._calculate_confidence(
            vader_scores, 
            analysis.get("polarity", 0)
        )
        
        # Advanced analysis with transformers
        if enable_advanced and self.transformer_sentiment:
            analysis["advanced_sentiment"] = await self._transformer_sentiment_analysis(text)
        
        # Emotion detection
        if enable_advanced and settings.ENABLE_EMOTION_ANALYSIS:
            emotions = await self.detect_emotions(text)
            analysis["emotions"] = emotions
        
        # Key phrases extraction
        if self.nlp:
            doc = self.nlp(text[:1000])  # Limit text length for spaCy
            analysis["key_phrases"] = [chunk.text for chunk in doc.noun_chunks][:5]
            analysis["entities"] = [(ent.text, ent.label_) for ent in doc.ents]
        
        # Cache results
        if cache_service.is_available():
            await cache_service.set(cache_key, analysis, ttl=3600)
        
        return analysis
    
    async def detect_emotions(self, text: str) -> Dict[str, float]:
        """
        Detect emotions in text using multiple methods
        """
        emotions = {
            "joy": 0.0,
            "anger": 0.0,
            "fear": 0.0,
            "sadness": 0.0,
            "surprise": 0.0,
            "disgust": 0.0,
            "trust": 0.0,
            "anticipation": 0.0
        }
        
        # Use transformer model if available
        if self.transformer_emotion:
            try:
                results = self.transformer_emotion(text[:512])[0]  # Limit text length
                for result in results:
                    label = result["label"].lower()
                    if label in emotions:
                        emotions[label] = result["score"]
                    elif label == "love":
                        emotions["joy"] = max(emotions["joy"], result["score"])
                    elif label == "optimism":
                        emotions["anticipation"] = max(emotions["anticipation"], result["score"])
            except Exception as e:
                logger.error(f"Emotion detection failed: {e}")
        
        # Fallback: Rule-based emotion detection
        else:
            emotion_keywords = {
                "joy": ["happy", "glad", "joyful", "excited", "love", "wonderful", "amazing"],
                "anger": ["angry", "furious", "annoyed", "frustrated", "hate", "terrible"],
                "fear": ["afraid", "scared", "worried", "anxious", "nervous", "terrified"],
                "sadness": ["sad", "depressed", "unhappy", "disappointed", "miserable"],
                "surprise": ["surprised", "shocked", "amazed", "astonished", "unexpected"],
                "disgust": ["disgusting", "gross", "horrible", "awful", "revolting"],
                "trust": ["trust", "reliable", "honest", "faithful", "dependable"],
                "anticipation": ["looking forward", "excited", "eager", "hopeful", "expecting"]
            }
            
            text_lower = text.lower()
            for emotion, keywords in emotion_keywords.items():
                count = sum(1 for keyword in keywords if keyword in text_lower)
                emotions[emotion] = min(count * 0.2, 1.0)  # Normalize to 0-1
        
        return emotions
    
    async def extract_keywords(
        self,
        texts: List[str],
        max_keywords: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Extract keywords using TF-IDF and frequency analysis
        """
        if not texts:
            return []
        
        # Combine all texts
        combined_text = " ".join(texts)
        
        # TF-IDF extraction
        try:
            vectorizer = TfidfVectorizer(
                max_features=max_keywords,
                stop_words='english',
                ngram_range=(1, 2)
            )
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get top keywords by TF-IDF score
            scores = tfidf_matrix.sum(axis=0).A1
            keyword_scores = [(feature_names[i], scores[i]) for i in scores.argsort()[-max_keywords:][::-1]]
            
            keywords = [
                {"keyword": keyword, "score": float(score), "type": "tfidf"}
                for keyword, score in keyword_scores
            ]
            
        except Exception as e:
            logger.error(f"TF-IDF extraction failed: {e}")
            keywords = []
        
        # Frequency-based extraction as fallback/supplement
        if len(keywords) < max_keywords:
            words = re.findall(r'\b[a-z]{3,}\b', combined_text.lower())
            stop_words = set(nltk.corpus.stopwords.words('english'))
            words = [w for w in words if w not in stop_words]
            
            word_freq = Counter(words).most_common(max_keywords - len(keywords))
            for word, freq in word_freq:
                keywords.append({
                    "keyword": word,
                    "score": freq / len(words),
                    "type": "frequency"
                })
        
        return keywords
    
    async def extract_themes(
        self,
        texts: List[str],
        num_themes: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Extract themes using topic modeling (LDA)
        """
        if not texts or len(texts) < num_themes:
            return []
        
        try:
            # Vectorize texts
            vectorizer = TfidfVectorizer(
                max_features=100,
                stop_words='english',
                min_df=2,
                max_df=0.8
            )
            doc_term_matrix = vectorizer.fit_transform(texts)
            
            # Apply LDA
            lda = LatentDirichletAllocation(
                n_components=num_themes,
                random_state=42,
                max_iter=10
            )
            lda.fit(doc_term_matrix)
            
            # Extract themes
            feature_names = vectorizer.get_feature_names_out()
            themes = []
            
            for topic_idx, topic in enumerate(lda.components_):
                top_indices = topic.argsort()[-10:][::-1]
                top_words = [feature_names[i] for i in top_indices]
                theme_name = self._generate_theme_name(top_words)
                
                themes.append({
                    "id": topic_idx,
                    "name": theme_name,
                    "keywords": top_words[:5],
                    "weight": float(topic.sum())
                })
            
            return themes
            
        except Exception as e:
            logger.error(f"Theme extraction failed: {e}")
            return []
    
    async def generate_insights(
        self,
        reviews: List[Dict[str, Any]],
        aggregate: Dict[str, Any]
    ) -> List[str]:
        """
        Generate actionable insights from analysis
        """
        insights = []
        
        # Sentiment insights
        if aggregate.get("average_sentiment"):
            avg_sentiment = aggregate["average_sentiment"]
            if avg_sentiment > 0.5:
                insights.append("Overall customer sentiment is highly positive")
            elif avg_sentiment < -0.2:
                insights.append("Significant negative sentiment detected - immediate attention needed")
            
            if aggregate.get("sentiment_variance", 0) > 0.5:
                insights.append("High variance in customer opinions suggests polarizing product aspects")
        
        # Review volume insights
        total_reviews = len(reviews)
        if total_reviews > 0:
            recent_reviews = [r for r in reviews if self._is_recent(r.get("date"))]
            if len(recent_reviews) / total_reviews > 0.5:
                insights.append(f"High recent review activity ({len(recent_reviews)} reviews in last 30 days)")
        
        # Rating insights
        ratings = [r.get("rating", 0) for r in reviews]
        if ratings:
            avg_rating = statistics.mean(ratings)
            if avg_rating < 3:
                low_rating_reviews = [r for r in reviews if r.get("rating", 0) <= 2]
                common_issues = self._extract_common_issues(low_rating_reviews)
                if common_issues:
                    insights.append(f"Common issues in negative reviews: {', '.join(common_issues[:3])}")
        
        # Emotion insights
        if aggregate.get("emotions_summary"):
            emotions = aggregate["emotions_summary"]
            dominant_emotion = max(emotions.items(), key=lambda x: x[1])
            if dominant_emotion[1] > 0.3:
                insights.append(f"Dominant emotion: {dominant_emotion[0].capitalize()} ({dominant_emotion[1]:.1%})")
        
        # Keyword insights
        if aggregate.get("keywords"):
            top_keywords = [k["keyword"] for k in aggregate["keywords"][:5]]
            insights.append(f"Key discussion topics: {', '.join(top_keywords)}")
        
        return insights
    
    def _determine_sentiment(self, vader_compound: float, polarity: float) -> str:
        """
        Determine overall sentiment from multiple scores
        """
        # Weighted average of VADER and TextBlob
        combined_score = (vader_compound * 0.6 + polarity * 0.4)
        
        if combined_score >= 0.5:
            return "very positive"
        elif combined_score >= 0.1:
            return "positive"
        elif combined_score <= -0.5:
            return "very negative"
        elif combined_score <= -0.1:
            return "negative"
        else:
            return "neutral"
    
    def _calculate_confidence(self, vader_scores: Dict, polarity: float) -> float:
        """
        Calculate confidence in sentiment analysis
        """
        # Check agreement between VADER and TextBlob
        vader_sentiment = vader_scores["compound"]
        agreement = 1 - abs(vader_sentiment - polarity) / 2
        
        # Check neutrality
        neutrality_penalty = vader_scores["neu"] * 0.5
        
        confidence = max(0, min(1, agreement - neutrality_penalty))
        return confidence
    
    def _calculate_sentiment_distribution(self, reviews: List[Dict]) -> Dict[str, int]:
        """
        Calculate distribution of sentiments
        """
        distribution = {
            "very positive": 0,
            "positive": 0,
            "neutral": 0,
            "negative": 0,
            "very negative": 0
        }
        
        for review in reviews:
            sentiment = review.get("sentiment", "neutral")
            if sentiment in distribution:
                distribution[sentiment] += 1
        
        return distribution
    
    async def _transformer_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """
        Advanced sentiment analysis using transformer models
        """
        try:
            result = self.transformer_sentiment(text[:512])[0]
            return {
                "label": result["label"],
                "score": result["score"]
            }
        except Exception as e:
            logger.error(f"Transformer analysis failed: {e}")
            return {}
    
    def _generate_theme_name(self, keywords: List[str]) -> str:
        """
        Generate human-readable theme name from keywords
        """
        # Simple heuristic-based naming
        if any(word in keywords for word in ["quality", "build", "material", "durable"]):
            return "Product Quality"
        elif any(word in keywords for word in ["price", "value", "money", "worth", "expensive"]):
            return "Value for Money"
        elif any(word in keywords for word in ["shipping", "delivery", "package", "arrived"]):
            return "Shipping & Delivery"
        elif any(word in keywords for word in ["service", "support", "customer", "help"]):
            return "Customer Service"
        elif any(word in keywords for word in ["feature", "function", "work", "performance"]):
            return "Features & Performance"
        else:
            return f"Theme: {', '.join(keywords[:3])}"
    
    def _is_recent(self, date_str: str, days: int = 30) -> bool:
        """
        Check if date is recent
        """
        try:
            from dateutil import parser
            date = parser.parse(date_str)
            return (datetime.utcnow() - date).days <= days
        except:
            return False
    
    def _extract_common_issues(self, negative_reviews: List[Dict]) -> List[str]:
        """
        Extract common issues from negative reviews
        """
        issue_keywords = []
        for review in negative_reviews:
            text = review.get("text", "").lower()
            # Extract potential issue keywords
            words = re.findall(r'\b[a-z]{4,}\b', text)
            issue_keywords.extend(words)
        
        # Get most common issues
        common = Counter(issue_keywords).most_common(10)
        return [word for word, _ in common if word not in nltk.corpus.stopwords.words('english')]
    
    def _empty_analysis_result(self) -> Dict[str, Any]:
        """
        Return empty analysis result structure
        """
        return {
            "reviews": [],
            "aggregate": {
                "sentiment_distribution": {},
                "average_sentiment": 0,
                "emotions_summary": None,
                "keywords": [],
                "themes": []
            },
            "insights": [],
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
    
    def _empty_review_analysis(self) -> Dict[str, Any]:
        """
        Return empty review analysis structure
        """
        return {
            "sentiment": "neutral",
            "sentiment_score": 0,
            "sentiment_confidence": 0,
            "polarity": 0,
            "subjectivity": 0,
            "emotions": None,
            "key_phrases": []
        }


# Create singleton instance
nlp_service = NLPService()

__all__ = ["nlp_service"]