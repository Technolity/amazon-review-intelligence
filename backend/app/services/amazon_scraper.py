"""
Amazon review fetching service - Uses ONLY Apify.
Fetches maximum 5 reviews.
"""

import os
from typing import Dict, List, Any
from app.utils.helpers import validate_asin
from app.utils.amazon_url_parser import amazon_url_parser


class AmazonScraper:
    """Fetch Amazon reviews using ONLY Apify API."""
    
    def __init__(self):
        self.use_mock_only = os.getenv('USE_MOCK_ONLY', 'False').lower() == 'true'
        
        # Initialize Apify Service
        try:
            from app.services.apify_service import apify_service
            self.apify_service = apify_service
            print("✅ Amazon Scraper initialized - Apify Only")
            print("🎯 Maximum 5 reviews per request")
        except Exception as e:
            print(f"⚠️ Apify service setup failed: {e}")
            self.apify_service = None
    
    def fetch_reviews(self, asin_or_url: str, max_reviews: int = 5, country: str = "IN", multi_country: bool = True) -> Dict[str, Any]:
        """
        Fetch reviews for a product (ASIN or URL).
        Uses ONLY Apify API.
        MAX 5 REVIEWS ONLY.
        """
        # Extract ASIN from URL if needed
        asin = amazon_url_parser.extract_asin(asin_or_url)
        
        if not asin:
            return {
                "success": False,
                "error": f"Invalid ASIN or URL: {asin_or_url}",
                "error_type": "invalid_input"
            }
        
        print(f"📊 Fetching MAX 5 reviews for ASIN: {asin}")
        print(f"📍 Country: {country}, Multi-country: {multi_country}")
        
        # Enforce maximum 5 reviews
        actual_max_reviews = min(max_reviews, 5)
        if max_reviews > 5:
            print(f"⚠️  Limiting to 5 reviews (requested: {max_reviews})")
        
        # Use multi-country search if enabled
        if multi_country and self.apify_service and not self.use_mock_only:
            print("🌍 Multi-country search enabled...")
            countries_to_try = ["IN", "US", "UK", "DE", "CA"]  # Priority order
            if country and country != "IN":
                # Put selected country first, then others
                countries_to_try = [country] + [c for c in countries_to_try if c != country]
            
            return self.fetch_reviews_multiple_countries(asin, actual_max_reviews, countries_to_try)
        
        # Single country search with Apify
        if self.apify_service and not self.use_mock_only:
            print(f"📍 Single country search: {country}")
            result = self.apify_service.fetch_reviews(asin, actual_max_reviews, country)
            result['country'] = country
            result['max_reviews_limit'] = 5
            return result
        
        # Fallback (should not happen since we only use Apify)
        print("🎭 Using mock data fallback")
        from app.services.mock_service import mock_service
        result = mock_service.fetch_reviews(asin, actual_max_reviews, country)
        result['country'] = country
        result['max_reviews_limit'] = 5
        return result
    
    def fetch_reviews_multiple_countries(self, asin: str, max_reviews: int, countries: List[str]) -> Dict[str, Any]:
        """
        Try multiple countries with Apify.
        MAX 5 REVIEWS ONLY.
        """
        print(f"🌍 Trying multiple countries for ASIN: {asin}")
        print(f"  Countries to try: {', '.join(countries)}")
        
        for country in countries:
            print(f"  🔍 Trying Amazon {country}...")
            result = self.apify_service.fetch_reviews(asin, max_reviews, country)
            
            if result.get('success') and result.get('total_reviews', 0) > 0:
                print(f"  ✅ Success with Amazon {country}")
                result['countries_tried'] = countries
                result['successful_country'] = country
                result['max_reviews_limit'] = 5
                return result
            else:
                error_msg = result.get('error', 'Unknown error')
                print(f"  ❌ Failed with Amazon {country}: {error_msg}")
        
        # If all countries failed
        print(f"❌ All countries failed for ASIN: {asin}")
        return {
            "success": False,
            "error": f"Failed to fetch reviews from all countries: {', '.join(countries)}",
            "error_type": "all_countries_failed",
            "asin": asin,
            "countries_tried": countries,
            "max_reviews_limit": 5,
            "suggestion": "Try a different ASIN or check product availability"
        }
    
    def get_service_status(self) -> Dict[str, Any]:
        """Get status of Apify service."""
        if self.apify_service:
            return {
                "service": "apify",
                "status": "active",
                "max_reviews_limit": 5,
                "description": "Amazon reviews scraper using Apify"
            }
        else:
            return {
                "service": "apify",
                "status": "inactive",
                "error": "Apify service not initialized"
            }


# Singleton instance
amazon_scraper = AmazonScraper()