"""
Amazon review fetching service - Supports Apify API and mock data.
"""

import os
import random
from typing import Dict, List, Any
from datetime import datetime, timedelta

from app.utils.helpers import validate_asin
from app.utils.amazon_url_parser import amazon_url_parser


class AmazonScraper:
    """Fetch Amazon reviews (Apify API or mock data)."""
    
    def __init__(self):
        self.use_mock = os.getenv('USE_MOCK_DATA', 'False').lower() == 'true'
        self.apify_api_token = os.getenv('APIFY_API_TOKEN', '')
        
        # Initialize Apify service if available
        if not self.use_mock and self.apify_api_token:
            try:
                from app.services.apify_service import apify_service
                self.real_service = apify_service
                print("✅ Apify service initialized")
            except Exception as e:
                print(f"⚠️ Could not initialize Apify: {e}")
                self.real_service = None
        else:
            self.real_service = None
            if self.use_mock:
                print("ℹ️ Using mock data mode")
            else:
                print("⚠️ Apify API token not configured")
        
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
            "features", "size", "color", "packaging", "performance"
        ]
    
    def fetch_reviews(self, asin_or_url: str, max_reviews: int = 100, country: str = "IN", multi_country: bool = True) -> Dict[str, Any]:
        """
        Fetch reviews for a product (ASIN or URL).
        
        Args:
            asin_or_url: Product ASIN or Amazon URL
            max_reviews: Maximum number of reviews
            country: Country code for Amazon domain (US, IN, UK, etc.)
            multi_country: Whether to try multiple countries if first fails
        
        Returns:
            Dict with reviews and metadata
        """
        # Extract ASIN from URL if needed
        asin = amazon_url_parser.extract_asin(asin_or_url)
        
        if not asin:
            return {
                "success": False,
                "error": f"Invalid ASIN or URL: {asin_or_url}",
                "error_type": "invalid_input"
            }
        
        print(f"📊 Fetching reviews for ASIN: {asin} (Country: {country}, Multi-country: {multi_country})")
        
        # If mock data is enabled, use it directly
        if self.use_mock:
            print("🎭 Using mock data (USE_MOCK_DATA=True)...")
            result = self._generate_mock_reviews(asin, max_reviews)
            result['country'] = country
            result['source'] = 'mock'
            return result
        
        # Use multi-country search if enabled and real service is available
        if multi_country and self.real_service:
            print("🌍 Multi-country search enabled...")
            countries_to_try = ["IN", "US", "UK", "DE"]  # Default priority
            if country and country != "IN":
                # Put selected country first, then others
                countries_to_try = [country] + [c for c in countries_to_try if c != country]
            
            return self.fetch_reviews_multiple_countries(asin_or_url, max_reviews, countries_to_try)
        
        # Single country search with real service
        if self.real_service:
            print(f"📍 Single country search: {country}")
            print("🌐 Using Apify API to fetch real reviews...")
            result = self.real_service.fetch_reviews(asin, max_reviews, country)
            
            # Return error directly - NO FALLBACK
            if not result.get('success'):
                error_type = result.get('error_type', 'unknown')
                error_msg = result.get('error', 'Failed to fetch reviews')
                
                print(f"❌ Apify API failed: {error_msg}")
                
                return {
                    "success": False,
                    "error": error_msg,
                    "error_type": error_type,
                    "suggestion": result.get('suggestion', 'Please try again later.'),
                    "asin": asin,
                    "country": country
                }
            
            # Check if we got reviews
            if result.get('total_reviews', 0) == 0:
                print("❌ No reviews returned from API")
                return {
                    "success": False,
                    "error": "No reviews found for this product. The product may not exist or has no reviews yet.",
                    "error_type": "no_reviews",
                    "suggestion": "Please verify the ASIN is correct and try another product.",
                    "asin": asin,
                    "country": country
                }
            
            # Add country info to result
            result['country'] = country
            result['source'] = 'apify'
            return result
        
        # If neither API nor mock is configured
        return {
            "success": False,
            "error": "Review fetching service not configured. Please set up Apify API or enable mock data.",
            "error_type": "not_configured",
            "suggestion": "Contact administrator to configure review fetching service.",
            "asin": asin,
            "country": country
        }
    
    def fetch_reviews_multiple_countries(self, asin_or_url: str, max_reviews: int = 100, countries: List[str] = None) -> Dict[str, Any]:
        """
        Fetch reviews from multiple Amazon countries.
        
        Args:
            asin_or_url: Product ASIN or Amazon URL
            max_reviews: Maximum number of reviews per country
            countries: List of country codes to try
            
        Returns:
            Dict with reviews from first successful country
        """
        if countries is None:
            countries = ["IN", "US", "UK", "DE"]  # Default country priority
        
        asin = amazon_url_parser.extract_asin(asin_or_url)
        
        if not asin:
            return {
                "success": False,
                "error": f"Invalid ASIN or URL: {asin_or_url}",
                "error_type": "invalid_input"
            }
        
        print(f"🌍 Trying multiple countries for ASIN: {asin}")
        print(f"  Countries to try: {', '.join(countries)}")
        
        errors = []
        
        # Try each country until we get successful results
        for country in countries:
            print(f"  🔍 Trying Amazon {country}...")
            
            # Use Apify service for real data
            if self.real_service:
                result = self.real_service.fetch_reviews(asin, max_reviews, country)
                
                if result.get('success') and result.get('total_reviews', 0) > 0:
                    print(f"  ✅ Success with Amazon {country} - Found {result.get('total_reviews')} reviews")
                    result['countries_tried'] = countries
                    result['successful_country'] = country
                    result['source'] = 'apify'
                    return result
                else:
                    error_msg = result.get('error', 'Unknown error')
                    error_type = result.get('error_type', 'unknown')
                    print(f"  ❌ Failed with Amazon {country}: {error_msg}")
                    errors.append(f"{country}: {error_msg}")
            else:
                # If no real service, use mock data
                print(f"  🎭 Using mock data for {country} (no real service available)")
                result = self._generate_mock_reviews(asin, max_reviews)
                result['country'] = country
                result['countries_tried'] = countries
                result['successful_country'] = country
                result['source'] = 'mock'
                return result
        
        # If all countries failed and we have real service
        if self.real_service:
            print(f"❌ All countries failed for ASIN: {asin}")
            return {
                "success": False,
                "error": f"Failed to fetch reviews from all countries: {', '.join(countries)}",
                "error_type": "all_countries_failed",
                "suggestion": "The product might not be available in these regions, has no reviews, or there might be an issue with the review service.",
                "asin": asin,
                "countries_tried": countries,
                "country_errors": errors
            }
        else:
            # Fallback to mock data if no real service
            print("🔄 No real service available, falling back to mock data")
            result = self._generate_mock_reviews(asin, max_reviews)
            result['country'] = countries[0] if countries else "IN"
            result['countries_tried'] = countries
            result['successful_country'] = countries[0] if countries else "IN"
            result['source'] = 'mock'
            return result
    
    def _generate_mock_reviews(self, asin: str, count: int) -> Dict[str, Any]:
        """Generate realistic mock reviews for testing."""
        reviews = []
        base_date = datetime.now() - timedelta(days=365)
        
        for i in range(count):
            # Generate rating with realistic distribution
            rating_roll = random.random()
            if rating_roll < 0.50:
                rating = 5.0
                templates = self.positive_templates
            elif rating_roll < 0.70:
                rating = 4.0
                templates = self.positive_templates
            elif rating_roll < 0.80:
                rating = 3.0
                templates = self.neutral_templates
            elif rating_roll < 0.90:
                rating = 2.0
                templates = self.negative_templates
            else:
                rating = 1.0
                templates = self.negative_templates
            
            text = random.choice(templates)
            
            if random.random() > 0.3:
                feature = random.choice(self.feature_words)
                text += f" The {feature} is excellent."
            
            review_date = base_date + timedelta(days=random.randint(0, 365))
            
            reviews.append({
                "review_id": f"{asin}_{i:04d}",
                "asin": asin,
                "rating": rating,
                "review_text": text,
                "review_title": f"Review {i+1}",
                "review_date": review_date.strftime("%B %d, %Y"),
                "verified_purchase": random.random() > 0.2,
                "helpful_votes": random.randint(0, 50)
            })
        
        return {
            "success": True,
            "asin": asin,
            "total_reviews": len(reviews),
            "reviews": reviews,
            "product_title": f"Sample Product {asin}",
            "average_rating": round(sum(r['rating'] for r in reviews) / len(reviews), 2),
            "fetched_at": datetime.now().isoformat(),
            "mock_data": True,
            "source": "mock"
        }


# Singleton instance
amazon_scraper = AmazonScraper()