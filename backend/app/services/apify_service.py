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
        """Prepare input for Apify actor - EXACTLY matching the required format"""
        amazon_url = self._get_amazon_url(asin, country)
        
        # CRITICAL: Match the exact structure from your JSON input
        return {
            "productUrls": [{"url": amazon_url}],
            "maxReviews": min(max_reviews, settings.MAX_REVIEWS_PER_REQUEST),
            "filterByRatings": ["allStars"],
            "scrapeProductDetails": True,
            "includeGdprSensitive": False,
            "reviewsUseProductVariantFilter": False,
            "reviewsAlwaysSaveCategoryData": False,
            "deduplicateRedirectedAsins": True
        }
    
    def _transform_review(self, review_data: Dict) -> Optional[Dict]:
        """Transform Apify review data to our format"""
        try:
            # Handle rating
            rating_str = review_data.get("reviewRating", review_data.get("stars", "0"))
            if isinstance(rating_str, str):
                # Extract number from strings like "5.0 out of 5 stars"
                rating = float(rating_str.split()[0])
            else:
                rating = float(rating_str)
            
            # Handle date
            date_str = review_data.get("reviewDate", "")
            try:
                if "on" in date_str:
                    date_str = date_str.split("on")[-1].strip()
                review_date = datetime.strptime(date_str, "%B %d, %Y").isoformat()
            except:
                review_date = datetime.now().isoformat()
            
            return {
                "id": review_data.get("id", review_data.get("reviewId", "")),
                "title": review_data.get("reviewTitle", review_data.get("title", "")),
                "text": review_data.get("reviewDescription", review_data.get("reviewText", review_data.get("text", ""))),
                "rating": rating,
                "author": review_data.get("reviewAuthor", review_data.get("profileName", "Anonymous")),
                "date": review_date,
                "verified": review_data.get("isVerified", review_data.get("verified_purchase", False)),
                "helpful_count": review_data.get("helpfulCount", review_data.get("helpful", 0)),
                "images": review_data.get("reviewImages", review_data.get("images", [])),
                "variant": review_data.get("variant", ""),
                "country": review_data.get("country", ""),
                "source": "apify"
            }
        except Exception as e:
            print(f"⚠️ Error transforming review: {e}")
            return None
    
    def _wait_for_run(self, run_id: str) -> Dict:
        """Wait for Apify actor run with robust error handling"""
        print(f"  ⏳ Waiting for Apify run to complete...")
        
        run_client = self.client.run(run_id)
        start_time = time.time()
        retry_count = 0
        max_retries = 3
        
        while time.time() - start_time < self.timeout:
            try:
                run_info = run_client.get()
                
                if not run_info or not isinstance(run_info, dict):
                    print(f"  ⚠️  Empty response (retry {retry_count + 1}/{max_retries})")
                    retry_count += 1
                    if retry_count >= max_retries:
                        return {"status": "FAILED", "error": "Empty response from Apify"}
                    time.sleep(5)
                    continue
                
                status = run_info.get("status", "UNKNOWN")
                
                if status in ["SUCCEEDED", "FAILED", "TIMED_OUT", "ABORTED"]:
                    if status == "SUCCEEDED":
                        print(f"  ✅ Run completed successfully")
                    else:
                        error_msg = run_info.get("error", {}).get("message", "Unknown error") if isinstance(run_info.get("error"), dict) else str(run_info.get("error", "Unknown error"))
                        print(f"  ❌ Run failed: {status} - {error_msg}")
                    return run_info
                
                elapsed = int(time.time() - start_time)
                if elapsed % 10 == 0:
                    print(f"  🔄 Status: {status} ({elapsed}s)")
                
                retry_count = 0
                time.sleep(5)
                
            except json.JSONDecodeError as e:
                print(f"  ⚠️  JSON decode error: {e}")
                retry_count += 1
                if retry_count >= max_retries:
                    return {"status": "FAILED", "error": "JSON parse error after retries"}
                time.sleep(5)
                continue
                
            except Exception as e:
                print(f"  ⚠️  Unexpected error: {type(e).__name__} - {e}")
                retry_count += 1
                if retry_count >= max_retries:
                    return {"status": "FAILED", "error": f"Connection error: {str(e)}"}
                time.sleep(5)
                continue
        
        return {"status": "TIMED_OUT", "error": f"Timeout after {self.timeout}s"}

    def fetch_reviews(self, asin: str, max_reviews: int = 50, country: str = "US") -> Dict[str, Any]:
        """Fetch reviews from Amazon using Apify"""
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
            
            # Prepare input matching exact Apify format
            actor_input = self._prepare_actor_input(asin, max_reviews, country)
            
            # Debug: Print the input being sent
            print(f"  📋 Actor input: {json.dumps(actor_input, indent=2)}")
            
            # Start the actor with correct parameter name
            print(f"  🚀 Starting Apify actor: {self.actor_id}")
            run = self.client.actor(self.actor_id).call(
                run_input=actor_input,  # This is correct
                wait_secs=0
            )
            
            # Wait for completion
            run_info = self._wait_for_run(run["id"])
            
            if run_info.get("status") != "SUCCEEDED":
                error_msg = run_info.get("error", "Unknown error")
                if isinstance(error_msg, dict):
                    error_msg = error_msg.get("message", "Unknown error")
                print(f"  ❌ Apify run failed: {error_msg}")
                return {
                    "success": False,
                    "error": f"Apify run failed: {error_msg}",
                    "reviews": [],
                    "total_reviews": 0
                }
            
            # Fetch results
            print("  📊 Fetching results from dataset...")
            dataset_client = self.client.dataset(run["defaultDatasetId"])
            items = list(dataset_client.iterate_items())
            
            print(f"  📦 Retrieved {len(items)} items from dataset")
            
            if not items:
                print("  ⚠️ No data returned")
                return {
                    "success": False,
                    "error": "No data from Apify",
                    "reviews": [],
                    "total_reviews": 0
                }
            
            # Extract product info and reviews
            all_reviews = []
            product_info = {}
            
            for item in items:
                # Extract product info from first item
                if not product_info:
                    product_info = {
                        "title": item.get("productTitle", item.get("title", "")),
                        "brand": item.get("brand", ""),
                        "price": item.get("price", ""),
                        "image": item.get("thumbnailImage", item.get("image", "")),
                        "rating": item.get("averageRating", item.get("stars", 0)),
                        "total_reviews": item.get("totalReviews", item.get("reviewsCount", 0)),
                        "asin": item.get("asin", asin)
                    }
                
                # Check if this item contains review data
                if "reviewTitle" in item or "reviewDescription" in item or "reviewText" in item:
                    transformed = self._transform_review(item)
                    if transformed:
                        all_reviews.append(transformed)
            
            print(f"  📝 Extracted {len(all_reviews)} reviews")
            
            if not all_reviews:
                print("  ⚠️ No reviews extracted from dataset")
                return {
                    "success": False,
                    "error": "No reviews found in response",
                    "reviews": [],
                    "total_reviews": 0,
                    "product_info": product_info
                }
            
            # Calculate statistics
            ratings = [r["rating"] for r in all_reviews]
            rating_distribution = {
                "5": len([r for r in ratings if r >= 4.5]),
                "4": len([r for r in ratings if 3.5 <= r < 4.5]),
                "3": len([r for r in ratings if 2.5 <= r < 3.5]),
                "2": len([r for r in ratings if 1.5 <= r < 2.5]),
                "1": len([r for r in ratings if r < 1.5])
            }
            average_rating = sum(ratings) / len(ratings) if ratings else 0
            
            print(f"  ✅ Successfully fetched {len(all_reviews)} reviews")
            
            return {
                "success": True,
                "asin": asin,
                "country": country,
                "product_info": product_info,
                "reviews": all_reviews[:max_reviews],
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
            import traceback
            traceback.print_exc()
            return {
                "success": False,
                "error": str(e),
                "reviews": [],
                "total_reviews": 0
            }
    
    def fetch_multi_country(self, asin: str, max_reviews: int = 50, 
                           countries: List[str] = None) -> Dict[str, Any]:
        """Fetch reviews from multiple countries"""
        if not countries:
            countries = ["US", "UK", "DE", "CA"]
        
        print(f"\n🌍 Multi-country fetch for ASIN: {asin}")
        
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
        
        # Calculate aggregate statistics
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
        
        print(f"\n✅ Multi-country complete: {len(all_reviews)} total reviews")
        
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
