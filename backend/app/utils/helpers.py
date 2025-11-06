"""
Helper utility functions.
"""

import pandas as pd
from typing import Optional
from datetime import datetime


def validate_asin(asin: str) -> bool:
    """
    Validate Amazon ASIN format.
    ASIN: B followed by 9 alphanumeric characters.
    """
    if not asin or len(asin) != 10:
        return False
    return asin[0] == 'B' and asin[1:].isalnum()


def validate_rating(rating: float) -> bool:
    """Validate star rating (1-5)."""
    return 1.0 <= rating <= 5.0


def calculate_percentage(part: int, total: int) -> float:
    """Calculate percentage safely."""
    if total == 0:
        return 0.0
    return round((part / total) * 100, 2)


def format_timestamp(dt: Optional[datetime] = None) -> str:
    """Format datetime for file naming."""
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%Y%m%d_%H%M%S")


def truncate_text(text: str, max_length: int = 100) -> str:
    """Truncate text with ellipsis."""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + "..."


def sanitize_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and sanitize DataFrame of reviews.
    
    Args:
        df: Raw DataFrame
    
    Returns:
        Cleaned DataFrame
    """
    if df.empty:
        return df
    
    # Remove duplicates
    if 'review_id' in df.columns:
        df = df.drop_duplicates(subset=['review_id'], keep='first')
    
    # Handle missing values
    if 'review_text' in df.columns:
        df['review_text'] = df['review_text'].fillna('')
    
    if 'rating' in df.columns:
        df['rating'] = df['rating'].fillna(3.0)
        df = df[df['rating'].between(1, 5)]
    
    if 'review_date' in df.columns:
        df['review_date'] = pd.to_datetime(df['review_date'], errors='coerce')
    
    # Remove empty reviews
    if 'review_text' in df.columns:
        df = df[df['review_text'].str.strip() != '']
    
    return df.reset_index(drop=True)


def get_sentiment_label(rating: float, 
                        positive_threshold: float = 4.0,
                        negative_threshold: float = 2.5) -> str:
    """
    Get sentiment label from rating.
    
    Args:
        rating: Star rating
        positive_threshold: Minimum rating for positive
        negative_threshold: Maximum rating for negative
    
    Returns:
        'positive', 'neutral', or 'negative'
    """
    if rating >= positive_threshold:
        return 'positive'
    elif rating <= negative_threshold:
        return 'negative'
    else:
        return 'neutral'