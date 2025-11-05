"""
Enhanced Apify Service for Amazon Reviews
Supports multi-country fetching with proper error handling and fallbacks
"""

import os
import time
import json
from typing import Dict, List, Any, Optional
from datetime import datetime
from apify_client import ApifyClient
from app.core.config import settings


class ApifyService:
    """Enhanced Apify service for fetching Amazon reviews"""
    
    def __init__(self):
        self.api_token = settings.APIFY_API_TOKEN
        self.actor_id = settings.APIFY_ACTOR_ID
        self.timeout = settings.APIFY_TIMEOUT_SECONDS
        self.client = None
        
        if self.api_token:
            try:
                self.client = ApifyClient(self.api_token)
                print("✅ Apify service initialized")
            except Exception as e:
                print(f"❌ Apify initialization failed: {e}")
                self.client = None
        else:
            print("⚠️ APIFY_API_TOKEN not configured")
    
    def get_service_status(self) -> Dict[str, Any]:
        """Check if Apify service is available"""
        if not self.client:
            return {
                "available": False,
                "error": "Apify client not initialized"
            }
        
        try:
            # Try to get user info as a health check
            user = self.client.user().get()
            return {
                "available": True,
                "user": user.get("username", "unknown"),
                "plan": user.get("plan", {}).get("name", "unknown")
            }
        except Exception as e:
            return {
                "available": False,
                "error": str(e)
            }
    
    def _get_amazon_url(self, asin: str, country: str = "US") -> str:
        """Convert ASIN and country to Amazon URL"""
        country_domains = {
            "US": "amazon.com",
            "UK": "amazon.co.uk",
            "DE": "amazon.de",
            "FR": "amazon.fr",
            "ES": "amazon.es",
            "IT": "amazon.it",
            "CA": "amazon.ca",
            "IN": "amazon.in",
            "JP": "amazon.co.jp",
            "AU": "amazon.com.au",
            "BR": "amazon.com.br",
            "MX": "amazon.com.mx",
            "AE": "amazon.ae",
            "SG": "amazon.sg",
            "NL": "amazon.nl",
            "SE": "amazon.se"
        }
        
        domain = country_domains.get(country.upper(), "amazon.com")
        return f"https://www.{domain}/dp/{asin}"
    
    def _prepare_actor_input(self, asin: str, max_reviews: int, country: str) -> Dict:
        """Prepare input for Apify actor"""
        amazon_url = self._get_amazon_url(asin, country)
        
        return {
            "productUrls": [{"url": amazon_url}],
            "maxReviews": min(max_reviews, settings.MAX_REVIEWS_PER_REQUEST),
            "sort": "recent",
            "filterByRatings": ["allStars"],
            "includeGdprSensitive": False,
            "scrapeProductDetails": True,
            "reviewsUseProductVariantFilter": False,
            "deduplicateRedirectedAsins": True
        }
    
    def _transform_review(self, review_data: Dict) -> Dict:
        """Transform Apify review data to our format"""
        try:
            # Extract rating value
            rating_str = review_data.get("reviewRating", "0")
            rating = float(rating_str.split()[0] if isinstance(rating_str, str) else rating_str)
            
            # Parse date
            date_str = review_data.get("reviewDate", "")
            try:
                if "on" in date_str:
                    date_str = date_str.split("on")[-1].strip()
                review_date = datetime.strptime(date_str, "%B %d, %Y").isoformat()
            except:
                review_date = datetime.now().isoformat()
            
            return {
                "id": review_data.get("id", ""),
                "title": review_data.get("reviewTitle", ""),
                "text": review_data.get("reviewDescription", ""),
                "rating": rating,
                "author": review_data.get("reviewAuthor", "Anonymous"),
                "date": review_date,
                "verified": review_data.get("isVerified", False),
                "helpful_count": review_data.get("helpfulCount", 0),
                "images": review_data.get("reviewImages", []),
                "variant": review_data.get("variant", ""),
                "country": review_data.get("country", ""),
                "source": "apify"
            }
        except Exception as e:
            print(f"⚠️ Error transforming review: {e}")
            return None
    
    def _wait_for_run(self, run_id: str) -> Dict:
        """Wait for Apify actor run to complete"""
        print(f"  ⏳ Waiting for Apify run to complete...")
        
        run_client = self.client.run(run_id)
        start_time = time.time()
        
        while time.time() - start_time < self.timeout:
            run_info = run_client.get()
            status = run_info.get("status")
            
            if status in ["SUCCEEDED", "FAILED", "TIMED_OUT", "ABORTED"]:
                return run_info
            
            # Show progress
            elapsed = int(time.time() - start_time)
            if elapsed % 10 == 0:
                print(f"  🔄 Status: {status} ({elapsed}s elapsed)")
            
            time.sleep(5)
        
        return {"status": "TIMED_OUT", "error": "Timeout waiting for results"}
    
    def fetch_reviews(self, asin: str, max_reviews: int = 50, country: str = "US") -> Dict[str, Any]:
        """
        Fetch reviews from Amazon using Apify
        
        Args:
            asin: Amazon product ASIN
            max_reviews: Maximum number of reviews to fetch
            country: Country code for Amazon marketplace
        
        Returns:
            Dict containing review data and metadata
        """
        if not self.client:
            return {
                "success": False,
                "error": "Apify client not initialized",
                "reviews": [],
                "total_reviews": 0
            }
        
        try:
            print(f"\n📡 Fetching reviews from Apify for ASIN: {asin}")
            print(f"   Country: {country}, Max: {max_reviews}")
            
            # Prepare actor input
            actor_input = self._prepare_actor_input(asin, max_reviews, country)
            
            # Start the actor
            print(f"  🚀 Starting Apify actor: {self.actor_id}")
            run = self.client.actor(self.actor_id).call(
                run_input=actor_input,
                wait_secs=0  # Don't wait, we'll poll manually
            )
            
            # Wait for completion
            run_info = self._wait_for_run(run["id"])
            
            if run_info.get("status") != "SUCCEEDED":
                error_msg = run_info.get("error", {}).get("message", "Unknown error")
                print(f"  ❌ Apify run failed: {error_msg}")
                return {
                    "success": False,
                    "error": f"Apify run failed: {error_msg}",
                    "reviews": [],
                    "total_reviews": 0
                }
            
            # Get results from dataset
            print("  📊 Fetching results from dataset...")
            dataset_client = self.client.dataset(run["defaultDatasetId"])
            items = list(dataset_client.iterate_items())
            
            if not items:
                print("  ⚠️ No data returned from Apify")
                return {
                    "success": False,
                    "error": "No data returned from Apify",
                    "reviews": [],
                    "total_reviews": 0
                }
            
            # Process results
            all_reviews = []
            product_info = {}
            
            for item in items:
                # Extract product info
                if not product_info and "productTitle" in item:
                    product_info = {
                        "title": item.get("productTitle", ""),
                        "brand": item.get("brand", ""),
                        "price": item.get("price", ""),
                        "image": item.get("thumbnailImage", ""),
                        "rating": item.get("averageRating", 0),
                        "total_reviews": item.get("totalReviews", 0),
                        "asin": item.get("asin", asin)
                    }
                
                # Extract reviews
                reviews_in_item = item.get("reviews", [])
                for review_data in reviews_in_item:
                    transformed = self._transform_review(review_data)
                    if transformed:
                        all_reviews.append(transformed)
            
            # Calculate statistics
            if all_reviews:
                ratings = [r["rating"] for r in all_reviews]
                rating_distribution = {
                    "5": len([r for r in ratings if r >= 4.5]),
                    "4": len([r for r in ratings if 3.5 <= r < 4.5]),
                    "3": len([r for r in ratings if 2.5 <= r < 3.5]),
                    "2": len([r for r in ratings if 1.5 <= r < 2.5]),
                    "1": len([r for r in ratings if r < 1.5])
                }
                average_rating = sum(ratings) / len(ratings) if ratings else 0
            else:
                rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
                average_rating = 0
            
            print(f"  ✅ Successfully fetched {len(all_reviews)} reviews")
            
            return {
                "success": True,
                "asin": asin,
                "country": country,
                "product_info": product_info,
                "reviews": all_reviews[:max_reviews],  # Limit to requested amount
                "total_reviews": len(all_reviews),
                "average_rating": round(average_rating, 2),
                "rating_distribution": rating_distribution,
                "metadata": {
                    "source": "apify",
                    "actor": self.actor_id,
                    "timestamp": datetime.utcnow().isoformat(),
                    "run_id": run["id"]
                }
            }
            
        except Exception as e:
            print(f"  ❌ Apify error: {e}")
            return {
                "success": False,
                "error": str(e),
                "reviews": [],
                "total_reviews": 0
            }
    
    def fetch_multi_country(self, asin: str, max_reviews: int = 50, 
                           countries: List[str] = None) -> Dict[str, Any]:
        """
        Fetch reviews from multiple countries and combine results
        
        Args:
            asin: Product ASIN
            max_reviews: Max reviews per country
            countries: List of country codes (default: ["US", "UK", "DE", "CA"])
        
        Returns:
            Combined review data from all countries
        """
        if not countries:
            countries = ["US", "UK", "DE", "CA"]
        
        print(f"\n🌍 Multi-country fetch for ASIN: {asin}")
        print(f"   Countries: {', '.join(countries)}")
        
        all_reviews = []
        successful_countries = []
        failed_countries = []
        product_info = {}
        
        for country in countries:
            print(f"\n  🔍 Trying {country}...")
            result = self.fetch_reviews(asin, max_reviews, country)
            
            if result.get("success") and result.get("reviews"):
                # Add country tag to each review
                for review in result["reviews"]:
                    review["country"] = country
                
                all_reviews.extend(result["reviews"])
                successful_countries.append(country)
                
                # Use first successful product info
                if not product_info and result.get("product_info"):
                    product_info = result["product_info"]
                
                print(f"  ✅ {country}: {len(result['reviews'])} reviews")
            else:
                failed_countries.append(country)
                print(f"  ❌ {country}: {result.get('error', 'No data')}")
        
        # Calculate combined statistics
        if all_reviews:
            ratings = [r["rating"] for r in all_reviews]
            rating_distribution = {
                "5": len([r for r in ratings if r >= 4.5]),
                "4": len([r for r in ratings if 3.5 <= r < 4.5]),
                "3": len([r for r in ratings if 2.5 <= r < 3.5]),
                "2": len([r for r in ratings if 1.5 <= r < 2.5]),
                "1": len([r for r in ratings if r < 1.5])
            }
            average_rating = sum(ratings) / len(ratings) if ratings else 0
        else:
            rating_distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
            average_rating = 0
        
        print(f"\n✅ Multi-country fetch complete:")
        print(f"   Successful: {', '.join(successful_countries) if successful_countries else 'None'}")
        print(f"   Failed: {', '.join(failed_countries) if failed_countries else 'None'}")
        print(f"   Total reviews: {len(all_reviews)}")
        
        return {
            "success": len(all_reviews) > 0,
            "asin": asin,
            "countries_searched": countries,
            "successful_countries": successful_countries,
            "failed_countries": failed_countries,
            "product_info": product_info,
            "reviews": all_reviews,
            "total_reviews": len(all_reviews),
            "average_rating": round(average_rating, 2),
            "rating_distribution": rating_distribution,
            "metadata": {
                "source": "apify_multi_country",
                "timestamp": datetime.utcnow().isoformat()
            }
        }


# Singleton instance
apify_service = ApifyService()