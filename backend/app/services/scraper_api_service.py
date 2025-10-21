"""
ScraperAPI service for fetching real Amazon reviews.
Updated with better error handling and retry logic.
"""

import os
import requests
from typing import Dict, List, Any
from datetime import datetime
from bs4 import BeautifulSoup
import re
import time

from app.utils.helpers import validate_asin


class ScraperAPIService:
    """Fetch real Amazon reviews using ScraperAPI."""
    
    def __init__(self):
        self.api_key = os.getenv('SCRAPER_API_KEY', '')
        self.base_url = 'https://api.scraperapi.com'
        self.timeout = 60
    
    def fetch_reviews(self, asin: str, max_reviews: int = 100) -> Dict[str, Any]:
        """
        Fetch real Amazon reviews using ScraperAPI.
        
        Args:
            asin: Product ASIN
            max_reviews: Maximum number of reviews to fetch
        
        Returns:
            Dict with reviews data
        """
        if not validate_asin(asin):
            return {
                "success": False,
                "error": f"Invalid ASIN format: {asin}"
            }
        
        if not self.api_key:
            return {
                "success": False,
                "error": "ScraperAPI key not configured"
            }
        
        try:
            print(f"  📡 Fetching from Amazon via ScraperAPI...")
            
            # Fetch product info (with retry)
            product_info = self._fetch_product_info_with_retry(asin)
            
            # Fetch reviews from multiple pages
            all_reviews = []
            page = 1
            max_pages = min(10, (max_reviews // 10) + 1)
            
            while len(all_reviews) < max_reviews and page <= max_pages:
                print(f"  📄 Fetching page {page}...")
                reviews = self._fetch_reviews_page(asin, page)
                
                if not reviews:
                    print(f"  ⚠️  No reviews on page {page}, stopping...")
                    break
                
                all_reviews.extend(reviews)
                page += 1
                
                # Small delay between pages
                if page <= max_pages:
                    time.sleep(1)
            
            # Limit to max_reviews
            all_reviews = all_reviews[:max_reviews]
            
            if not all_reviews:
                return {
                    "success": False,
                    "error": "No reviews found. ScraperAPI may be experiencing issues or the product has no reviews."
                }
            
            print(f"  ✅ Successfully fetched {len(all_reviews)} reviews")
            
            return {
                "success": True,
                "asin": asin,
                "total_reviews": len(all_reviews),
                "reviews": all_reviews,
                "product_title": product_info.get('title', f'Product {asin}'),
                "average_rating": product_info.get('rating', 0),
                "fetched_at": datetime.now().isoformat(),
                "mock_data": False
            }
        
        except requests.exceptions.Timeout:
            print(f"  ❌ ScraperAPI timeout: Request took too long")
            return {
                "success": False,
                "error": "Request timeout - API server is busy. Please try again in a few moments.",
                "error_type": "timeout",
                "asin": asin
            }
        except requests.exceptions.ConnectionError as e:
            print(f"  ❌ Connection error: {e}")
            return {
                "success": False,
                "error": "Unable to connect to review service. Please check your internet connection and try again.",
                "error_type": "connection_error",
                "asin": asin
            }
        except requests.exceptions.HTTPError as e:
            status_code = e.response.status_code if e.response else None
            print(f"  ❌ HTTP error {status_code}: {e}")
            
            if status_code == 429:
                error_msg = "API rate limit reached. Please wait a few minutes before trying again."
            elif status_code == 404:
                error_msg = "Product not found or has no reviews. Please verify the ASIN and try again."
            elif status_code == 403:
                error_msg = "Access forbidden. Please check your API credentials."
            elif status_code >= 500:
                error_msg = "Review service is temporarily unavailable. Please try again later."
            else:
                error_msg = f"Unable to fetch reviews (Error {status_code}). Please try again."
            
            return {
                "success": False,
                "error": error_msg,
                "error_type": "http_error",
                "status_code": status_code,
                "asin": asin
            }
        except Exception as e:
            print(f"  ❌ ScraperAPI error: {e}")
            return {
                "success": False,
                "error": "An unexpected error occurred while fetching reviews. Please try again.",
                "error_type": "unknown",
                "error_detail": str(e),
                "asin": asin
            }
    
    def _fetch_product_info_with_retry(self, asin: str, retries: int = 2) -> Dict[str, Any]:
        """Fetch basic product information with retry logic."""
        for attempt in range(retries):
            try:
                return self._fetch_product_info(asin)
            except Exception as e:
                if attempt < retries - 1:
                    print(f"  ⚠️  Product info attempt {attempt + 1} failed, retrying...")
                    time.sleep(2)
                else:
                    print(f"  ⚠️  Could not fetch product info, using defaults")
                    return {'title': f'Product {asin}', 'rating': 0.0}
        
        return {'title': f'Product {asin}', 'rating': 0.0}
    
    def _fetch_product_info(self, asin: str) -> Dict[str, Any]:
        """Fetch basic product information."""
        amazon_url = f"https://www.amazon.com/dp/{asin}"
        
        params = {
            'api_key': self.api_key,
            'url': amazon_url,
            'country_code': 'us'
        }
        
        response = requests.get(self.base_url, params=params, timeout=self.timeout)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Extract product title
        title = ''
        title_elem = soup.find('span', {'id': 'productTitle'})
        if title_elem:
            title = title_elem.get_text().strip()
        
        # Extract rating
        rating = 0.0
        rating_elem = soup.find('span', {'class': 'a-icon-alt'})
        if rating_elem:
            rating_text = rating_elem.get_text()
            match = re.search(r'([\d.]+)', rating_text)
            if match:
                rating = float(match.group(1))
        
        return {
            'title': title or f'Product {asin}',
            'rating': rating
        }
    
    def _fetch_reviews_page(self, asin: str, page: int = 1) -> List[Dict]:
        """Fetch reviews from a specific page."""
        # Simplified URL format
        reviews_url = f"https://www.amazon.com/product-reviews/{asin}"
        
        params = {
            'api_key': self.api_key,
            'url': reviews_url,
            'country_code': 'us'
        }
        
        # Add page parameter if not first page
        if page > 1:
            params['url'] = f"{reviews_url}?pageNumber={page}"
        
        try:
            response = requests.get(self.base_url, params=params, timeout=self.timeout)
            
            # Check for rate limiting or errors
            if response.status_code == 404:
                print(f"  ⚠️  404 error - product may not exist or have reviews")
                return []
            
            if response.status_code == 429:
                print(f"  ⚠️  Rate limited by ScraperAPI")
                return []
            
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            reviews = []
            review_elements = soup.find_all('div', {'data-hook': 'review'})
            
            if not review_elements:
                print(f"  ⚠️  No review elements found on page {page}")
                return []
            
            for idx, review_elem in enumerate(review_elements):
                try:
                    # Extract review ID
                    review_id = review_elem.get('id', f'{asin}_p{page}_{idx}')
                    
                    # Extract rating
                    rating = 0.0
                    rating_elem = review_elem.find('i', {'data-hook': 'review-star-rating'})
                    if rating_elem:
                        rating_text = rating_elem.get_text()
                        match = re.search(r'([\d.]+)', rating_text)
                        if match:
                            rating = float(match.group(1))
                    
                    # Extract review title
                    title = ''
                    title_elem = review_elem.find('a', {'data-hook': 'review-title'})
                    if title_elem:
                        title_span = title_elem.find('span')
                        if title_span:
                            title = title_span.get_text().strip()
                    
                    # Extract review text
                    text = ''
                    text_elem = review_elem.find('span', {'data-hook': 'review-body'})
                    if text_elem:
                        text = text_elem.get_text().strip()
                    
                    # Extract review date
                    date = ''
                    date_elem = review_elem.find('span', {'data-hook': 'review-date'})
                    if date_elem:
                        date = date_elem.get_text().strip()
                        date = re.sub(r'.*on\s+', '', date)
                    
                    # Extract verified purchase
                    verified = False
                    verified_elem = review_elem.find('span', {'data-hook': 'avp-badge'})
                    if verified_elem:
                        verified = True
                    
                    # Extract helpful votes
                    helpful = 0
                    helpful_elem = review_elem.find('span', {'data-hook': 'helpful-vote-statement'})
                    if helpful_elem:
                        helpful_text = helpful_elem.get_text()
                        match = re.search(r'(\d+)', helpful_text)
                        if match:
                            helpful = int(match.group(1))
                    
                    # Only add if we have meaningful data
                    if rating > 0 and text:
                        reviews.append({
                            'review_id': review_id,
                            'asin': asin,
                            'rating': rating,
                            'review_text': text,
                            'review_title': title,
                            'review_date': date,
                            'verified_purchase': verified,
                            'helpful_votes': helpful
                        })
                
                except Exception as e:
                    print(f"  ⚠️  Error parsing review {idx}: {e}")
                    continue
            
            return reviews
        
        except requests.exceptions.Timeout:
            print(f"  ⚠️  Timeout fetching page {page}")
            return []
        except Exception as e:
            print(f"  ⚠️  Error fetching page {page}: {e}")
            return []


# Singleton instance
scraper_api_service = ScraperAPIService()