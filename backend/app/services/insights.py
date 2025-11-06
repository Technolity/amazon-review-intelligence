import openai
import os
from typing import List, Dict, Any
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class InsightGenerator:
    def __init__(self):
        self.client = None
        self._setup_openai()
    
    def _setup_openai(self):
        """Setup OpenAI client"""
        try:
            if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY != "your_openai_api_key_here":
                openai.api_key = settings.OPENAI_API_KEY
                self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("✅ OpenAI client initialized")
            else:
                logger.warning("⚠️ OpenAI API key not configured - using mock insights")
        except Exception as e:
            logger.error(f"❌ Error setting up OpenAI: {e}")
    
    def generate_insights(self, analysis_data: Dict[str, Any], style: str = "professional") -> Dict[str, Any]:
        """
        Generate AI-powered insights from analysis data
        """
        if not self.client:
            return self._generate_mock_insights(analysis_data, style)
        
        try:
            prompt = self._build_insight_prompt(analysis_data, style)
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert market analyst specializing in customer review analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            insights_text = response.choices[0].message.content.strip()
            return self._parse_insights_response(insights_text, analysis_data)
            
        except Exception as e:
            logger.error(f"Error generating AI insights: {e}")
            return self._generate_mock_insights(analysis_data, style)
    
    def _build_insight_prompt(self, analysis_data: Dict[str, Any], style: str) -> str:
        """Build the prompt for insight generation"""
        
        base_prompt = f"""
        Analyze these Amazon review insights and provide {style} business intelligence:
        
        OVERVIEW:
        - Total Reviews: {analysis_data.get('reviews_analyzed', 0)}
        - Overall Sentiment: {analysis_data.get('overall_sentiment', {})}
        - Top Emotions: {analysis_data.get('top_emotions', [])}
        
        THEMES:
        {self._format_themes_for_prompt(analysis_data.get('themes', []))}
        
        Please provide:
        1. EXECUTIVE SUMMARY: 2-3 sentence overview of customer sentiment
        2. KEY STRENGTHS: What customers love about the product
        3. AREAS FOR IMPROVEMENT: What needs to be fixed
        4. ACTIONABLE RECOMMENDATIONS: Specific suggestions for the business
        
        Format the response clearly with section headers.
        """
        
        return base_prompt
    
    def _format_themes_for_prompt(self, themes: List[Dict]) -> str:
        """Format themes for the prompt"""
        if not themes:
            return "No distinct themes identified."
        
        theme_descriptions = []
        for theme in themes[:5]:  # Top 5 themes
            sentiment = "positive" if theme.get('sentiment_score', 3) > 3.5 else "negative" if theme.get('sentiment_score', 3) < 2.5 else "neutral"
            theme_descriptions.append(
                f"- {theme.get('theme', 'Unknown')}: {theme.get('size', 0)} reviews, {sentiment} sentiment, keywords: {', '.join(theme.get('keywords', []))}"
            )
        
        return "\n".join(theme_descriptions)
    
    def _parse_insights_response(self, insights_text: str, analysis_data: Dict) -> Dict[str, Any]:
        """Parse the AI response into structured insights"""
        return {
            "analysis_id": analysis_data.get("analysis_id", "unknown"),
            "insight_summary": insights_text,
            "key_insights": self._extract_key_insights(insights_text),
            "recommendations": self._extract_recommendations(insights_text),
            "generated_by": "openai"
        }
    
    def _extract_key_insights(self, text: str) -> List[str]:
        """Extract key insights from AI response"""
        # Simple extraction - can be enhanced
        lines = text.split('\n')
        insights = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('#') and len(line) > 20:
                insights.append(line)
                if len(insights) >= 5:
                    break
        return insights[:3]  # Return top 3
    
    def _extract_recommendations(self, text: str) -> List[str]:
        """Extract recommendations from AI response"""
        lines = text.split('\n')
        recommendations = []
        for line in lines:
            line = line.strip().lower()
            if any(keyword in line for keyword in ['recommend', 'suggest', 'should', 'consider']):
                recommendations.append(line.capitalize())
        return recommendations[:3] or ["Analyze more reviews for specific recommendations"]
    
    def _generate_mock_insights(self, analysis_data: Dict[str, Any], style: str) -> Dict[str, Any]:
        """Generate mock insights when OpenAI is not available"""
        total_reviews = analysis_data.get('reviews_analyzed', 0)
        overall_sentiment = analysis_data.get('overall_sentiment', {})
        
        positive_pct = overall_sentiment.get('positive', 0) * 100
        negative_pct = overall_sentiment.get('negative', 0) * 100
        
        if positive_pct > 70:
            sentiment_verdict = "very positive"
            strength = "product quality and customer satisfaction"
            improvement = "minor aspects like packaging or delivery"
        elif positive_pct > 50:
            sentiment_verdict = "generally positive"
            strength = "core functionality"
            improvement = "some quality control issues"
        else:
            sentiment_verdict = "mixed or negative"
            strength = "potential in the product concept"
            improvement = "significant quality and service issues"
        
        mock_insights = f"""
        EXECUTIVE SUMMARY:
        Analysis of {total_reviews} customer reviews reveals {sentiment_verdict} sentiment. 
        {positive_pct:.1f}% of customers are satisfied with their purchase.
        
        KEY STRENGTHS:
        Customers appreciate the {strength}. Positive reviews highlight good value and performance.
        
        AREAS FOR IMPROVEMENT:
        Focus on {improvement} mentioned in critical reviews.
        
        RECOMMENDATIONS:
        Leverage positive feedback in marketing and address common concerns raised in negative reviews.
        """
        
        return {
            "analysis_id": analysis_data.get("analysis_id", "unknown"),
            "insight_summary": mock_insights.strip(),
            "key_insights": [
                f"Customer satisfaction rate: {positive_pct:.1f}%",
                f"Key concerns relate to {improvement}",
                "Product shows potential for market success"
            ],
            "recommendations": [
                "Highlight positive aspects in product marketing",
                "Address quality issues mentioned in negative reviews",
                "Monitor customer feedback continuously"
            ],
            "generated_by": "mock_analysis"
        }