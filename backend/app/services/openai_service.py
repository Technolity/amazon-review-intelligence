"""
OpenAI Integration Service
Generates high-quality summaries and insights using GPT models
"""

import os
from typing import Dict, List, Any, Optional
from openai import OpenAI
import json


class OpenAIService:
    """Service for OpenAI GPT-based analysis"""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
        self.max_tokens = int(os.getenv("OPENAI_MAX_TOKENS", "500"))
        self.temperature = float(os.getenv("OPENAI_TEMPERATURE", "0.7"))
        self.client = None

        if self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
                print("✅ OpenAI service initialized")
            except Exception as e:
                print(f"❌ OpenAI initialization failed: {e}")
                self.client = None
        else:
            print("⚠️ OpenAI API key not configured")

    def is_available(self) -> bool:
        """Check if OpenAI service is available"""
        return self.client is not None

    def generate_summary(
        self,
        reviews: List[Dict[str, Any]],
        product_info: Dict[str, Any],
        sentiment_dist: Dict[str, int]
    ) -> str:
        """Generate comprehensive product summary using GPT"""
        if not self.is_available():
            return self._fallback_summary(reviews, product_info, sentiment_dist)

        try:
            # Prepare context
            product_title = product_info.get('title', 'Product')
            total_reviews = len(reviews)
            avg_rating = sum(r.get('rating', 0) for r in reviews) / total_reviews if total_reviews > 0 else 0

            # Sample reviews for context (limit to first 10)
            sample_reviews = reviews[:10]
            review_texts = "\n".join([
                f"- Rating {r.get('rating', 0)}/5: {r.get('text', '')[:100]}..."
                for r in sample_reviews
            ])

            # Create prompt
            prompt = f"""Analyze this Amazon product based on customer reviews and provide a comprehensive, professional summary.

Product: {product_title}
Total Reviews: {total_reviews}
Average Rating: {avg_rating:.1f}/5
Sentiment: {sentiment_dist.get('positive', 0)} positive, {sentiment_dist.get('neutral', 0)} neutral, {sentiment_dist.get('negative', 0)} negative

Sample Reviews:
{review_texts}

Provide a 3-4 sentence executive summary that covers:
1. Overall customer satisfaction and product quality
2. Key strengths mentioned by customers
3. Common concerns or weaknesses (if any)
4. Recommendation for potential buyers

Write in a professional, objective tone. Be specific and actionable."""

            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a professional product analyst specializing in customer review analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )

            summary = response.choices[0].message.content.strip()
            print(f"✅ OpenAI summary generated ({len(summary)} chars)")
            return summary

        except Exception as e:
            print(f"❌ OpenAI summary generation failed: {e}")
            return self._fallback_summary(reviews, product_info, sentiment_dist)

    def generate_insights(
        self,
        reviews: List[Dict[str, Any]],
        sentiment_dist: Dict[str, int],
        keywords: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate actionable insights using GPT"""
        if not self.is_available():
            return self._fallback_insights(reviews, sentiment_dist, keywords)

        try:
            total = len(reviews)
            positive_pct = (sentiment_dist.get('positive', 0) / total * 100) if total > 0 else 0
            negative_pct = (sentiment_dist.get('negative', 0) / total * 100) if total > 0 else 0

            top_keywords = [kw['word'] for kw in keywords[:10]]

            prompt = f"""Analyze this product's customer feedback and generate 5 key actionable insights.

Total Reviews: {total}
Positive Sentiment: {positive_pct:.1f}%
Negative Sentiment: {negative_pct:.1f}%
Top Keywords: {', '.join(top_keywords)}

Sample Reviews:
{chr(10).join([f"- {r.get('text', '')[:80]}..." for r in reviews[:5]])}

Generate exactly 5 bullet-point insights that:
1. Highlight the product's main strengths
2. Identify improvement opportunities
3. Note customer expectations
4. Suggest actionable recommendations
5. Provide competitive positioning insights

Format: Start each insight with an emoji and keep it under 100 characters."""

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a data analyst providing actionable business insights from customer reviews."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.7
            )

            insights_text = response.choices[0].message.content.strip()
            # Split by bullet points or newlines
            insights = [
                line.strip()
                for line in insights_text.split('\n')
                if line.strip() and (line.strip().startswith('-') or line.strip().startswith('•') or line.strip()[0].isdigit() or self._starts_with_emoji(line.strip()))
            ]

            # Clean up formatting
            insights = [
                insight.lstrip('-•0123456789. ').strip()
                for insight in insights
            ][:5]  # Limit to 5

            print(f"✅ OpenAI insights generated ({len(insights)} insights)")
            return insights if insights else self._fallback_insights(reviews, sentiment_dist, keywords)

        except Exception as e:
            print(f"❌ OpenAI insights generation failed: {e}")
            return self._fallback_insights(reviews, sentiment_dist, keywords)

    def _starts_with_emoji(self, text: str) -> bool:
        """Check if text starts with an emoji"""
        if not text:
            return False
        # Common emoji ranges in Unicode
        first_char = text[0]
        return ord(first_char) > 0x1F000

    def _fallback_summary(
        self,
        reviews: List[Dict[str, Any]],
        product_info: Dict[str, Any],
        sentiment_dist: Dict[str, int]
    ) -> str:
        """Fallback summary when OpenAI is unavailable"""
        total = len(reviews)
        positive = sentiment_dist.get('positive', 0)
        negative = sentiment_dist.get('negative', 0)
        positive_pct = (positive / total * 100) if total > 0 else 0
        avg_rating = sum(r.get('rating', 0) for r in reviews) / total if total > 0 else 0

        if positive_pct >= 75:
            sentiment_desc = "excellent customer satisfaction"
        elif positive_pct >= 60:
            sentiment_desc = "good customer satisfaction"
        elif positive_pct >= 40:
            sentiment_desc = "mixed customer feedback"
        else:
            sentiment_desc = "concerns from customers"

        return f"Based on {total} reviews, this product has an average rating of {avg_rating:.1f}/5 stars with {sentiment_desc}. {positive} customers reported positive experiences, while {negative} noted areas for improvement. The feedback suggests {'strong market performance' if positive_pct >= 70 else 'opportunity for product enhancement'}."

    def _fallback_insights(
        self,
        reviews: List[Dict[str, Any]],
        sentiment_dist: Dict[str, int],
        keywords: List[Dict[str, Any]]
    ) -> List[str]:
        """Fallback insights when OpenAI is unavailable"""
        insights = []
        total = len(reviews)
        positive_pct = (sentiment_dist.get('positive', 0) / total * 100) if total > 0 else 0
        negative_pct = (sentiment_dist.get('negative', 0) / total * 100) if total > 0 else 0

        # Sentiment-based insights
        if positive_pct > 70:
            insights.append(f"⭐ Excellent satisfaction: {positive_pct:.1f}% positive reviews indicate strong product quality")
        elif positive_pct > 50:
            insights.append(f"✅ Good performance: {positive_pct:.1f}% positive sentiment shows customer acceptance")
        else:
            insights.append(f"⚠️ Improvement needed: Only {positive_pct:.1f}% positive sentiment")

        if negative_pct > 30:
            insights.append(f"🔍 High negativity: {negative_pct:.1f}% negative reviews require attention")

        # Keyword insights
        if keywords:
            top_words = ", ".join([k['word'] for k in keywords[:3]])
            insights.append(f"🔤 Key topics: Customers frequently mention {top_words}")

        # Review volume insight
        if total > 100:
            insights.append(f"📊 Strong engagement: {total} reviews indicate high market interest")
        elif total < 20:
            insights.append(f"📊 Limited feedback: Only {total} reviews - more data needed for full analysis")

        # Rating consistency
        avg_rating = sum(r.get('rating', 0) for r in reviews) / total if total > 0 else 0
        if avg_rating >= 4.5:
            insights.append(f"🏆 Premium quality: {avg_rating:.1f}/5 average rating suggests excellent product")
        elif avg_rating >= 4.0:
            insights.append(f"👍 Above average: {avg_rating:.1f}/5 rating shows solid performance")

        return insights[:5]  # Return top 5


# Singleton instance
openai_service = OpenAIService()
