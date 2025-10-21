"""
Enhanced Review analysis service with AI/NLP capabilities.
Includes sentiment analysis, emotion detection, and topic modeling.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import LatentDirichletAllocation
from sklearn.cluster import KMeans
from collections import Counter
from datetime import datetime
import nltk
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import text2emotion as te
from nrclex import NRCLex
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification

from app.core.config import settings
from app.utils.text_cleaner import text_cleaner
from app.utils.helpers import sanitize_dataframe, calculate_percentage

# Download required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('averaged_perceptron_tagger', quiet=True)
nltk.download('brown', quiet=True)

class EnhancedReviewAnalyzer:
    """Advanced review analysis with AI/NLP capabilities."""
    
    def __init__(self):
        self.text_cleaner = text_cleaner
        
        # Initialize sentiment analyzers
        self.vader = SentimentIntensityAnalyzer()
        
        # Initialize transformer models if GPU available
        self.device = 0 if torch.cuda.is_available() else -1
        
        try:
            # Load RoBERTa for advanced sentiment
            self.roberta_sentiment = pipeline(
                "sentiment-analysis",
                model="cardiffnlp/twitter-roberta-base-sentiment-latest",
                device=self.device
            )
            print("✅ RoBERTa sentiment model loaded")
        except:
            self.roberta_sentiment = None
            print("⚠️ RoBERTa model not available, using VADER")
        
        try:
            # Load emotion detection model
            self.emotion_classifier = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
                device=self.device,
                top_k=None
            )
            print("✅ Emotion detection model loaded")
        except:
            self.emotion_classifier = None
            print("⚠️ Emotion model not available, using text2emotion")
    
    def analyze_reviews(self, reviews_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enhanced analysis pipeline with AI/NLP features.
        """
        if not reviews_data.get("success"):
            return {
                "success": False,
                "error": reviews_data.get("error", "Unknown error")
            }
        
        reviews = reviews_data.get("reviews", [])
        if not reviews:
            return {
                "success": False,
                "error": "No reviews to analyze"
            }
        
        print(f"🔍 Starting enhanced analysis of {len(reviews)} reviews")
        
        # Prepare DataFrame
        df = self._prepare_dataframe(reviews)
        
        if df.empty:
            return {
                "success": False,
                "error": "No valid review data to analyze"
            }
        
        # Clean texts
        df['cleaned_text'] = df['review_text'].apply(
            lambda x: self.text_cleaner.clean_text(str(x) if x else '', remove_stopwords=False)
        )
        
        # Perform enhanced analyses
        sentiment_analysis = self._analyze_sentiment_advanced(df)
        emotion_analysis = self._analyze_emotions(df)
        keyword_analysis = self._extract_keywords_advanced(df)
        topic_modeling = self._perform_topic_modeling(df)
        rating_dist = self._analyze_rating_distribution(df)
        temporal_trends = self._analyze_temporal_trends(df)
        quality_metrics = self._analyze_review_quality(df)
        customer_segments = self._segment_customers(df)
        
        # Generate AI insights
        insights = self._generate_ai_insights(
            df, sentiment_analysis, emotion_analysis, 
            keyword_analysis, topic_modeling, customer_segments
        )
        
        summary = self._generate_executive_summary(
            df, sentiment_analysis, emotion_analysis, insights
        )
        
        print(f"✅ Enhanced analysis completed")
        
        return {
            "success": True,
            "asin": reviews_data.get("asin", ""),
            "product_title": reviews_data.get("product_info", {}).get("title", "Unknown Product"),
            "total_reviews": len(df),
            "analyzed_at": datetime.now().isoformat(),
            
            # Core Analysis
            "sentiment_distribution": sentiment_analysis,
            "emotion_analysis": emotion_analysis,
            "keyword_analysis": keyword_analysis,
            "topic_modeling": topic_modeling,
            "rating_distribution": rating_dist,
            "temporal_trends": temporal_trends,
            
            # Advanced Analysis
            "quality_metrics": quality_metrics,
            "customer_segments": customer_segments,
            "insights": insights,
            "summary": summary,
            
            # Metadata
            "api_source": reviews_data.get("api_source", "apify"),
            "max_reviews_limit": reviews_data.get("max_reviews_limit", 5),
            "ai_models_used": self._get_active_models()
        }
    
    def _analyze_sentiment_advanced(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Advanced sentiment analysis using multiple models.
        """
        sentiments = []
        
        for _, row in df.iterrows():
            text = row['cleaned_text']
            
            # VADER Sentiment
            vader_scores = self.vader.polarity_scores(text)
            
            # TextBlob Sentiment
            blob = TextBlob(text)
            textblob_polarity = blob.sentiment.polarity
            textblob_subjectivity = blob.sentiment.subjectivity
            
            # RoBERTa Sentiment (if available)
            roberta_score = None
            if self.roberta_sentiment and len(text) > 10:
                try:
                    result = self.roberta_sentiment(text[:512])[0]
                    roberta_score = result['score'] if result['label'] == 'POSITIVE' else -result['score']
                except:
                    pass
            
            # Combine scores
            if roberta_score:
                combined_score = (vader_scores['compound'] + textblob_polarity + roberta_score) / 3
            else:
                combined_score = (vader_scores['compound'] + textblob_polarity) / 2
            
            sentiments.append({
                'combined_score': combined_score,
                'vader_compound': vader_scores['compound'],
                'textblob_polarity': textblob_polarity,
                'textblob_subjectivity': textblob_subjectivity,
                'roberta_score': roberta_score,
                'label': self._get_sentiment_label(combined_score)
            })
        
        df['sentiment_scores'] = sentiments
        
        # Calculate distribution
        total = len(df)
        positive = sum(1 for s in sentiments if s['label'] == 'positive')
        negative = sum(1 for s in sentiments if s['label'] == 'negative')
        neutral = total - positive - negative
        
        # Calculate confidence scores
        avg_subjectivity = np.mean([s['textblob_subjectivity'] for s in sentiments])
        sentiment_confidence = 1 - avg_subjectivity  # More objective = higher confidence
        
        return {
            "positive": {
                "count": int(positive),
                "percentage": calculate_percentage(positive, total)
            },
            "neutral": {
                "count": int(neutral),
                "percentage": calculate_percentage(neutral, total)
            },
            "negative": {
                "count": int(negative),
                "percentage": calculate_percentage(negative, total)
            },
            "average_rating": round(float(df['rating'].mean()), 2),
            "median_rating": round(float(df['rating'].median()), 2),
            "sentiment_scores": {
                "average_compound": round(float(np.mean([s['combined_score'] for s in sentiments])), 3),
                "average_subjectivity": round(float(avg_subjectivity), 3),
                "confidence": round(float(sentiment_confidence), 3)
            }
        }
    
    def _analyze_emotions(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Detect emotions in reviews using multiple methods.
        """
        all_emotions = []
        emotion_distribution = Counter()
        
        for _, row in df.iterrows():
            text = row['cleaned_text']
            
            if not text or len(text) < 10:
                continue
            
            # Method 1: Transformer-based emotion detection
            if self.emotion_classifier:
                try:
                    emotions = self.emotion_classifier(text[:512])
                    if emotions and len(emotions) > 0:
                        # Get top emotion
                        top_emotion = emotions[0][0]
                        all_emotions.append({
                            'text': text[:100],
                            'emotion': top_emotion['label'],
                            'score': top_emotion['score']
                        })
                        emotion_distribution[top_emotion['label']] += 1
                except:
                    pass
            
            # Method 2: text2emotion as fallback
            if not self.emotion_classifier:
                try:
                    emotions = te.get_emotion(text)
                    max_emotion = max(emotions, key=emotions.get)
                    if emotions[max_emotion] > 0:
                        all_emotions.append({
                            'text': text[:100],
                            'emotion': max_emotion,
                            'score': emotions[max_emotion]
                        })
                        emotion_distribution[max_emotion] += 1
                except:
                    pass
            
            # Method 3: NRC Lexicon for additional emotions
            try:
                nrc_emotion = NRCLex(text)
                top_emotions = nrc_emotion.top_emotions
                if top_emotions:
                    for emotion in top_emotions[:2]:
                        emotion_distribution[emotion] += 0.5
            except:
                pass
        
        # Calculate percentages
        total_emotions = sum(emotion_distribution.values())
        emotion_percentages = {}
        
        if total_emotions > 0:
            for emotion, count in emotion_distribution.most_common():
                emotion_percentages[emotion] = {
                    'count': float(count),
                    'percentage': round((count / total_emotions) * 100, 2)
                }
        
        # Identify dominant emotions
        dominant_emotions = []
        for emotion, data in list(emotion_percentages.items())[:3]:
            dominant_emotions.append({
                'emotion': emotion,
                'percentage': data['percentage'],
                'description': self._get_emotion_description(emotion)
            })
        
        return {
            "emotion_distribution": emotion_percentages,
            "dominant_emotions": dominant_emotions,
            "emotional_tone": self._determine_emotional_tone(emotion_distribution),
            "emotion_samples": all_emotions[:5],  # Top 5 examples
            "total_emotions_detected": len(all_emotions)
        }
    
    def _perform_topic_modeling(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Perform Latent Dirichlet Allocation for topic discovery.
        """
        valid_texts = df['cleaned_text'][df['cleaned_text'].str.len() > 20].tolist()
        
        if len(valid_texts) < 3:
            return {"topics": [], "message": "Insufficient data for topic modeling"}
        
        try:
            # TF-IDF Vectorization
            vectorizer = TfidfVectorizer(
                max_features=50,
                min_df=1,
                max_df=0.8,
                stop_words='english',
                ngram_range=(1, 2)
            )
            
            doc_term_matrix = vectorizer.fit_transform(valid_texts)
            
            # LDA Topic Modeling
            n_topics = min(3, len(valid_texts))
            lda = LatentDirichletAllocation(
                n_components=n_topics,
                random_state=42,
                max_iter=10
            )
            
            lda.fit(doc_term_matrix)
            
            # Extract topics
            feature_names = vectorizer.get_feature_names_out()
            topics = []
            
            for topic_idx, topic in enumerate(lda.components_):
                top_indices = topic.argsort()[-10:][::-1]
                top_words = [feature_names[i] for i in top_indices]
                topic_weight = topic[top_indices].mean()
                
                topics.append({
                    "topic_id": topic_idx,
                    "keywords": top_words[:5],
                    "weight": float(topic_weight),
                    "theme": self._infer_topic_theme(top_words)
                })
            
            return {
                "topics": topics,
                "num_topics": n_topics,
                "model": "LDA",
                "perplexity": float(lda.perplexity(doc_term_matrix))
            }
            
        except Exception as e:
            print(f"⚠️ Topic modeling failed: {e}")
            return {"topics": [], "error": str(e)}
    
    def _segment_customers(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Segment customers based on review patterns.
        """
        segments = {
            "enthusiasts": {
                "criteria": "5-star ratings with detailed positive reviews",
                "count": 0,
                "characteristics": []
            },
            "critics": {
                "criteria": "Low ratings with specific complaints",
                "count": 0,
                "characteristics": []
            },
            "pragmatists": {
                "criteria": "Balanced reviews with pros and cons",
                "count": 0,
                "characteristics": []
            },
            "casual": {
                "criteria": "Brief reviews without strong opinions",
                "count": 0,
                "characteristics": []
            }
        }
        
        for _, row in df.iterrows():
            rating = row['rating']
            text_length = len(row['review_text'])
            
            if rating >= 4.5 and text_length > 100:
                segments["enthusiasts"]["count"] += 1
            elif rating <= 2.5 and text_length > 50:
                segments["critics"]["count"] += 1
            elif 3 <= rating <= 4 and text_length > 75:
                segments["pragmatists"]["count"] += 1
            else:
                segments["casual"]["count"] += 1
        
        # Calculate percentages
        total = len(df)
        for segment in segments.values():
            segment["percentage"] = calculate_percentage(segment["count"], total)
        
        return segments
    
    def _analyze_review_quality(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze the quality and authenticity of reviews.
        """
        quality_scores = []
        
        for _, row in df.iterrows():
            text = row['review_text']
            score = 0
            factors = []
            
            # Length factor
            if len(text) > 50:
                score += 2
                factors.append("detailed")
            if len(text) > 200:
                score += 1
                factors.append("comprehensive")
            
            # Specificity factor
            if any(word in text.lower() for word in ['because', 'specifically', 'particularly']):
                score += 2
                factors.append("specific")
            
            # Verified purchase
            if row.get('verified_purchase', False):
                score += 3
                factors.append("verified")
            
            # Helpfulness
            if row.get('helpful_votes', 0) > 5:
                score += 2
                factors.append("helpful")
            
            quality_scores.append({
                'score': min(score, 10),
                'factors': factors
            })
        
        avg_quality = np.mean([q['score'] for q in quality_scores])
        
        return {
            "average_quality_score": round(float(avg_quality), 2),
            "quality_distribution": {
                "high": sum(1 for q in quality_scores if q['score'] >= 7),
                "medium": sum(1 for q in quality_scores if 4 <= q['score'] < 7),
                "low": sum(1 for q in quality_scores if q['score'] < 4)
            },
            "verified_percentage": calculate_percentage(
                len(df[df.get('verified_purchase', False) == True]),
                len(df)
            ),
            "quality_factors": Counter([f for q in quality_scores for f in q['factors']])
        }
    
    def _generate_ai_insights(self, df, sentiment, emotions, keywords, topics, segments) -> List[str]:
        """
        Generate intelligent insights using AI analysis.
        """
        insights = []
        
        # Sentiment insights
        pos_pct = sentiment['positive']['percentage']
        neg_pct = sentiment['negative']['percentage']
        
        if pos_pct > 80:
            insights.append(f"🌟 Exceptional satisfaction rate ({pos_pct}%) indicates product excellence")
        elif pos_pct > 60:
            insights.append(f"✅ Strong positive reception ({pos_pct}%) shows product meets expectations")
        elif neg_pct > 40:
            insights.append(f"⚠️ High dissatisfaction ({neg_pct}%) requires immediate attention")
        
        # Emotion insights
        if emotions.get('dominant_emotions'):
            top_emotion = emotions['dominant_emotions'][0]
            if top_emotion['emotion'] in ['joy', 'happiness', 'excitement']:
                insights.append(f"😊 Customers express {top_emotion['emotion']} - excellent emotional connection")
            elif top_emotion['emotion'] in ['anger', 'disgust', 'disappointment']:
                insights.append(f"😔 Prevalent {top_emotion['emotion']} indicates customer frustration")
        
        # Topic insights
        if topics.get('topics'):
            main_themes = [t['theme'] for t in topics['topics'][:2]]
            insights.append(f"🎯 Key discussion themes: {', '.join(main_themes)}")
        
        # Segment insights
        if segments:
            dominant_segment = max(segments.items(), key=lambda x: x[1]['count'])[0]
            insights.append(f"👥 Primary customer segment: {dominant_segment} ({segments[dominant_segment]['percentage']}%)")
        
        # Keyword insights
        if keywords.get('top_keywords'):
            trending_keywords = [kw['word'] for kw in keywords['top_keywords'][:3]]
            insights.append(f"🔍 Trending topics: {', '.join(trending_keywords)}")
        
        # Rating correlation insight
        if sentiment.get('sentiment_scores'):
            confidence = sentiment['sentiment_scores']['confidence']
            if confidence > 0.7:
                insights.append(f"📊 High analysis confidence ({confidence:.2f}) - reliable insights")
        
        return insights[:7]  # Return top 7 insights
    
    def _generate_executive_summary(self, df, sentiment, emotions, insights) -> str:
        """
        Generate an executive summary using AI analysis.
        """
        total = len(df)
        avg_rating = sentiment['average_rating']
        pos_pct = sentiment['positive']['percentage']
        
        emotional_tone = emotions.get('emotional_tone', 'neutral')
        
        # Build summary
        summary_parts = [
            f"Analysis of {total} customer reviews reveals ",
            f"{pos_pct}% positive sentiment with {avg_rating:.1f} stars average. "
        ]
        
        # Add emotional context
        if emotional_tone != 'neutral':
            summary_parts.append(f"The overall emotional tone is {emotional_tone}. ")
        
        # Add dominant emotion
        if emotions.get('dominant_emotions'):
            top_emotion = emotions['dominant_emotions'][0]['emotion']
            summary_parts.append(f"Customers primarily express {top_emotion}. ")
        
        # Add key insight
        if insights:
            summary_parts.append(insights[0].replace('🌟', '').replace('✅', '').replace('⚠️', '').strip() + ".")
        
        return ''.join(summary_parts)
    
    def _get_sentiment_label(self, score: float) -> str:
        """Determine sentiment label from score."""
        if score > 0.1:
            return 'positive'
        elif score < -0.1:
            return 'negative'
        else:
            return 'neutral'
    
    def _get_emotion_description(self, emotion: str) -> str:
        """Get description for emotion."""
        descriptions = {
            'joy': 'Customers are delighted with the product',
            'trust': 'High confidence in product quality',
            'fear': 'Concerns about product reliability',
            'surprise': 'Unexpected product experience',
            'sadness': 'Disappointment with purchase',
            'disgust': 'Strong negative reaction',
            'anger': 'Frustration with product or service',
            'anticipation': 'Excitement about the product'
        }
        return descriptions.get(emotion.lower(), f'Customers express {emotion}')
    
    def _determine_emotional_tone(self, emotion_distribution: Counter) -> str:
        """Determine overall emotional tone."""
        if not emotion_distribution:
            return "neutral"
        
        positive_emotions = ['joy', 'trust', 'anticipation', 'love', 'happiness']
        negative_emotions = ['fear', 'sadness', 'disgust', 'anger', 'disappointment']
        
        positive_score = sum(emotion_distribution.get(e, 0) for e in positive_emotions)
        negative_score = sum(emotion_distribution.get(e, 0) for e in negative_emotions)
        
        if positive_score > negative_score * 2:
            return "very positive"
        elif positive_score > negative_score:
            return "positive"
        elif negative_score > positive_score * 2:
            return "very negative"
        elif negative_score > positive_score:
            return "negative"
        else:
            return "mixed"
    
    def _infer_topic_theme(self, keywords: List[str]) -> str:
        """Infer theme from topic keywords."""
        theme_patterns = {
            'Quality': ['quality', 'durable', 'build', 'material', 'solid'],
            'Price/Value': ['price', 'value', 'worth', 'money', 'expensive', 'cheap'],
            'Performance': ['work', 'performance', 'fast', 'speed', 'efficient'],
            'Design': ['design', 'look', 'color', 'style', 'beautiful'],
            'Usability': ['easy', 'simple', 'use', 'setup', 'install'],
            'Service': ['delivery', 'shipping', 'customer', 'service', 'support'],
            'Features': ['feature', 'function', 'capability', 'option']
        }
        
        for theme, patterns in theme_patterns.items():
            if any(pattern in ' '.join(keywords).lower() for pattern in patterns):
                return theme
        
        return 'General Feedback'
    
    def _get_active_models(self) -> List[str]:
        """Get list of active AI models."""
        models = ['VADER', 'TextBlob', 'NLTK']
        
        if self.roberta_sentiment:
            models.append('RoBERTa')
        if self.emotion_classifier:
            models.append('DistilRoBERTa-Emotion')
        else:
            models.append('text2emotion')
        
        models.append('LDA-TopicModeling')
        
        return models
    
    def _prepare_dataframe(self, reviews: List[Dict]) -> pd.DataFrame:
        """Prepare DataFrame from reviews data."""
        if not reviews:
            return pd.DataFrame()
        
        df = pd.DataFrame(reviews)
        df = sanitize_dataframe(df)
        
        # Map field names
        if 'text' in df.columns and 'review_text' not in df.columns:
            df['review_text'] = df['text']
        
        if 'date' in df.columns and 'review_date' not in df.columns:
            df['review_date'] = df['date']
        
        # Ensure required columns
        if 'review_text' not in df.columns:
            df['review_text'] = ''
        
        if 'rating' not in df.columns:
            df['rating'] = 0
        
        df['rating'] = pd.to_numeric(df['rating'], errors='coerce').fillna(0)
        
        return df
    
    # Keep existing methods for compatibility
    def _extract_keywords_advanced(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract keywords with advanced NLP."""
        return self._extract_keywords_tfidf(df)
    
    def _extract_keywords_tfidf(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract keywords using TF-IDF."""
        valid_texts = df['cleaned_text'][df['cleaned_text'].str.len() > 10].tolist()
        
        if not valid_texts:
            return {"top_keywords": [], "total_unique_words": 0}
        
        try:
            vectorizer = TfidfVectorizer(
                max_features=100,
                ngram_range=(1, 2),
                min_df=1,
                max_df=0.7,
                stop_words='english'
            )
            
            tfidf_matrix = vectorizer.fit_transform(valid_texts)
            feature_names = vectorizer.get_feature_names_out()
            avg_scores = np.asarray(tfidf_matrix.mean(axis=0)).flatten()
            
            keyword_scores = list(zip(feature_names, avg_scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            top_keywords = []
            for word, score in keyword_scores[:settings.TOP_KEYWORDS_COUNT]:
                frequency = sum(1 for text in df['cleaned_text'] if word in str(text).lower())
                
                top_keywords.append({
                    "word": word,
                    "tfidf_score": round(float(score), 4),
                    "frequency": int(frequency),
                    "importance": "high" if score > 0.1 else "medium" if score > 0.05 else "low"
                })
            
            return {
                "top_keywords": top_keywords,
                "total_unique_words": int(len(feature_names))
            }
            
        except Exception as e:
            print(f"⚠️ Keyword extraction failed: {e}")
            return {"top_keywords": [], "total_unique_words": 0}
    
    def _analyze_rating_distribution(self, df: pd.DataFrame) -> Dict[str, int]:
        """Get star rating distribution."""
        if df.empty:
            return {
                "5_star": 0, "4_star": 0, "3_star": 0, "2_star": 0, "1_star": 0
            }
        
        return {
            "5_star": int(len(df[df['rating'] == 5.0])),
            "4_star": int(len(df[df['rating'] == 4.0])),
            "3_star": int(len(df[df['rating'] == 3.0])),
            "2_star": int(len(df[df['rating'] == 2.0])),
            "1_star": int(len(df[df['rating'] == 1.0]))
        }
    
    def _analyze_temporal_trends(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze trends over time."""
        try:
            if 'review_date' not in df.columns or df.empty:
                return {
                    "monthly_data": [],
                    "trend": "unknown"
                }
            
            df['review_date'] = pd.to_datetime(df['review_date'], errors='coerce')
            df = df.dropna(subset=['review_date']).sort_values('review_date')
            
            if df.empty:
                return {
                    "monthly_data": [],
                    "trend": "unknown"
                }
            
            df['year_month'] = df['review_date'].dt.to_period('M')
            monthly_counts = df.groupby('year_month').size().to_dict()
            monthly_avg_rating = df.groupby('year_month')['rating'].mean().to_dict()
            
            monthly_data = [
                {
                    "month": str(period),
                    "review_count": int(count),
                    "average_rating": round(float(monthly_avg_rating[period]), 2)
                }
                for period, count in monthly_counts.items()
            ]
            
            # Determine trend
            trend = "stable"
            if len(monthly_data) > 1:
                first_count = monthly_data[0]["review_count"]
                last_count = monthly_data[-1]["review_count"]
                if last_count > first_count * 1.2:
                    trend = "increasing"
                elif last_count < first_count * 0.8:
                    trend = "decreasing"
            
            return {
                "monthly_data": monthly_data[-12:],
                "trend": trend
            }
            
        except Exception as e:
            print(f"⚠️ Temporal analysis failed: {e}")
            return {
                "monthly_data": [],
                "trend": "unknown"
            }


# Singleton instance
review_analyzer = EnhancedReviewAnalyzer()