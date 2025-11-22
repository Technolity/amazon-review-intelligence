"""
Apify Service - Production-ready Amazon review scraping
Handles rate limiting, retries, caching, and data transformation
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
import json
from uuid import uuid4
import hashlib

from apify_client import ApifyClient
from apify_client.clients.resource_clients.actor import ActorClient
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import ExternalAPIException
from app.services.cache_service import cache_service
from app.models.product import Product
from app.models.review import Review
from app.schemas.review import ReviewCreate
from app.schemas.product import ProductCreate
from sqlalchemy.orm import Session


class ApifyService:
    """
    Production-ready Apify integration for Amazon review scraping
    """
    
    def __init__(self):
        self.client: Optional[ApifyClient] = None
        self.actor_client: Optional[ActorClient] = None
        self._initialize_client()
        
        # Rate limiting
        self.last_request_time = None
        self.min_request_interval = 1.0  # Minimum seconds between requests
        
    def _initialize_client(self):
        """
        Initialize Apify client with error handling
        """
        if not settings.APIFY_API_TOKEN:
            logger.warning("Apify API token not configured")
            return
            
        try:
            self.client = ApifyClient(settings.APIFY_API_TOKEN)
            self.actor_client = self.client.actor(settings.APIFY_ACTOR_ID)
            logger.success("Apify client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Apify client: {e}")
            self.client = None
            self.actor_client = None
    
    async def _rate_limit(self):
        """
        Implement rate limiting to avoid API throttling
        """
        if self.last_request_time:
            elapsed = (datetime.now() - self.last_request_time).total_seconds()
            if elapsed < self.min_request_interval:
                await asyncio.sleep(self.min_request_interval - elapsed)
        self.last_request_time = datetime.now()
    
    def _generate_cache_key(self, asin: str, country: str, max_reviews: int) -> str:
        """
        Generate cache key for review data
        """
        data = f"{asin}:{country}:{max_reviews}"
        return f"apify:reviews:{hashlib.md5(data.encode()).hexdigest()}"
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def fetch_reviews(
        self,
        asin: str,
        country: str = "US",
        max_reviews: int = 100,
        use_cache: bool = True,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Fetch reviews from Amazon via Apify with retries and caching
        
        Args:
            asin: Amazon Standard Identification Number
            country: Amazon marketplace country code
            max_reviews: Maximum number of reviews to fetch
            use_cache: Whether to use cached results
            db: Database session for persistence
            
        Returns:
            Dictionary containing product info and reviews
        """
        # Check cache first
        if use_cache and cache_service.is_available():
            cache_key = self._generate_cache_key(asin, country, max_reviews)
            cached_data = await cache_service.get(cache_key)
            if cached_data:
                logger.info(f"Returning cached data for ASIN: {asin}")
                return cached_data
        
        # Check if Apify is configured
        if not self.actor_client:
            logger.warning("Apify not configured, using mock data")
            return await self._get_mock_data(asin, country)
        
        # Rate limiting
        await self._rate_limit()
        
        try:
            logger.info(f"Fetching reviews for ASIN: {asin} from Amazon {country}")
            
            # Prepare input for Apify actor
            actor_input = {
                "amazonDomain": self._get_amazon_domain(country),
                "asins": [asin],
                "maxReviews": max_reviews,
                "reviewsSort": "recent",
                "filterByKeyword": "",
                "filterByStar": "",
                "filterByVerified": False,
                "extendedReviewsInfo": True,
                "extendedProductInfo": True,
                "proxyConfiguration": {
                    "useApifyProxy": True,
                    "apifyProxyGroups": ["RESIDENTIAL"]
                }
            }
            
            # Run the actor
            logger.debug(f"Starting Apify actor with input: {actor_input}")
            run = self.actor_client.call(
                run_input=actor_input,
                timeout_secs=settings.APIFY_TIMEOUT_SECONDS,
                memory_mbytes=settings.APIFY_MEMORY_MBYTES
            )
            
            # Get results
            dataset = self.client.dataset(run["defaultDatasetId"])
            items = list(dataset.iterate_items())
            
            if not items:
                logger.warning(f"No reviews found for ASIN: {asin}")
                return await self._get_mock_data(asin, country)
            
            # Transform the data
            result = self._transform_apify_response(items[0], asin, country)
            
            # Save to database if session provided
            if db:
                await self._save_to_database(result, db)
            
            # Cache the results
            if use_cache and cache_service.is_available():
                await cache_service.set(
                    cache_key,
                    result,
                    ttl=settings.CACHE_TTL
                )
            
            logger.success(f"Successfully fetched {len(result['reviews'])} reviews for ASIN: {asin}")
            return result
            
        except Exception as e:
            logger.error(f"Apify request failed: {str(e)}")
            
            # Try to get from database if available
            if db:
                cached_result = await self._get_from_database(asin, db)
                if cached_result:
                    return cached_result
            
            # Fall back to mock data
            if settings.ENABLE_MOCK_DATA:
                logger.info("Falling back to mock data")
                return await self._get_mock_data(asin, country)
            
            raise ExternalAPIException(
                message=f"Failed to fetch reviews for ASIN: {asin}",
                service="Apify",
                details={"error": str(e), "asin": asin}
            )
    
    def _transform_apify_response(
        self,
        apify_data: Dict[str, Any],
        asin: str,
        country: str
    ) -> Dict[str, Any]:
        """
        Transform Apify response to our standard format
        """
        # Extract product information
        product_info = {
            "asin": asin,
            "title": apify_data.get("title", "Unknown Product"),
            "brand": apify_data.get("brand", ""),
            "price": apify_data.get("price", {}).get("value", 0),
            "currency": apify_data.get("price", {}).get("currency", "USD"),
            "image_url": apify_data.get("mainImage", ""),
            "average_rating": float(apify_data.get("averageRating", 0)),
            "total_reviews": apify_data.get("totalReviews", 0),
            "category": apify_data.get("category", ""),
            "description": apify_data.get("description", ""),
            "features": apify_data.get("features", []),
            "variants": apify_data.get("variants", []),
            "url": apify_data.get("url", f"https://amazon.com/dp/{asin}")
        }
        
        # Transform reviews
        reviews = []
        for review_data in apify_data.get("reviews", []):
            review = self._transform_review(review_data)
            reviews.append(review)
        
        # Calculate distributions
        rating_distribution = self._calculate_rating_distribution(reviews)
        
        return {
            "success": True,
            "asin": asin,
            "country": country,
            "product_info": product_info,
            "reviews": reviews,
            "total_reviews": len(reviews),
            "average_rating": product_info["average_rating"],
            "rating_distribution": rating_distribution,
            "data_source": "apify",
            "fetched_at": datetime.utcnow().isoformat(),
            "cache_ttl": settings.CACHE_TTL
        }
    
    def _transform_review(self, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Transform individual review to standard format
        """
        # Parse date
        review_date = review_data.get("date", "")
        if isinstance(review_date, str):
            try:
                # Parse various date formats
                from dateutil import parser
                review_date = parser.parse(review_date).isoformat()
            except:
                review_date = datetime.utcnow().isoformat()
        
        return {
            "id": review_data.get("id") or str(uuid4()),
            "external_id": review_data.get("reviewId", ""),
            "rating": float(review_data.get("rating", 0)),
            "title": review_data.get("title", ""),
            "text": review_data.get("text", ""),
            "author": review_data.get("authorName", "Anonymous"),
            "author_id": review_data.get("authorId", ""),
            "date": review_date,
            "verified": review_data.get("verifiedPurchase", False),
            "helpful_count": review_data.get("helpfulCount", 0),
            "images": review_data.get("images", []),
            "variant": review_data.get("variant", ""),
            "location": review_data.get("location", ""),
            "vine_program": review_data.get("vineProgram", False),
            "source": "apify"
        }
    
    def _calculate_rating_distribution(self, reviews: List[Dict]) -> Dict[str, int]:
        """
        Calculate rating distribution from reviews
        """
        distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for review in reviews:
            rating = str(int(review.get("rating", 0)))
            if rating in distribution:
                distribution[rating] += 1
        return distribution
    
    def _get_amazon_domain(self, country: str) -> str:
        """
        Get Amazon domain for country code
        """
        domains = {
            "US": "amazon.com",
            "UK": "amazon.co.uk",
            "DE": "amazon.de",
            "FR": "amazon.fr",
            "ES": "amazon.es",
            "IT": "amazon.it",
            "JP": "amazon.co.jp",
            "CA": "amazon.ca",
            "AU": "amazon.com.au",
            "IN": "amazon.in",
            "MX": "amazon.com.mx",
            "BR": "amazon.com.br"
        }
        return domains.get(country.upper(), "amazon.com")
    
    async def _get_mock_data(self, asin: str, country: str) -> Dict[str, Any]:
        """
        Generate mock data for testing and fallback
        """
        logger.info(f"Generating mock data for ASIN: {asin}")
        
        # Generate deterministic but varied mock data based on ASIN
        seed = int(hashlib.md5(asin.encode()).hexdigest()[:8], 16)
        
        product_info = {
            "asin": asin,
            "title": f"Premium Product {asin[:4]}",
            "brand": f"Brand {chr(65 + seed % 26)}",
            "price": round(29.99 + (seed % 100), 2),
            "currency": "USD",
            "image_url": f"https://via.placeholder.com/500?text={asin}",
            "average_rating": round(3.5 + (seed % 15) / 10, 1),
            "total_reviews": 150 + seed % 350,
            "category": "Electronics",
            "url": f"https://amazon.com/dp/{asin}"
        }
        
        # Generate mock reviews
        reviews = []
        num_reviews = min(50, product_info["total_reviews"])
        
        review_templates = [
            ("Great product!", "Exceeded my expectations", 5),
            ("Good value", "Worth the price", 4),
            ("Average", "It's okay", 3),
            ("Not great", "Could be better", 2),
            ("Disappointed", "Not recommended", 1)
        ]
        
        for i in range(num_reviews):
            template_idx = (seed + i) % len(review_templates)
            title, text, rating = review_templates[template_idx]
            
            review = {
                "id": str(uuid4()),
                "external_id": f"MOCK_{asin}_{i}",
                "rating": rating,
                "title": f"{title} #{i+1}",
                "text": f"{text}. This is review {i+1} for product {asin}.",
                "author": f"Customer{i+1}",
                "date": (datetime.utcnow() - timedelta(days=i)).isoformat(),
                "verified": i % 3 != 0,  # 67% verified
                "helpful_count": max(0, 10 - i),
                "images": [],
                "source": "mock"
            }
            reviews.append(review)
        
        rating_distribution = self._calculate_rating_distribution(reviews)
        
        return {
            "success": True,
            "asin": asin,
            "country": country,
            "product_info": product_info,
            "reviews": reviews,
            "total_reviews": len(reviews),
            "average_rating": product_info["average_rating"],
            "rating_distribution": rating_distribution,
            "data_source": "mock",
            "fetched_at": datetime.utcnow().isoformat()
        }
    
    async def _save_to_database(self, data: Dict[str, Any], db: Session):
        """
        Save fetched data to database for persistence
        """
        try:
            # Save or update product
            product = db.query(Product).filter_by(asin=data["asin"]).first()
            if not product:
                product = Product(**ProductCreate(**data["product_info"]).dict())
                db.add(product)
            else:
                for key, value in data["product_info"].items():
                    setattr(product, key, value)
                product.last_analyzed = datetime.utcnow()
            
            # Save reviews
            for review_data in data["reviews"]:
                review = db.query(Review).filter_by(
                    external_id=review_data["external_id"],
                    product_id=product.id
                ).first()
                
                if not review:
                    review = Review(
                        **ReviewCreate(**review_data).dict(),
                        product_id=product.id
                    )
                    db.add(review)
            
            db.commit()
            logger.info(f"Saved {len(data['reviews'])} reviews to database")
            
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save to database: {e}")
    
    async def _get_from_database(
        self,
        asin: str,
        db: Session
    ) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached data from database
        """
        try:
            product = db.query(Product).filter_by(asin=asin).first()
            if not product:
                return None
            
            reviews = db.query(Review).filter_by(product_id=product.id).all()
            
            return {
                "success": True,
                "asin": asin,
                "product_info": product.to_dict(),
                "reviews": [review.to_dict() for review in reviews],
                "total_reviews": len(reviews),
                "average_rating": product.average_rating,
                "data_source": "database",
                "fetched_at": product.last_analyzed.isoformat() if product.last_analyzed else None
            }
            
        except Exception as e:
            logger.error(f"Failed to retrieve from database: {e}")
            return None
    
    def is_available(self) -> bool:
        """
        Check if Apify service is available
        """
        return self.client is not None and self.actor_client is not None


# Create singleton instance
apify_service = ApifyService()

__all__ = ["apify_service"]