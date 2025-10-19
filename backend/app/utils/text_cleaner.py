"""
Text cleaning and preprocessing utilities.
"""

import re
import string
from typing import List
from bs4 import BeautifulSoup
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

# Download NLTK data if needed
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt', quiet=True)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords', quiet=True)


class TextCleaner:
    """Clean and preprocess text data."""
    
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))
        # Add custom stopwords for Amazon reviews
        self.custom_stopwords = {
            'product', 'amazon', 'bought', 'purchase', 'ordered',
            'item', 'one', 'would', 'get', 'like', 'use', 'used',
            'also', 'really', 'thing', 'much', 'well', 'good'
        }
        self.stop_words.update(self.custom_stopwords)
    
    def clean_html(self, text: str) -> str:
        """Remove HTML tags."""
        if not text:
            return ""
        soup = BeautifulSoup(text, "lxml")
        return soup.get_text()
    
    def remove_urls(self, text: str) -> str:
        """Remove URLs."""
        url_pattern = re.compile(r'https?://\S+|www\.\S+')
        return url_pattern.sub('', text)
    
    def remove_special_chars(self, text: str) -> str:
        """Remove special characters."""
        text = re.sub(r'[^a-zA-Z0-9\s.,!?-]', '', text)
        return text
    
    def normalize_whitespace(self, text: str) -> str:
        """Normalize whitespace."""
        return ' '.join(text.split())
    
    def clean_text(self, text: str, remove_stopwords: bool = False) -> str:
        """
        Complete cleaning pipeline.
        
        Args:
            text: Raw text
            remove_stopwords: Whether to remove stopwords
        
        Returns:
            Cleaned text
        """
        if not text or not isinstance(text, str):
            return ""
        
        text = self.clean_html(text)
        text = self.remove_urls(text)
        text = text.lower()
        text = self.remove_special_chars(text)
        text = self.normalize_whitespace(text)
        
        if remove_stopwords:
            tokens = word_tokenize(text)
            tokens = [word for word in tokens if word not in self.stop_words]
            text = ' '.join(tokens)
        
        return text.strip()
    
    def extract_keywords(self, text: str) -> List[str]:
        """
        Extract keywords from text.
        
        Returns:
            List of keywords
        """
        text = self.clean_text(text, remove_stopwords=False)
        tokens = word_tokenize(text)
        
        keywords = [
            word for word in tokens 
            if word not in self.stop_words 
            and word not in string.punctuation
            and len(word) > 2
        ]
        
        return keywords


# Singleton instance
text_cleaner = TextCleaner()