"""
Apify service for Amazon reviews scraping.
Updated to return field names that match analyzer expectations.
"""

import os
import time
import json
from typing import Dict, List, Any
from apify_client import ApifyClient


class ApifyService:
    """Service for fetching Amazon reviews using Apify actors."""
    
    def __init__(self):
        # Use the working API key
        self.api_token = os.getenv('APIFY_API_TOKEN')
        if not self.api_token:
            print("❌ APIFY_API_TOKEN not found in environment variables")
            raise ValueError("APIFY_API_TOKEN environment variable is required")
        
        self.client = ApifyClient(self.api_token)
        # Only use the junglee actor
        self.actors_to_try = [
            "junglee/amazon-reviews-scraper"
        ]
        print("✅ Apify service initialized - Max 5 reviews per request")
    
    def _get_amazon_url(self, asin: str, country: str = "US") -> str:
        """Convert ASIN and country to proper Amazon URL."""
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
    
    def _get_junglee_actor_input(self, asin: str, max_reviews: int, country: str) -> Dict:
        """Get the correct input format for junglee/amazon-reviews-scraper."""
        amazon_url = self._get_amazon_url(asin, country)
        
        # MAX 5 REVIEWS ONLY
        actual_max_reviews = min(max_reviews, 5)
        
        return {
            "productUrls": [{"url": amazon_url}],
            "maxReviews": actual_max_reviews,  # MAX 5 REVIEWS
            "sort": "recent",  # Get most recent reviews
            "filterByRatings": ["allStars"],
            "includeGdprSensitive": False,
            "reviewsUseProductVariantFilter": False,
            "scrapeProductDetails": True,
            "reviewsAlwaysSaveCategoryData": False,
            "deduplicateRedirectedAsins": True
        }
    
    def _debug_raw_data(self, items: List[Dict]):
        """Debug function to see what data Apify is returning."""
        print(f"  🔍 DEBUG: Analyzing {len(items)} raw items from Apify")
        
        if not items:
            print("  ❌ DEBUG: No items returned from Apify")
            return
            
        # Print first item structure for debugging
        first_item = items[0]
        print(f"  📋 DEBUG: First item keys: {list(first_item.keys())}")
        
        # Check if there's review data in different possible locations
        if 'review' in first_item:
            review_data = first_item.get('review', {})
            print(f"  📋 DEBUG: Review keys: {list(review_data.keys())}")
            if review_data:
                print(f"  📋 DEBUG: Sample review text: {review_data.get('text', 'No text')[:100]}...")
        
        # Print all keys to see what's available
        all_keys = set()
        for item in items:
            all_keys.update(item.keys())
        print(f"  📋 DEBUG: All keys in items: {all_keys}")
    
    def _transform_junglee_reviews(self, items: List[Dict]) -> List[Dict]:
        """Transform junglee actor results to standard review format."""
        reviews = []
        
        print(f"  🔍 Transforming {len(items)} raw items...")
        
        # DEBUG: Show what we're working with
        self._debug_raw_data(items)
        
        for i, item in enumerate(items):
            print(f"  🔍 Processing item {i+1}")
            
            # Try different possible review data locations
            review_data = None
            
            # Option 1: Direct review object (junglee format)
            if 'review' in item and isinstance(item['review'], dict):
                review_data = item['review']
                print(f"    ✅ Found review in 'review' key")
                
            # Option 2: Item itself might be a review
            elif any(key in item for key in ['reviewText', 'reviewTitle', 'rating', 'reviewId']):
                review_data = item
                print(f"    ✅ Found review data in item itself")
                
            # Option 3: Check for nested structures
            elif 'data' in item and isinstance(item['data'], dict):
                if 'review' in item['data']:
                    review_data = item['data']['review']
                    print(f"    ✅ Found review in 'data.review'")
                    
            # Option 4: Check for reviews array
            elif 'reviews' in item and isinstance(item['reviews'], list):
                if item['reviews']:
                    review_data = item['reviews'][0]
                    print(f"    ✅ Found review in 'reviews' array")
            
            if not review_data:
                print(f"    ❌ No review data found in item {i+1}")
                print(f"    📋 Available keys: {list(item.keys())}")
                continue
            
            # Extract review information - USE FIELD NAMES THAT ANALYZER EXPECTS
            try:
                # Get the text content from various possible fields
                review_text = (review_data.get("text") or 
                             review_data.get("reviewText") or 
                             review_data.get("content") or 
                             review_data.get("body") or 
                             "")
                
                # Get the title from various possible fields
                review_title = (review_data.get("title") or 
                              review_data.get("reviewTitle") or 
                              review_data.get("summary") or 
                              "")
                
                # Create review with FIELD NAMES THAT MATCH ANALYZER EXPECTATIONS
                review = {
                    # Required by analyzer
                    "review_text": review_text,  # ANALYZER EXPECTS THIS NAME
                    "rating": review_data.get("rating") or 
                             review_data.get("starRating") or 
                             review_data.get("stars") or 
                             0,
                    "review_date": review_data.get("date") or 
                                 review_data.get("reviewDate") or 
                                 review_data.get("timestamp") or 
                                 "",
                    
                    # Additional fields for analyzer insights
                    "verified_purchase": review_data.get("verified") or 
                                        review_data.get("verifiedPurchase") or 
                                        False,
                    
                    # Original fields for reference
                    "id": review_data.get("reviewId") or 
                          review_data.get("id") or 
                          f"review_{i}_{hash(str(review_data))}",
                    "title": review_title,
                    "text": review_text,  # Keep original field for compatibility
                    "author": review_data.get("author") or 
                             review_data.get("reviewer") or 
                             review_data.get("user") or 
                             "",
                    "helpful_votes": review_data.get("helpfulVotes") or 
                                    review_data.get("helpful") or 
                                    review_data.get("upvotes") or 
                                    0,
                    "country": item.get("country") or 
                              review_data.get("country") or 
                              "",
                    "product_asin": item.get("asin") or 
                                   review_data.get("asin") or 
                                   "",
                    "source": "apify"
                }
                
                # Clean up the data
                review["review_text"] = str(review["review_text"]).strip() if review["review_text"] else ""
                review["title"] = str(review["title"]).strip() if review["title"] else ""
                
                # Ensure rating is numeric
                try:
                    review["rating"] = float(review["rating"])
                except (ValueError, TypeError):
                    review["rating"] = 0
                
                # Only add if we have basic review data
                has_content = bool(review["review_text"] or review["title"])
                has_rating = bool(review["rating"])
                
                if has_content or has_rating:
                    print(f"    ✅ Added review: {review['rating']}⭐ - {review['review_text'][:50]}...")
                    reviews.append(review)
                else:
                    print(f"    ⚠️ Skipped - no content or rating")
                    
            except Exception as e:
                print(f"    ❌ Error transforming review {i+1}: {e}")
                print(f"    📋 Problematic data: {review_data}")
                continue
        
        print(f"  ✅ Successfully transformed {len(reviews)} reviews")
        return reviews
    
    def _wait_for_run_completion(self, run_id: str, timeout_seconds: int = 300) -> Dict:
        """Wait for Apify run to complete with polling."""
        print(f"  ⏳ Waiting for run completion...")
        
        start_time = time.time()
        run_client = self.client.run(run_id)
        
        while time.time() - start_time < timeout_seconds:
            run_info = run_client.get()
            status = run_info.get('status')
            
            if status in ['SUCCEEDED', 'FAILED', 'TIMED_OUT', 'ABORTED']:
                return run_info
            
            # Show progress every 10 seconds
            elapsed = int(time.time() - start_time)
            if elapsed % 10 == 0:
                print(f"  🔄 Run status: {status} (elapsed: {elapsed}s)")
            
            time.sleep(5)  # Check every 5 seconds
        
        # Timeout reached
        return {'status': 'TIMED_OUT', 'errorMessage': 'Run timeout reached'}
    
    def fetch_reviews(self, asin: str, max_reviews: int = 5, country: str = "US") -> Dict[str, Any]:
        """
        Fetch Amazon reviews using Apify actors.
        MAX 5 REVIEWS ONLY.
        """
        print(f"🔍 Apify: Fetching MAX 5 reviews for ASIN {asin} from Amazon {country}")
        
        # Enforce maximum 5 reviews
        actual_max_reviews = min(max_reviews, 5)
        if max_reviews > 5:
            print(f"⚠️  Limiting to 5 reviews (requested: {max_reviews})")
        
        # Test token validity first
        try:
            user = self.client.user().get()
            print(f"✅ Apify token valid - User: {user.get('username')}")
        except Exception as e:
            error_msg = f"Apify token invalid: {str(e)}"
            print(f"❌ {error_msg}")
            return {
                "success": False,
                "error": error_msg,
                "error_type": "invalid_token"
            }
        
        for actor_id in self.actors_to_try:
            try:
                print(f"  🚀 Using actor: {actor_id}")
                
                run_input = self._get_junglee_actor_input(asin, actual_max_reviews, country)
                
                print(f"  📝 Requesting {actual_max_reviews} reviews from: {run_input['productUrls'][0]['url']}")
                
                # Run the actor
                run = self.client.actor(actor_id).call(run_input=run_input)
                run_id = run['id']
                print(f"  ✅ Run started: {run_id}")
                
                # Wait for completion
                run_info = self._wait_for_run_completion(run_id)
                
                if run_info['status'] == 'SUCCEEDED':
                    print(f"  🎉 Scraping completed successfully!")
                    
                    # Get results
                    dataset_client = self.client.dataset(run_info['defaultDatasetId'])
                    items = dataset_client.list_items().items
                    
                    print(f"  📊 Retrieved {len(items)} raw items")
                    
                    # Save raw data for debugging
                    if items:
                        with open(f'debug_apify_raw_{asin}_{country}.json', 'w', encoding='utf-8') as f:
                            json.dump(items, f, indent=2, ensure_ascii=False)
                        print(f"  💾 Saved raw data to: debug_apify_raw_{asin}_{country}.json")
                    
                    reviews = self._transform_junglee_reviews(items)
                    print(f"  ✅ Found {len(reviews)} reviews")
                    
                    if reviews:
                        # Extract product info
                        product_info = {}
                        if items:
                            first_item = items[0]
                            # Try to get product info from different locations
                            if 'product' in first_item and isinstance(first_item['product'], dict):
                                product_info = {
                                    "title": first_item['product'].get("title", ""),
                                    "asin": first_item['product'].get("asin", asin),
                                    "rating": first_item['product'].get("rating"),
                                    "total_reviews": first_item['product'].get("totalReviews"),
                                    "price": first_item['product'].get("price")
                                }
                            else:
                                # Fallback: get from item itself
                                product_info = {
                                    "title": first_item.get("productTitle", ""),
                                    "asin": first_item.get("asin", asin),
                                    "rating": first_item.get("productRating"),
                                    "total_reviews": first_item.get("totalReviews"),
                                }
                        
                        return {
                            "success": True,
                            "reviews": reviews[:5],  # Ensure max 5 reviews
                            "total_reviews": min(len(reviews), 5),
                            "asin": asin,
                            "country": country,
                            "api_source": "apify",
                            "max_reviews_limit": 5,
                            "product_info": product_info if product_info else None,
                            "debug": {
                                "raw_items_count": len(items),
                                "transformed_reviews_count": len(reviews)
                            }
                        }
                    else:
                        print(f"  ⚠️ No reviews found after transformation")
                        print(f"  💡 Check debug_apify_raw_{asin}_{country}.json for raw data")
                        return {
                            "success": False,
                            "error": "No reviews found in the scraped data",
                            "error_type": "no_reviews_found",
                            "asin": asin,
                            "country": country,
                            "debug_info": f"Raw items: {len(items)}, but no reviews extracted",
                            "suggestion": "Check the debug file to see what data Apify returned"
                        }
                        
                else:
                    error_message = run_info.get('errorMessage', 'Unknown error')
                    print(f"  ❌ Failed: {error_message}")
                    
                    return {
                        "success": False,
                        "error": f"Scraping failed: {error_message}",
                        "error_type": "scraping_failed",
                        "asin": asin
                    }
                    
            except Exception as e:
                print(f"  ❌ Exception: {str(e)}")
                return {
                    "success": False,
                    "error": f"Apify error: {str(e)}",
                    "error_type": "exception",
                    "asin": asin
                }
        
        return {
            "success": False,
            "error": "Apify service unavailable",
            "error_type": "service_unavailable"
        }


# Singleton instance
apify_service = ApifyService()