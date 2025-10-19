"""
Review analysis service using TF-IDF and sentiment analysis.
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from collections import Counter
from datetime import datetime

from app.core.config import settings
from app.utils.text_cleaner import text_cleaner
from app.utils.helpers import sanitize_dataframe, calculate_percentage, get_sentiment_label


class ReviewAnalyzer:
    """Analyze reviews for insights."""
    
    def __init__(self):
        self.text_cleaner = text_cleaner
        self.positive_threshold = settings.POSITIVE_THRESHOLD
        self.negative_threshold = settings.NEGATIVE_THRESHOLD
    
    def analyze_reviews(self, reviews_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main analysis pipeline.
        
        Args:
            reviews_data: Reviews from amazon_scraper
        
        Returns:
            Complete analysis results
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
        
        # Convert to DataFrame
        df = pd.DataFrame(reviews)
        df = sanitize_dataframe(df)
        
        # Clean texts
        df['cleaned_text'] = df['review_text'].apply(
            lambda x: self.text_cleaner.clean_text(x, remove_stopwords=False)
        )
        
        # Perform analyses
        sentiment_dist = self._analyze_sentiment(df)
        keyword_analysis = self._extract_keywords_tfidf(df)
        rating_dist = self._analyze_rating_distribution(df)
        temporal_trends = self._analyze_temporal_trends(df)
        insights = self._generate_insights(df, sentiment_dist, keyword_analysis)
        summary = self._generate_summary(df, sentiment_dist, keyword_analysis)
        
        return {
            "success": True,
            "asin": reviews_data.get("asin"),
            "product_title": reviews_data.get("product_title"),
            "total_reviews": len(df),
            "analyzed_at": datetime.now().isoformat(),
            "sentiment_distribution": sentiment_dist,
            "keyword_analysis": keyword_analysis,
            "rating_distribution": rating_dist,
            "temporal_trends": temporal_trends,
            "insights": insights,
            "summary": summary
        }
    
    def _analyze_sentiment(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Analyze sentiment distribution."""
        total = len(df)
        
        positive = len(df[df['rating'] >= self.positive_threshold])
        negative = len(df[df['rating'] <= self.negative_threshold])
        neutral = total - positive - negative
        
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
            "median_rating": round(float(df['rating'].median()), 2)
        }
    
    def _extract_keywords_tfidf(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Extract keywords using TF-IDF."""
        texts = df['cleaned_text'][df['cleaned_text'].str.len() > 10].tolist()
        
        if not texts:
            return {"top_keywords": [], "total_unique_words": 0}
        
        try:
            vectorizer = TfidfVectorizer(
                max_features=100,
                ngram_range=(1, 2),
                min_df=settings.MIN_KEYWORD_FREQUENCY,
                max_df=0.7,
                stop_words='english'
            )
            
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            avg_scores = np.asarray(tfidf_matrix.mean(axis=0)).flatten()
            
            keyword_scores = list(zip(feature_names, avg_scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            top_keywords = []
            for word, score in keyword_scores[:settings.TOP_KEYWORDS_COUNT]:
                frequency = sum(1 for text in df['cleaned_text'] if word in text.lower())
                
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
        
        except Exception:
            return self._extract_keywords_frequency(df)
    
    def _extract_keywords_frequency(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Fallback: Extract keywords by frequency."""
        all_words = []
        for text in df['cleaned_text']:
            words = self.text_cleaner.extract_keywords(text)
            all_words.extend(words)
        
        word_counts = Counter(all_words)
        most_common = word_counts.most_common(settings.TOP_KEYWORDS_COUNT)
        
        top_keywords = [
            {
                "word": word,
                "frequency": count,
                "tfidf_score": 0.0,
                "importance": "high" if count > 50 else "medium" if count > 20 else "low"
            }
            for word, count in most_common
        ]
        
        return {
            "top_keywords": top_keywords,
            "total_unique_words": len(word_counts)
        }
    
    def _analyze_rating_distribution(self, df: pd.DataFrame) -> Dict[str, int]:
        """Get star rating distribution."""
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
            df['review_date'] = pd.to_datetime(df['review_date'])
            df = df.sort_values('review_date')
            
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
            return {
                "monthly_data": [],
                "trend": "unknown",
                "error": str(e)
            }
    
    def _generate_insights(
        self, 
        df: pd.DataFrame, 
        sentiment: Dict, 
        keywords: Dict
    ) -> List[str]:
        """Generate actionable insights."""
        insights = []
        
        pos_pct = sentiment['positive']['percentage']
        neg_pct = sentiment['negative']['percentage']
        avg_rating = sentiment['average_rating']
        
        # Sentiment insights
        if pos_pct > 70:
            insights.append(f"Overwhelmingly positive reception with {pos_pct}% positive reviews")
        elif pos_pct > 50:
            insights.append(f"Generally positive sentiment ({pos_pct}% positive reviews)")
        elif neg_pct > 30:
            insights.append(f"Significant negative feedback ({neg_pct}% negative reviews)")
        
        # Rating insights
        if avg_rating >= 4.5:
            insights.append(f"Excellent average rating of {avg_rating} stars")
        elif avg_rating >= 4.0:
            insights.append(f"Strong average rating of {avg_rating} stars")
        elif avg_rating < 3.0:
            insights.append(f"Below-average rating of {avg_rating} stars indicates quality concerns")
        
        # Keyword insights
        top_words = keywords.get('top_keywords', [])[:5]
        if top_words:
            common_terms = ", ".join([kw['word'] for kw in top_words[:3]])
            insights.append(f"Most discussed aspects: {common_terms}")
        
        # Verified purchase insight
        if 'verified_purchase' in df.columns:
            verified_pct = calculate_percentage(
                len(df[df['verified_purchase'] == True]), 
                len(df)
            )
            if verified_pct > 80:
                insights.append(f"{verified_pct}% are verified purchases, indicating authentic feedback")
        
        return insights
    
    def _generate_summary(
        self, 
        df: pd.DataFrame, 
        sentiment: Dict, 
        keywords: Dict
    ) -> str:
        """Generate text summary."""
        total = len(df)
        avg_rating = sentiment['average_rating']
        pos_pct = sentiment['positive']['percentage']
        
        top_keywords = [kw['word'] for kw in keywords.get('top_keywords', [])[:5]]
        keyword_str = ", ".join(top_keywords) if top_keywords else "various features"
        
        summary = (
            f"Analysis of {total} reviews reveals an average rating of {avg_rating} stars, "
            f"with {pos_pct}% positive sentiment. "
            f"Customers frequently mention {keyword_str}. "
        )
        
        if pos_pct > 70:
            summary += "Overall, customers are highly satisfied with this product."
        elif pos_pct > 50:
            summary += "The product has generally positive reception with room for improvement."
        else:
            summary += "Mixed reviews suggest areas needing attention."
        
        return summary


# Singleton instance
review_analyzer = ReviewAnalyzer()