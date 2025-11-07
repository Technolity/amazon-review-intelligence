"""
Bot Review Detection Service
Identifies and filters fake, bot-generated, or suspicious reviews
"""

from typing import Dict, List, Any
from collections import Counter
from datetime import datetime
import re


class BotDetector:
    """Detect bot/fake reviews using multiple heuristics"""

    def __init__(self):
        # Common bot review patterns
        self.suspicious_patterns = [
            r'^great product!?$',
            r'^excellent!?$',
            r'^amazing!?$',
            r'^love it!?$',
            r'^perfect!?$',
            r'^highly recommend!?$',
            r'^five stars?!?$',
            r'^best buy!?$',
            r'^must have!?$',
            r'^super!?$',
        ]

        # Generic phrases often used by bots
        self.generic_phrases = [
            "great product",
            "excellent quality",
            "highly recommend",
            "very satisfied",
            "love it",
            "perfect",
            "as described",
            "fast shipping",
            "good value",
            "five stars"
        ]

    def analyze_review(self, review: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze a single review for bot-like characteristics
        Returns the review with added bot_score and is_bot_likely fields
        """
        text = (review.get('text', '') + ' ' + review.get('title', '')).lower().strip()
        author = review.get('author', '').lower()
        rating = review.get('rating', 0)
        verified = review.get('verified', False)
        helpful_count = review.get('helpful_count', 0)

        bot_indicators = []
        bot_score = 0.0

        # 1. Very short review (< 10 characters)
        if len(text) < 10:
            bot_indicators.append("very_short")
            bot_score += 0.3

        # 2. Too generic/short with max rating
        if len(text) < 30 and rating == 5:
            bot_indicators.append("short_5star")
            bot_score += 0.2

        # 3. Matches suspicious patterns
        for pattern in self.suspicious_patterns:
            if re.match(pattern, text, re.IGNORECASE):
                bot_indicators.append("suspicious_pattern")
                bot_score += 0.4
                break

        # 4. Too many generic phrases
        generic_count = sum(1 for phrase in self.generic_phrases if phrase in text)
        if generic_count >= 3 and len(text) < 100:
            bot_indicators.append("too_generic")
            bot_score += 0.3

        # 5. Unverified purchase with extreme rating
        if not verified and (rating == 5 or rating == 1):
            bot_indicators.append("unverified_extreme")
            bot_score += 0.2

        # 6. No helpful votes with old review (likely low quality)
        if helpful_count == 0 and len(text) < 50:
            bot_indicators.append("no_engagement")
            bot_score += 0.1

        # 7. Suspicious author name patterns
        if self._is_suspicious_author(author):
            bot_indicators.append("suspicious_author")
            bot_score += 0.3

        # 8. All caps or excessive punctuation
        if text.isupper() or text.count('!') > 5:
            bot_indicators.append("excessive_formatting")
            bot_score += 0.2

        # 9. Repetitive words
        words = text.split()
        if len(words) > 5:
            word_freq = Counter(words)
            max_freq = max(word_freq.values()) if word_freq else 0
            if max_freq > len(words) * 0.3:  # Same word > 30% of text
                bot_indicators.append("repetitive")
                bot_score += 0.3

        # Cap bot_score at 1.0
        bot_score = min(bot_score, 1.0)

        # Determine if likely bot
        is_bot_likely = bot_score >= 0.6

        return {
            **review,
            "bot_score": round(bot_score, 2),
            "is_bot_likely": is_bot_likely,
            "bot_indicators": bot_indicators,
            "bot_analysis": {
                "score": round(bot_score, 2),
                "confidence": "high" if bot_score >= 0.7 else "medium" if bot_score >= 0.4 else "low",
                "indicators": bot_indicators
            }
        }

    def _is_suspicious_author(self, author: str) -> bool:
        """Check if author name looks suspicious"""
        if not author:
            return False

        # Check for common bot patterns
        suspicious_patterns = [
            r'^customer\d+$',  # customer123
            r'^user\d+$',      # user456
            r'^amazon\s?customer$',
            r'^\d+$',          # just numbers
            r'^reviewer\d*$',
            r'^[a-z]{1,2}\d+$',  # a123, ab456
        ]

        for pattern in suspicious_patterns:
            if re.match(pattern, author, re.IGNORECASE):
                return True

        return False

    def analyze_batch(self, reviews: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze multiple reviews and detect patterns
        Returns analyzed reviews and aggregate statistics
        """
        if not reviews:
            return {
                "analyzed_reviews": [],
                "bot_statistics": {
                    "total_reviews": 0,
                    "bot_count": 0,
                    "bot_percentage": 0,
                    "suspicious_count": 0
                }
            }

        # Analyze each review
        analyzed = [self.analyze_review(review) for review in reviews]

        # Look for batch patterns
        analyzed = self._detect_batch_patterns(analyzed)

        # Calculate statistics
        bot_count = sum(1 for r in analyzed if r.get('is_bot_likely', False))
        suspicious_count = sum(1 for r in analyzed if 0.3 <= r.get('bot_score', 0) < 0.6)

        # Filter out bots
        genuine_reviews = [r for r in analyzed if not r.get('is_bot_likely', False)]

        bot_percentage = (bot_count / len(reviews) * 100) if reviews else 0

        return {
            "analyzed_reviews": analyzed,
            "genuine_reviews": genuine_reviews,
            "bot_statistics": {
                "total_reviews": len(reviews),
                "genuine_count": len(genuine_reviews),
                "bot_count": bot_count,
                "bot_percentage": round(bot_percentage, 1),
                "suspicious_count": suspicious_count,
                "filtered_count": bot_count
            }
        }

    def _detect_batch_patterns(self, reviews: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect if reviews were posted in suspicious batches"""
        # Group by date
        date_groups = {}
        for review in reviews:
            date_str = review.get('date', '')
            try:
                # Extract date part only
                if isinstance(date_str, str):
                    date_part = date_str.split('T')[0]  # ISO format
                    if date_part not in date_groups:
                        date_groups[date_part] = []
                    date_groups[date_part].append(review)
            except:
                pass

        # Check for suspicious bulk posting
        for date, date_reviews in date_groups.items():
            if len(date_reviews) >= 5:  # 5+ reviews same day
                # Check if they're all similar
                ratings = [r.get('rating', 0) for r in date_reviews]
                texts = [r.get('text', '') for r in date_reviews]

                # All same rating = suspicious
                if len(set(ratings)) == 1:
                    for review in date_reviews:
                        if 'bot_indicators' not in review:
                            review['bot_indicators'] = []
                        review['bot_indicators'].append('bulk_posting_same_rating')
                        review['bot_score'] = min(review.get('bot_score', 0) + 0.2, 1.0)
                        review['is_bot_likely'] = review['bot_score'] >= 0.6

        return reviews

    def filter_bots(self, reviews: List[Dict[str, Any]], threshold: float = 0.6) -> List[Dict[str, Any]]:
        """
        Filter out bot reviews above threshold
        Returns only genuine reviews
        """
        analyzed = self.analyze_batch(reviews)
        return [r for r in analyzed['analyzed_reviews'] if r.get('bot_score', 0) < threshold]


# Singleton instance
bot_detector = BotDetector()
