"""
Apify service for fetching real Amazon reviews.
Uses Apify's Amazon Product Reviews Scraper.
"""

import os
import requests
from typing import Dict, List, Any
from datetime import datetime
from bs4 import BeautifulSoup
import re
import time
from apify_client import ApifyClient
from app.utils.helpers import validate_asin


class ApifyService:
    """Fetch real Amazon reviews using Apify API."""
    
    def __init__(self):
        self.api_token = os.getenv('APIFY_API_TOKEN', '')
        
        if self.api_token:
            try:
                self.client = ApifyClient(self.api_token)
                # Test the client
                user = self.client.user().get()
                print(f"✅ Apify client initialized - User: {user.get('username', 'Unknown')}")
                self.is_free_tier = user.get('plan', {}).get('id') == 'FREE'
                if self.is_free_tier:
                    print("ℹ️  Using FREE Apify tier - some features may be limited")
            except Exception as e:
                print(f"⚠️  Apify client initialization failed: {e}")
                self.client = None
                self.is_free_tier = True
        else:
            self.client = None
            self.is_free_tier = True
            print("⚠️  Apify API token not found")
    
    def _asin_to_amazon_url(self, asin: str, country: str = "IN") -> str:
        """
        Convert ASIN to Amazon product URL.
        
        Args:
            asin: Product ASIN
            country: Country code for Amazon domain (US, IN, UK, etc.)
        
        Returns:
            Amazon product URL
        """
        country_domains = {
            "US": "amazon.com",
            "IN": "amazon.in", 
            "UK": "amazon.co.uk",
            "DE": "amazon.de",
            "FR": "amazon.fr",
            "IT": "amazon.it",
            "ES": "amazon.es",
            "CA": "amazon.ca",
            "JP": "amazon.co.jp",
            "AU": "amazon.com.au",
            "BR": "amazon.com.br",
            "MX": "amazon.com.mx"
        }
        
        domain = country_domains.get(country.upper(), "amazon.com")
        return f"https://www.{domain}/dp/{asin}"
    
    def _check_actor_availability(self, actor_id: str) -> bool:
        """Check if an actor is available and accessible."""
        try:
            actor_info = self.client.actor(actor_id).get()
            if actor_info and actor_info.get('isPublic', False):
                print(f"  ✅ Actor available: {actor_id} - {actor_info.get('name', 'Unknown')}")
                return True
            else:
                print(f"  ⚠️  Actor not public: {actor_id}")
                return False
        except Exception as e:
            print(f"  ❌ Actor not accessible: {actor_id} - {e}")
            return False
    
    def fetch_reviews(self, asin: str, max_reviews: int = 100, country: str = "IN") -> Dict[str, Any]:
        """
        Fetch real Amazon reviews using Apify.
        
        Args:
            asin: Product ASIN
            max_reviews: Maximum number of reviews to fetch
            country: Country code for Amazon domain (default: IN for India)
        
        Returns:
            Dict with reviews data
        """
        if not validate_asin(asin):
            return {
                "success": False,
                "error": f"Invalid ASIN format: {asin}",
                "error_type": "invalid_asin"
            }
        
        if not self.client:
            return {
                "success": False,
                "error": "Apify API not configured. Please set APIFY_API_TOKEN in .env file.",
                "error_type": "not_configured",
                "suggestion": "Add APIFY_API_TOKEN to your environment variables or enable mock data."
            }
        
        try:
            print(f"  📡 Fetching reviews from Apify for ASIN: {asin}, Country: {country}")
            
            # Convert ASIN to Amazon URL
            product_url = self._asin_to_amazon_url(asin, country)
            print(f"  🔗 Using product URL: {product_url}")
            
            # Use only the working actor that we confirmed exists
            actor_id = "junglee/amazon-reviews-scraper"
            
            # Check if actor is available
            if not self._check_actor_availability(actor_id):
                return {
                    "success": False,
                    "error": f"Apify actor '{actor_id}' is not available.",
                    "error_type": "actor_unavailable",
                    "asin": asin,
                    "suggestion": "Try a different actor or enable mock data for testing."
                }
            
            print(f"  🔄 Using actor: {actor_id}")
            
            # Prepare actor input - optimized for free tier
            actor_input = {
                "productUrls": [product_url],
                "maxReviews": min(max_reviews, 50) if self.is_free_tier else max_reviews,  # Limit for free tier
                "reviewsSort": "recent",
                "includeReviews": True,
                # Remove proxy for free tier to avoid limitations
            }
            
            # Only add proxy if not on free tier
            if not self.is_free_tier:
                actor_input["proxyConfig"] = {
                    "useApifyProxy": True
                }
            
            print(f"  ⏳ Running {actor_id} (this may take 1-3 minutes)...")
            
            # Run with appropriate timeout
            timeout = 180 if self.is_free_tier else 120  # Longer timeout for free tier
            run = self.client.actor(actor_id).call(
                run_input=actor_input,
                timeout_secs=timeout,
                wait_secs=10
            )
            
            print("  ✅ Actor execution completed, fetching results...")
            
            # Fetch results
            items = []
            try:
                dataset = self.client.dataset(run["defaultDatasetId"])
                for item in dataset.iterate_items():
                    items.append(item)
            except Exception as e:
                print(f"  ❌ Error fetching dataset: {e}")
                return {
                    "success": False,
                    "error": f"Failed to fetch results from Apify: {e}",
                    "error_type": "dataset_error",
                    "asin": asin
                }
            
            print(f"  📊 Received {len(items)} raw items from Apify")
            
            if not items:
                return {
                    "success": False,
                    "error": "Actor ran successfully but returned no review data.",
                    "error_type": "no_data",
                    "asin": asin,
                    "suggestion": "The product might not have reviews, or the actor couldn't extract them. Try a different ASIN."
                }
            
            # Parse reviews
            reviews = self._parse_apify_results(items, asin)
            
            print(f"  🔍 Successfully parsed {len(reviews)} reviews from {len(items)} items")
            
            if not reviews:
                return {
                    "success": False,
                    "error": "Could not extract any valid reviews from the response.",
                    "error_type": "parse_error",
                    "asin": asin,
                    "suggestion": "The review format might be different than expected. Try a popular product with reviews."
                }
            
            # Get product info
            product_title = self._extract_product_title(items, asin)
            
            print(f"  ✅ Successfully fetched {len(reviews)} reviews for '{product_title}'")
            
            return {
                "success": True,
                "asin": asin,
                "total_reviews": len(reviews),
                "reviews": reviews,
                "product_title": product_title,
                "average_rating": self._calculate_average_rating(reviews),
                "fetched_at": datetime.now().isoformat(),
                "mock_data": False,
                "source": "apify",
                "country": country,
                "is_free_tier": self.is_free_tier
            }
        
        except Exception as e:
            error_msg = str(e)
            print(f"  ❌ Apify error: {error_msg}")
            
            # Enhanced error detection
            error_lower = error_msg.lower()
            
            if "credit" in error_lower or "quota" in error_lower:
                error_type = "quota_exceeded"
                user_msg = "Apify free tier quota exceeded. Please upgrade your plan or use mock data."
            elif "timeout" in error_lower:
                error_type = "timeout"
                user_msg = "Request timeout - Apify is taking too long. Please try again with a simpler request."
            elif "not found" in error_lower or "404" in error_msg:
                error_type = "not_found"
                user_msg = "Product not found or has no reviews in the specified region."
            elif "actor" in error_lower and "not found" in error_lower:
                error_type = "actor_not_found"
                user_msg = "Apify actor not available with your current plan."
            elif "forbidden" in error_lower or "permission" in error_lower:
                error_type = "permission_denied"
                user_msg = "Permission denied. This actor may not be available on the free tier."
            elif "payment" in error_lower or "billing" in error_lower:
                error_type = "billing_issue"
                user_msg = "Billing issue. Please check your Apify account."
            else:
                error_type = "unknown"
                user_msg = f"Failed to fetch reviews: {error_msg}"
            
            suggestion = "Try enabling mock data for development, or upgrade your Apify plan for production use."
            if self.is_free_tier:
                suggestion = "Free tier limitations detected. Enable mock data or upgrade to a paid plan."
            
            return {
                "success": False,
                "error": user_msg,
                "error_type": error_type,
                "error_detail": error_msg,
                "asin": asin,
                "suggestion": suggestion,
                "is_free_tier": self.is_free_tier
            }
    
    def _extract_product_title(self, items: List[Dict], asin: str) -> str:
        """Extract product title from Apify results."""
        for item in items:
            # Try different possible title fields
            title = item.get('productTitle') or item.get('title') or item.get('productName')
            if title and isinstance(title, str) and title.strip():
                return title.strip()
        
        # Fallback title
        return f"Product {asin}"
    
    def _parse_apify_results(self, items: List[Dict], asin: str) -> List[Dict]:
        """Parse Apify results into our review format."""
        reviews = []
        
        for idx, item in enumerate(items):
            try:
                # Skip non-review items (look for review-specific fields)
                has_review_data = (
                    item.get('reviewId') or 
                    item.get('text') or 
                    item.get('reviewText') or 
                    item.get('rating') or
                    item.get('reviewTitle')
                )
                
                if not has_review_data:
                    continue
                
                # Extract rating - handle different possible formats
                rating = 0.0
                rating_text = item.get('rating', '')
                if rating_text:
                    if isinstance(rating_text, (int, float)):
                        rating = float(rating_text)
                    else:
                        # Handle string ratings like "4.0 out of 5 stars"
                        rating_match = re.search(r'(\d+\.?\d*)', str(rating_text))
                        if rating_match:
                            rating = float(rating_match.group(1))
                
                # Skip if no valid rating
                if rating <= 0:
                    continue
                
                # Parse date
                review_date = item.get('date', '')
                if isinstance(review_date, dict):
                    review_date = review_date.get('text', '')
                
                # Get review text from different possible fields
                review_text = (
                    item.get('text', '') or 
                    item.get('reviewText', '') or 
                    item.get('content', '') or 
                    item.get('reviewBody', '')
                ).strip()
                
                # Skip if no review text
                if not review_text:
                    continue
                
                review = {
                    'review_id': item.get('reviewId', f'{asin}_{idx}'),
                    'asin': asin,
                    'rating': rating,
                    'review_text': review_text,
                    'review_title': item.get('title', item.get('reviewTitle', '')).strip(),
                    'review_date': review_date,
                    'verified_purchase': bool(item.get('verified', False)),
                    'helpful_votes': item.get('helpful', {}).get('count', 0) if isinstance(item.get('helpful'), dict) else 0,
                    'reviewer_name': item.get('reviewerName', ''),
                    'reviewer_id': item.get('reviewerId', '')
                }
                
                reviews.append(review)
            
            except Exception as e:
                print(f"  ⚠️  Error parsing item {idx}: {e}")
                continue
        
        return reviews
    
    def _calculate_average_rating(self, reviews: List[Dict]) -> float:
        """Calculate average rating from reviews."""
        if not reviews:
            return 0.0
        
        total = sum(review['rating'] for review in reviews)
        return round(total / len(reviews), 2)
    
    def test_connection(self) -> Dict[str, Any]:
        """Test Apify connection and available features."""
        if not self.client:
            return {
                "success": False,
                "error": "Apify client not initialized"
            }
        
        try:
            user = self.client.user().get()
            return {
                "success": True,
                "user": user.get('username'),
                "plan": user.get('plan', {}).get('id'),
                "is_free_tier": self.is_free_tier,
                "message": "Apify connection successful"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Singleton instance
apify_service = ApifyService()