"""
Mock data generator for Amazon reviews - Development & Testing
"""

import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

class MockDataGenerator:
    """Generate realistic mock review data"""
    
    # Country-specific data
    COUNTRY_DATA = {
        "US": {
            "currency": "USD",
            "currency_symbol": "$",
            "names": ["John D.", "Sarah M.", "Mike R.", "Emily K.", "David L.", "Lisa P.", 
                     "James W.", "Maria G.", "Robert T.", "Jennifer B.", "Michael C.", "Amanda S."],
            "location_mentions": ["great shipping to California", "arrived quickly in Texas", "delivery to New York was fast"],
            "language_style": "american"
        },
        "IN": {  # NEW: India-specific data
            "currency": "INR", 
            "currency_symbol": "₹",
            "names": ["Rajesh K.", "Priya S.", "Amit P.", "Sneha R.", "Vikram M.", "Anita G.",
                     "Rohit T.", "Kavita N.", "Suresh C.", "Meera J.", "Arjun L.", "Deepika V."],
            "location_mentions": ["excellent delivery to Mumbai", "fast shipping to Delhi", "good service in Bangalore", "quick delivery to Hyderabad"],
            "language_style": "indian"
        },
        "UK": {
            "currency": "GBP",
            "currency_symbol": "£", 
            "names": ["James S.", "Emma W.", "Oliver B.", "Sophie T.", "Harry M.", "Charlotte R.",
                     "George K.", "Amelia P.", "William F.", "Isabella C.", "Jack H.", "Mia L."],
            "location_mentions": ["brilliant delivery to London", "quick shipping to Manchester", "excellent service in Birmingham"],
            "language_style": "british"
        }, 
        "CA": {
            "currency": "CAD",
            "currency_symbol": "C$",
            "names": ["Alex M.", "Jessica T.", "Ryan K.", "Michelle S.", "Tyler B.", "Sarah J.",
                     "Brandon L.", "Amanda R.", "Justin W.", "Nicole P.", "Kyle H.", "Stephanie G."],
            "location_mentions": ["great delivery to Toronto", "fast shipping to Vancouver", "quick service in Montreal"],
            "language_style": "canadian"
        },
        "DE": {
            "currency": "EUR",
            "currency_symbol": "€",
            "names": ["Hans M.", "Anna K.", "Klaus S.", "Marie L.", "Stefan B.", "Julia R.",
                     "Thomas W.", "Petra H.", "Andreas F.", "Sabine T.", "Michael G.", "Claudia N."],
            "location_mentions": ["schnelle Lieferung nach Berlin", "guter Service in München", "zuverlässige Lieferung"],
            "language_style": "german"
        }
    }
    
    # Country-specific review templates
    SAMPLE_REVIEWS = {
        "US": [
            {"rating": 5, "title": "Excellent product! Highly recommend", 
             "text": "This product exceeded all my expectations. The build quality is outstanding and it works perfectly. I've been using it for a month now and couldn't be happier. Great value for money!", 
             "verified": True, "helpful_count": 45},
            {"rating": 4, "title": "Very good, minor issues", 
             "text": "Overall a great product. Does exactly what it's supposed to do. Only giving 4 stars because the instructions could be clearer, but once you figure it out, it's perfect.", 
             "verified": True, "helpful_count": 18},
            {"rating": 2, "title": "Disappointed with quality", 
             "text": "Expected much better quality given the reviews. The product feels cheap and doesn't work as smoothly as described. Customer service was unhelpful. Would not recommend.", 
             "verified": True, "helpful_count": 23}
        ],
        "IN": [  # NEW: India-specific reviews
            {"rating": 5, "title": "Excellent product! Worth every rupee", 
             "text": "Outstanding quality product! Delivered quickly to Mumbai. The build quality is superb and works exactly as described. Highly recommend to all. Great value for money!", 
             "verified": True, "helpful_count": 52},
            {"rating": 5, "title": "Amazing quality and fast delivery", 
             "text": "Fantastic product! Delivery to Bangalore was very fast. Quality is top-notch and customer service is excellent. Will definitely order again. Paisa vasool!", 
             "verified": True, "helpful_count": 38},
            {"rating": 4, "title": "Good product, slight issues", 
             "text": "Overall very good product. Works well for the price. Only issue is that instructions are in English only, would be better with Hindi support. But quality is good.", 
             "verified": True, "helpful_count": 24},
            {"rating": 3, "title": "Average product for the price", 
             "text": "Product is okay. Expected better quality considering the price. Delivery to Delhi was on time. It works but nothing extraordinary. There are better options available.", 
             "verified": False, "helpful_count": 15},
            {"rating": 2, "title": "Not satisfied with quality", 
             "text": "Product quality is below expectations. For this price, expected much better. Customer service could be improved. Delivery to Hyderabad was delayed by 2 days.", 
             "verified": True, "helpful_count": 19}
        ],
        "UK": [
            {"rating": 5, "title": "Brilliant product!", 
             "text": "Absolutely chuffed with this purchase! Quality is spot on and delivery to London was prompt. Exactly what I needed and works a treat. Highly recommended!", 
             "verified": True, "helpful_count": 34},
            {"rating": 3, "title": "Decent but not brilliant", 
             "text": "It's alright, does the job but nothing special. For the price, it's reasonable but there might be better alternatives. Delivery was quick though.", 
             "verified": True, "helpful_count": 12}
        ]
    }
    
    @staticmethod
    def generate_reviews(count: int = 50, asin: str = "B08N5WRWNW", country: str = "US") -> Dict[str, Any]:  # NEW: Added country parameter
        """Generate mock reviews with realistic data"""
        
        # Get country-specific data or default to US
        country_info = MockDataGenerator.COUNTRY_DATA.get(country, MockDataGenerator.COUNTRY_DATA["US"])
        country_reviews = MockDataGenerator.SAMPLE_REVIEWS.get(country, MockDataGenerator.SAMPLE_REVIEWS["US"])
        
        reviews = []
        start_date = datetime.now() - timedelta(days=180)
        
        for i in range(count):
            # Select a base review template from country-specific reviews
            base_review = random.choice(country_reviews)
            
            # Create review with variations
            review_date = start_date + timedelta(days=random.randint(0, 180))
            
            # Add location mentions occasionally
            text = base_review["text"]
            if random.random() < 0.3:  # 30% chance to add location mention
                location_mention = random.choice(country_info["location_mentions"])
                text += f" Also, {location_mention}."
            
            review = {
                "id": f"R{random.randint(1000000, 9999999)}",
                "asin": asin,
                "title": base_review["title"],
                "text": text,
                "rating": base_review["rating"],
                "author": random.choice(country_info["names"]),  # Country-specific names
                "date": review_date.strftime("%Y-%m-%d"),
                "verified_purchase": base_review["verified"],
                "helpful_count": base_review["helpful_count"] + random.randint(-5, 10),
                "vine_program": random.random() < 0.05,  # 5% vine reviews
                "country": country  # NEW: Set to requested country
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
            "country": country,  # NEW: Include country in response
            "total_reviews": count,
            "average_rating": round(avg_rating, 2),
            "rating_distribution": rating_dist,
            "reviews": reviews,
            "product_info": {
                "title": f"Sample Product - Mock Data ({country})",  # NEW: Country in title
                "brand": "Sample Brand",
                "category": "Electronics",
                "country": country,  # NEW: Country in product info
                "marketplace": f"amazon.{'in' if country == 'IN' else 'com' if country == 'US' else 'co.uk' if country == 'UK' else 'ca' if country == 'CA' else 'de'}",  # NEW: Marketplace
                "currency": country_info["currency"],  # NEW: Country-specific currency
                "currency_symbol": country_info["currency_symbol"]  # NEW: Currency symbol
            },
            "data_source": "mock_generator",
            "generated_at": datetime.now().isoformat()
        }
    
    @staticmethod
    def get_sample_product_info(asin: str, country: str = "US") -> Dict[str, Any]:  # NEW: Added country parameter
        """Get mock product information"""
        
        # Get country-specific data
        country_info = MockDataGenerator.COUNTRY_DATA.get(country, MockDataGenerator.COUNTRY_DATA["US"])
        
        return {
            "asin": asin,
            "title": f"Premium Product {asin[-4:]} ({country})",  # NEW: Country in title
            "brand": "TechBrand",
            "category": "Electronics",
            "price": random.randint(20, 500),
            "currency": country_info["currency"],  # NEW: Country-specific currency
            "currency_symbol": country_info["currency_symbol"],  # NEW: Currency symbol
            "country": country,  # NEW: Country field
            "marketplace": f"amazon.{'in' if country == 'IN' else 'com' if country == 'US' else 'co.uk' if country == 'UK' else 'ca' if country == 'CA' else 'de'}",  # NEW: Marketplace
            "in_stock": True,
            "images": [f"https://via.placeholder.com/400?text=Product+{asin[-4:]}+{country}"]  # NEW: Country in image
        }


# Singleton instance
mock_generator = MockDataGenerator()
