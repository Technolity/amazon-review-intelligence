"""
Amazon URL parser to extract ASIN from product links.
"""

import re
from typing import Optional


class AmazonURLParser:
    """Parse Amazon product URLs to extract ASIN."""
    
    # Amazon domain patterns
    AMAZON_DOMAINS = [
        'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 
        'amazon.it', 'amazon.es', 'amazon.ca', 'amazon.com.au',
        'amazon.in', 'amazon.co.jp', 'amazon.com.br', 'amazon.com.mx'
    ]
    
    # ASIN patterns in URLs
    ASIN_PATTERNS = [
        r'/dp/([A-Z0-9]{10})',           # /dp/B08N5WRWNW
        r'/gp/product/([A-Z0-9]{10})',   # /gp/product/B08N5WRWNW
        r'/product/([A-Z0-9]{10})',      # /product/B08N5WRWNW
        r'/ASIN/([A-Z0-9]{10})',         # /ASIN/B08N5WRWNW
        r'[?&]asin=([A-Z0-9]{10})',      # ?asin=B08N5WRWNW
    ]
    
    @staticmethod
    def extract_asin(url_or_asin: str) -> Optional[str]:
        """
        Extract ASIN from Amazon URL or validate ASIN.
        
        Args:
            url_or_asin: Amazon product URL or ASIN
        
        Returns:
            ASIN if found, None otherwise
        
        Examples:
            >>> extract_asin("https://www.amazon.com/dp/B08N5WRWNW")
            'B08N5WRWNW'
            >>> extract_asin("B08N5WRWNW")
            'B08N5WRWNW'
        """
        if not url_or_asin:
            return None
        
        # Clean input
        url_or_asin = url_or_asin.strip()
        
        # Check if it's already a valid ASIN
        if AmazonURLParser.is_valid_asin(url_or_asin):
            return url_or_asin.upper()
        
        # Try to extract ASIN from URL
        for pattern in AmazonURLParser.ASIN_PATTERNS:
            match = re.search(pattern, url_or_asin, re.IGNORECASE)
            if match:
                asin = match.group(1).upper()
                if AmazonURLParser.is_valid_asin(asin):
                    return asin
        
        return None
    
    @staticmethod
    def is_valid_asin(asin: str) -> bool:
        """
        Validate ASIN format.
        
        Args:
            asin: String to validate
        
        Returns:
            True if valid ASIN format
        """
        if not asin or len(asin) != 10:
            return False
        
        # ASIN format: B followed by 9 alphanumeric characters
        return asin[0] == 'B' and asin[1:].isalnum()
    
    @staticmethod
    def is_amazon_url(url: str) -> bool:
        """
        Check if URL is from Amazon.
        
        Args:
            url: URL to check
        
        Returns:
            True if Amazon URL
        """
        if not url:
            return False
        
        url_lower = url.lower()
        return any(domain in url_lower for domain in AmazonURLParser.AMAZON_DOMAINS)
    
    @staticmethod
    def get_product_url(asin: str, domain: str = 'amazon.com') -> str:
        """
        Generate Amazon product URL from ASIN.
        
        Args:
            asin: Product ASIN
            domain: Amazon domain (default: amazon.com)
        
        Returns:
            Full Amazon product URL
        """
        return f"https://www.{domain}/dp/{asin}"


# Singleton instance
amazon_url_parser = AmazonURLParser()