"""
Main scraper interface - Apify Only.
Fetches maximum 5 reviews.
"""

import os
from typing import Dict, List, Any, Optional
from app.services.amazon_scraper import amazon_scraper


class ReviewScraper:
    """Main scraper class - Apify Only."""
    
    def __init__(self):
        self.amazon_scraper = amazon_scraper
        print("✅ ReviewScraper initialized - Apify Only")
        print("🎯 Maximum 5 reviews per request")
    
    def fetch_by_keyword(self, keyword: str, limit: int = 5, country: str = "US") -> Dict[str, Any]:
        """
        Fetch reviews by keyword.
        MAX 5 REVIEWS ONLY.
        """
        print(f"🔍 Searching for products with keyword: '{keyword}'")
        
        # Product search not implemented - use ASIN or URL instead
        return {
            "success": True,
            "keyword": keyword,
            "products_found": 0,
            "reviews": [],
            "max_reviews_limit": 5,
            "message": "Product search by keyword is not implemented. Use ASIN or product URL instead.",
            "suggestion": "Use fetch_by_asin() or fetch_by_url() with specific product identifiers"
        }
    
    def fetch_by_asin(self, asin: str, max_reviews: int = 5, country: str = "IN", multi_country: bool = True) -> Dict[str, Any]:
        """
        Fetch reviews by ASIN using Apify.
        MAX 5 REVIEWS ONLY.
        """
        # Enforce maximum 5 reviews
        actual_max_reviews = min(max_reviews, 5)
        if max_reviews > 5:
            print(f"⚠️  Limiting to 5 reviews (requested: {max_reviews})")
        
        return self.amazon_scraper.fetch_reviews(asin, actual_max_reviews, country, multi_country)
    
    def fetch_by_url(self, url: str, max_reviews: int = 5, country: str = "IN", multi_country: bool = True) -> Dict[str, Any]:
        """
        Fetch reviews by product URL using Apify.
        MAX 5 REVIEWS ONLY.
        """
        # Enforce maximum 5 reviews
        actual_max_reviews = min(max_reviews, 5)
        if max_reviews > 5:
            print(f"⚠️  Limiting to 5 reviews (requested: {max_reviews})")
        
        return self.amazon_scraper.fetch_reviews(url, actual_max_reviews, country, multi_country)
    
    def get_service_status(self) -> Dict[str, Any]:
        """
        Get status of scraping service.
        """
        return {
            "service": "apify_only",
            "max_reviews_limit": 5,
            "status": self.amazon_scraper.get_service_status()
        }
    
    def test_service(self, test_asin: str = "B08N5WRWNW") -> Dict[str, Any]:
        """
        Test Apify service with a test ASIN.
        MAX 5 REVIEWS ONLY.
        """
        print(f"🧪 Testing Apify service with ASIN: {test_asin}")
        
        result = self.fetch_by_asin(test_asin, 5, "US", False)
        
        return {
            "test_asin": test_asin,
            "max_reviews_limit": 5,
            "success": result.get('success', False),
            "reviews_count": result.get('total_reviews', 0),
            "error": result.get('error'),
            "api_source": result.get('api_source', 'apify')
        }


# Singleton instance
review_scraper = ReviewScraper()