"""
Mock data generator for Amazon reviews - Development & Testing
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

class MockDataGenerator:
    """Generate realistic mock review data"""
    
    SAMPLE_REVIEWS = [
        # Positive Reviews
        {
            "rating": 5,
            "title": "Excellent product! Highly recommend",
            "text": "This product exceeded all my expectations. The build quality is outstanding and it works perfectly. I've been using it for a month now and couldn't be happier. Great value for money!",
            "verified": True,
            "helpful_count": 45
        },
        {
            "rating": 5,
            "title": "Amazing quality and fast delivery",
            "text": "Absolutely love this! The quality is superb and it arrived even faster than expected. Customer service was also very helpful when I had questions. Will definitely buy again.",
            "verified": True,
            "helpful_count": 32
        },
        {
            "rating": 4,
            "title": "Very good, minor issues",
            "text": "Overall a great product. Does exactly what it's supposed to do. Only giving 4 stars because the instructions could be clearer, but once you figure it out, it's perfect.",
            "verified": True,
            "helpful_count": 18
        },
        {
            "rating": 5,
            "title": "Best purchase this year!",
            "text": "I've bought many similar products but this one is by far the best. Durable, reliable, and looks great too. My whole family loves it. Highly recommended!",
            "verified": True,
            "helpful_count": 67
        },
        
        # Neutral Reviews
        {
            "rating": 3,
            "title": "It's okay, nothing special",
            "text": "The product works as advertised but nothing really stands out. It gets the job done but I expected a bit more for the price. Not bad, just average.",
            "verified": True,
            "helpful_count": 12
        },
        {
            "rating": 3,
            "title": "Decent but could be better",
            "text": "Fair quality for the price. Some features work well while others could use improvement. It serves its purpose but there's room for enhancement.",
            "verified": False,
            "helpful_count": 8
        },
        
        # Negative Reviews
        {
            "rating": 2,
            "title": "Disappointed with quality",
            "text": "Expected much better quality given the reviews. The product feels cheap and doesn't work as smoothly as described. Customer service was unhelpful. Would not recommend.",
            "verified": True,
            "helpful_count": 23
        },
        {
            "rating": 1,
            "title": "Broke after a week",
            "text": "This is terrible. Stopped working after just one week of normal use. Tried to get a refund but the process was difficult. Save your money and buy from a different brand.",
            "verified": True,
            "helpful_count": 34
        },
        {
            "rating": 2,
            "title": "Not worth the money",
            "text": "Overpriced for what you get. There are much better alternatives available. The build quality is poor and it feels flimsy. Really disappointed with this purchase.",
            "verified": False,
            "helpful_count": 15
        },
        {
            "rating": 1,
            "title": "Complete waste of money",
            "text": "Worst purchase I've made in a long time. Nothing works as advertised. Poor quality, terrible customer service. Avoid at all costs!",
            "verified": True,
            "helpful_count": 41
        }
    ]
    
    NAMES = ["John D.", "Sarah M.", "Mike R.", "Emily K.", "David L.", "Lisa P.", 
             "James W.", "Maria G.", "Robert T.", "Jennifer B.", "Michael C.", "Amanda S."]
    
    @staticmethod
    def generate_reviews(count: int = 50, asin: str = "B08N5WRWNW") -> Dict[str, Any]:
        """Generate mock reviews with realistic data"""
        
        reviews = []
        start_date = datetime.now() - timedelta(days=180)
        
        for i in range(count):
            # Select a base review template
            base_review = random.choice(MockDataGenerator.SAMPLE_REVIEWS)
            
            # Create review with variations
            review_date = start_date + timedelta(days=random.randint(0, 180))
            
            review = {
                "id": f"R{random.randint(1000000, 9999999)}",
                "asin": asin,
                "title": base_review["title"],
                "text": base_review["text"],
                "rating": base_review["rating"],
                "author": random.choice(MockDataGenerator.NAMES),
                "date": review_date.strftime("%Y-%m-%d"),
                "verified_purchase": base_review["verified"],
                "helpful_count": base_review["helpful_count"] + random.randint(-5, 10),
                "vine_program": random.random() < 0.05,  # 5% vine reviews
                "country": random.choice(["IN", "US", "UK", "CA", "DE"])
            }
            
            reviews.append(review)
        
        # Calculate statistics
        ratings = [r["rating"] for r in reviews]
        avg_rating = sum(ratings) / len(ratings)
        
        rating_dist = {
            "5_star": len([r for r in reviews if r["rating"] == 5]),
            "4_star": len([r for r in reviews if r["rating"] == 4]),
            "3_star": len([r for r in reviews if r["rating"] == 3]),
            "2_star": len([r for r in reviews if r["rating"] == 2]),
            "1_star": len([r for r in reviews if r["rating"] == 1])
        }
        
        return {
            "success": True,
            "asin": asin,
            "total_reviews": count,
            "average_rating": round(avg_rating, 2),
            "rating_distribution": rating_dist,
            "reviews": reviews,
            "product_info": {
                "title": "Sample Product - Mock Data",
                "brand": "Sample Brand",
                "category": "Electronics"
            },
            "data_source": "mock_generator",
            "generated_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def get_sample_product_info(asin: str) -> Dict[str, Any]:
        """Get mock product information"""
        return {
            "asin": asin,
            "title": f"Premium Product {asin[-4:]}",
            "brand": "TechBrand",
            "category": "Electronics",
            "price": random.randint(20, 500),
            "currency": "USD",
            "in_stock": True,
            "images": [f"https://via.placeholder.com/400?text=Product+{asin[-4:]}"]
        }


# Singleton instance
mock_generator = MockDataGenerator()