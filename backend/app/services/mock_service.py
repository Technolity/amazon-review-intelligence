"""
Mock data service - Always works as fallback.
"""

import random
from typing import Dict, List, Any
from datetime import datetime, timedelta


class MockService:
    """Generate realistic mock reviews for testing."""
    
    def __init__(self):
        print("✅ Mock Service initialized")
        
        # Mock data templates
        self.positive_templates = [
            "Great product! Exactly what I needed. Highly recommend.",
            "Excellent quality and fast shipping. Very satisfied.",
            "Love it! Works perfectly and the battery life is amazing.",
            "Best purchase I've made. The build quality is outstanding.",
            "Perfect for my needs. Easy to use and very reliable.",
            "Outstanding product! Exceeded expectations in every way.",
            "The quality is superb. Very happy with this purchase!",
            "Absolutely love this! Worth every penny.",
        ]
        
        self.neutral_templates = [
            "It's okay. Does what it's supposed to do.",
            "Decent product for the price. Nothing special.",
            "Works as expected. No complaints but not amazing.",
            "Average quality. Gets the job done.",
            "It's fine. Met my basic expectations.",
        ]
        
        self.negative_templates = [
            "Disappointed with the quality. Not worth the price.",
            "Stopped working after a few days. Poor quality.",
            "Not as described. Expected better.",
            "Had issues from day one. Would not recommend.",
            "The battery life is terrible. Very frustrating.",
            "Poor build quality. Feels cheap and flimsy.",
        ]
        
        self.feature_words = [
            "battery", "quality", "price", "shipping", "design", 
            "features", "size", "color", "packaging", "performance",
            "screen", "sound", "speed", "durability", "comfort"
        ]
        
        self.product_titles = {
            "B08N5WRWNW": "Amazon Basics 48 Pack AA High-Performance Alkaline Batteries",
            "B0CHX1W1XY": "Wireless Bluetooth Headphones with Noise Cancellation",
            "B07FK8SQDQ": "Smart Fitness Tracker with Heart Rate Monitor",
            "B08C1W6J61": "Stainless Steel Water Bottle - Insulated 1 Liter",
            "default": "Premium Electronic Device with Advanced Features"
        }
    
    def fetch_reviews(self, asin: str, max_reviews: int = 100, country: str = "US") -> Dict[str, Any]:
        """
        Generate mock reviews for any ASIN.
        
        Args:
            asin: Product ASIN
            max_reviews: Maximum number of reviews
            country: Country code
        
        Returns:
            Dict with mock reviews data
        """
        print(f"🎭 Generating mock reviews for ASIN: {asin}")
        
        reviews = self._generate_mock_reviews(asin, max_reviews)
        product_title = self.product_titles.get(asin, self.product_titles["default"])
        
        return {
            "success": True,
            "asin": asin,
            "total_reviews": len(reviews),
            "reviews": reviews,
            "product_title": product_title,
            "average_rating": self._calculate_average_rating(reviews),
            "fetched_at": datetime.now().isoformat(),
            "mock_data": True,
            "source": "mock",
            "country": country
        }
    
    def _generate_mock_reviews(self, asin: str, count: int) -> List[Dict]:
        """Generate realistic mock reviews."""
        reviews = []
        base_date = datetime.now() - timedelta(days=365)
        
        for i in range(min(count, 50)):  # Max 50 mock reviews
            # Generate rating with realistic distribution
            rating_roll = random.random()
            if rating_roll < 0.55:  # 55% 5-star
                rating = 5.0
                templates = self.positive_templates
            elif rating_roll < 0.75:  # 20% 4-star
                rating = 4.0
                templates = self.positive_templates
            elif rating_roll < 0.85:  # 10% 3-star
                rating = 3.0
                templates = self.neutral_templates
            elif rating_roll < 0.95:  # 10% 2-star
                rating = 2.0
                templates = self.negative_templates
            else:  # 5% 1-star
                rating = 1.0
                templates = self.negative_templates
            
            text = random.choice(templates)
            
            # Add feature mention 70% of the time
            if random.random() > 0.3:
                feature = random.choice(self.feature_words)
                feature_comments = [
                    f" The {feature} is excellent.",
                    f" Really impressed with the {feature}.",
                    f" The {feature} could be better.",
                    f" Love the {feature} on this product.",
                    f" The {feature} needs improvement."
                ]
                text += random.choice(feature_comments)
            
            # Add more detail 50% of the time
            if random.random() > 0.5:
                detail_comments = [
                    " Would definitely buy again.",
                    " Great value for money.",
                    " Fast delivery and good packaging.",
                    " Much better than I expected.",
                    " Some minor issues but overall good.",
                    " Not perfect, but gets the job done.",
                    " Excellent customer service too."
                ]
                text += random.choice(detail_comments)
            
            review_date = base_date + timedelta(days=random.randint(0, 365))
            
            reviews.append({
                "review_id": f"{asin}_{i:04d}",
                "asin": asin,
                "rating": rating,
                "review_text": text,
                "review_title": self._generate_review_title(rating),
                "review_date": review_date.strftime("%B %d, %Y"),
                "verified_purchase": random.random() > 0.3,  # 70% verified
                "helpful_votes": random.randint(0, 25),
                "reviewer_name": f"Customer{random.randint(1000, 9999)}"
            })
        
        return reviews
    
    def _generate_review_title(self, rating: float) -> str:
        """Generate appropriate review title based on rating."""
        if rating >= 4.5:
            titles = ["Excellent!", "Love it!", "Perfect!", "Amazing product!"]
        elif rating >= 4.0:
            titles = ["Very good", "Great buy", "Happy customer", "Works well"]
        elif rating >= 3.0:
            titles = ["It's okay", "Decent product", "Average", "Meets expectations"]
        elif rating >= 2.0:
            titles = ["Disappointing", "Could be better", "Not great", "Issues"]
        else:
            titles = ["Terrible", "Waste of money", "Avoid", "Poor quality"]
        
        return random.choice(titles)
    
    def _calculate_average_rating(self, reviews: List[Dict]) -> float:
        """Calculate average rating."""
        if not reviews:
            return 0.0
        
        total = sum(review['rating'] for review in reviews)
        return round(total / len(reviews), 2)


# Singleton instance
mock_service = MockService()