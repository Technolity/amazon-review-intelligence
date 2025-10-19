import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from typing import List, Dict, Any
import re
from collections import Counter
import logging

logger = logging.getLogger(__name__)

class ThemeClusterer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=100,
            stop_words='english',
            ngram_range=(1, 2)  # Include single words and phrases
        )
        self.feature_names = []
    
    def extract_themes(self, reviews: List[Dict], num_clusters: int = 5) -> List[Dict[str, Any]]:
        """
        Extract thematic clusters from reviews
        """
        if len(reviews) < num_clusters:
            num_clusters = max(1, len(reviews) // 2)
        
        try:
            # Extract review texts
            review_texts = [review.get('content', '') for review in reviews]
            review_ids = [review.get('id', '') for review in reviews]
            
            if not review_texts:
                return []
            
            # Create TF-IDF matrix
            tfidf_matrix = self.vectorizer.fit_transform(review_texts)
            self.feature_names = self.vectorizer.get_feature_names_out()
            
            # Perform clustering
            kmeans = KMeans(n_clusters=num_clusters, random_state=42, n_init=10)
            clusters = kmeans.fit_predict(tfidf_matrix)
            
            # Get cluster centers to identify important features
            cluster_centers = kmeans.cluster_centers_
            
            # Build theme clusters
            theme_clusters = []
            for cluster_id in range(num_clusters):
                # Get reviews in this cluster
                cluster_review_indices = np.where(clusters == cluster_id)[0]
                
                if len(cluster_review_indices) == 0:
                    continue
                
                # Get top keywords for this cluster
                top_feature_indices = cluster_centers[cluster_id].argsort()[-10:][::-1]
                top_keywords = [self.feature_names[i] for i in top_feature_indices 
                              if i < len(self.feature_names)]
                
                # Calculate cluster sentiment (average rating)
                cluster_ratings = [reviews[i].get('rating', 3) for i in cluster_review_indices]
                avg_sentiment = sum(cluster_ratings) / len(cluster_ratings) if cluster_ratings else 3
                
                # Generate theme name from top keywords
                theme_name = self._generate_theme_name(top_keywords, review_texts, cluster_review_indices)
                
                theme_clusters.append({
                    "id": f"theme_{cluster_id}",
                    "theme": theme_name,
                    "reviews": [review_ids[i] for i in cluster_review_indices],
                    "keywords": top_keywords[:5],  # Top 5 keywords
                    "sentiment_score": avg_sentiment,
                    "size": len(cluster_review_indices)
                })
            
            return theme_clusters
            
        except Exception as e:
            logger.error(f"Error in theme clustering: {e}")
            return self._mock_themes(reviews)
    
    def _generate_theme_name(self, keywords: List[str], review_texts: List[str], 
                           cluster_indices: List[int]) -> str:
        """Generate a human-readable theme name from keywords"""
        # Filter meaningful keywords (exclude common words)
        meaningful_keywords = [
            kw for kw in keywords 
            if len(kw) > 3 and kw not in ['product', 'quality', 'good', 'great', 'bad']
        ]
        
        if meaningful_keywords:
            # Use the top meaningful keyword as base
            base_theme = meaningful_keywords[0].replace('_', ' ').title()
            
            # Add context based on other keywords
            if any(kw in ['price', 'cost', 'expensive', 'cheap'] for kw in keywords):
                return f"{base_theme} & Price"
            elif any(kw in ['delivery', 'shipping', 'fast', 'slow'] for kw in keywords):
                return f"{base_theme} & Delivery"
            elif any(kw in ['easy', 'difficult', 'simple', 'complex'] for kw in keywords):
                return f"{base_theme} & Usability"
            else:
                return base_theme
        else:
            return "General Feedback"
    
    def _mock_themes(self, reviews: List[Dict]) -> List[Dict[str, Any]]:
        """Fallback mock themes when clustering fails"""
        if not reviews:
            return []
        
        # Simple rule-based theme extraction
        themes = []
        review_texts = [review.get('content', '').lower() for review in reviews]
        review_ids = [review.get('id', '') for review in reviews]
        
        # Check for common themes
        theme_patterns = {
            "Quality & Performance": ['quality', 'performance', 'work', 'function'],
            "Price & Value": ['price', 'cost', 'expensive', 'cheap', 'value'],
            "Delivery & Service": ['delivery', 'shipping', 'service', 'customer'],
            "Ease of Use": ['easy', 'simple', 'use', 'install', 'setup'],
            "Design & Appearance": ['design', 'look', 'appearance', 'color', 'size']
        }
        
        for theme_name, keywords in theme_patterns.items():
            theme_reviews = []
            for i, text in enumerate(review_texts):
                if any(keyword in text for keyword in keywords):
                    theme_reviews.append(review_ids[i])
            
            if theme_reviews:
                themes.append({
                    "id": f"theme_{len(themes)}",
                    "theme": theme_name,
                    "reviews": theme_reviews,
                    "keywords": keywords[:3],
                    "sentiment_score": 3.5,
                    "size": len(theme_reviews)
                })
        
        return themes if themes else [{
            "id": "theme_0",
            "theme": "General Feedback",
            "reviews": review_ids,
            "keywords": ["product", "experience", "purchase"],
            "sentiment_score": 3.0,
            "size": len(reviews)
        }]