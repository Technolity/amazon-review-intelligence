"""
AI-powered insights generation with advanced NLP.
"""

import os
from typing import List, Dict, Any, Tuple
import openai
from transformers import pipeline
import torch
from app.core.config import settings

class AdvancedInsightGenerator:
    """Generate actionable business insights using AI."""
    
    def __init__(self):
        self.openai_client = None
        self._setup_models()
    
    def _setup_models(self):
        """Initialize AI models."""
        # OpenAI for advanced insights
        if os.getenv('OPENAI_API_KEY'):
            self.openai_client = openai.OpenAI(
                api_key=os.getenv('OPENAI_API_KEY')
            )
            print("✅ OpenAI client initialized for insights")
        
        # Initialize summarization model
        try:
            self.summarizer = pipeline(
                "summarization",
                model="facebook/bart-large-cnn",
                device=0 if torch.cuda.is_available() else -1
            )
            print("✅ BART summarization model loaded")
        except:
            self.summarizer = None
    
    def generate_comprehensive_insights(
        self, 
        analysis_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate comprehensive business insights.
        """
        # Extract key metrics
        sentiment = analysis_data.get('sentiment_distribution', {})
        emotions = analysis_data.get('emotion_analysis', {})
        topics = analysis_data.get('topic_modeling', {})
        keywords = analysis_data.get('keyword_analysis', {})
        segments = analysis_data.get('customer_segments', {})
        quality = analysis_data.get('quality_metrics', {})
        
        # Generate insights using multiple methods
        insights = {
            "executive_summary": self._generate_executive_summary(analysis_data),
            "strengths": self._identify_strengths(analysis_data),
            "weaknesses": self._identify_weaknesses(analysis_data),
            "opportunities": self._identify_opportunities(analysis_data),
            "threats": self._identify_threats(analysis_data),
            "recommendations": self._generate_recommendations(analysis_data),
            "action_items": self._generate_action_items(analysis_data),
            "competitive_advantages": self._identify_competitive_advantages(analysis_data),
            "customer_pain_points": self._extract_pain_points(analysis_data),
            "success_metrics": self._define_success_metrics(analysis_data)
        }
        
        # Add AI-generated insights if available
        if self.openai_client:
            insights["ai_insights"] = self._generate_ai_insights(analysis_data)
        
        return insights
    
    def _generate_executive_summary(self, data: Dict) -> Dict[str, Any]:
        """Generate executive summary."""
        sentiment = data.get('sentiment_distribution', {})
        emotions = data.get('emotion_analysis', {})
        
        summary = {
            "overview": f"Product shows {sentiment.get('positive', {}).get('percentage', 0)}% customer satisfaction",
            "sentiment_verdict": self._get_sentiment_verdict(sentiment),
            "emotional_profile": emotions.get('emotional_tone', 'neutral'),
            "key_findings": [],
            "risk_level": self._assess_risk_level(data)
        }
        
        # Add key findings
        if sentiment.get('positive', {}).get('percentage', 0) > 70:
            summary["key_findings"].append("High customer satisfaction indicates market fit")
        
        if emotions.get('dominant_emotions'):
            top_emotion = emotions['dominant_emotions'][0]['emotion']
            summary["key_findings"].append(f"Customers primarily express {top_emotion}")
        
        return summary
    
    def _identify_strengths(self, data: Dict) -> List[Dict]:
        """Identify product strengths."""
        strengths = []
        sentiment = data.get('sentiment_distribution', {})
        keywords = data.get('keyword_analysis', {}).get('top_keywords', [])
        
        # Sentiment-based strengths
        if sentiment.get('positive', {}).get('percentage', 0) > 60:
            strengths.append({
                "aspect": "Customer Satisfaction",
                "evidence": f"{sentiment['positive']['percentage']}% positive reviews",
                "impact": "high",
                "confidence": 0.9
            })
        
        # Keyword-based strengths
        positive_keywords = ['excellent', 'great', 'love', 'perfect', 'amazing']
        for kw in keywords:
            if any(pos in kw['word'].lower() for pos in positive_keywords):
                strengths.append({
                    "aspect": f"Positive perception of {kw['word']}",
                    "evidence": f"Mentioned {kw['frequency']} times",
                    "impact": "medium",
                    "confidence": 0.7
                })
        
        return strengths[:5]
    
    def _identify_weaknesses(self, data: Dict) -> List[Dict]:
        """Identify product weaknesses."""
        weaknesses = []
        sentiment = data.get('sentiment_distribution', {})
        emotions = data.get('emotion_analysis', {})
        
        # High negative sentiment
        if sentiment.get('negative', {}).get('percentage', 0) > 30:
            weaknesses.append({
                "aspect": "Customer Dissatisfaction",
                "severity": "high",
                "evidence": f"{sentiment['negative']['percentage']}% negative reviews",
                "suggested_action": "Investigate root causes of dissatisfaction"
            })
        
        # Negative emotions
        negative_emotions = ['anger', 'disgust', 'disappointment', 'frustration']
        if emotions.get('dominant_emotions'):
            for emotion_data in emotions['dominant_emotions']:
                if emotion_data['emotion'] in negative_emotions:
                    weaknesses.append({
                        "aspect": f"Customer {emotion_data['emotion']}",
                        "severity": "medium",
                        "evidence": f"{emotion_data['percentage']}% express this emotion",
                        "suggested_action": f"Address factors causing {emotion_data['emotion']}"
                    })
        
        return weaknesses[:5]
    
    def _identify_opportunities(self, data: Dict) -> List[Dict]:
        """Identify market opportunities."""
        opportunities = []
        segments = data.get('customer_segments', {})
        topics = data.get('topic_modeling', {}).get('topics', [])
        
        # Segment opportunities
        if segments.get('enthusiasts', {}).get('percentage', 0) > 30:
            opportunities.append({
                "opportunity": "Leverage Brand Advocates",
                "rationale": f"{segments['enthusiasts']['percentage']}% are enthusiastic supporters",
                "potential_impact": "Create referral program or testimonial campaign",
                "priority": "high"
            })
        
        # Topic-based opportunities
        for topic in topics[:2]:
            opportunities.append({
                "opportunity": f"Enhance {topic.get('theme', 'Unknown')} features",
                "rationale": f"High customer interest in this area",
                "potential_impact": "Increase satisfaction and differentiation",
                "priority": "medium"
            })
        
        return opportunities
    
    def _identify_threats(self, data: Dict) -> List[Dict]:
        """Identify potential threats."""
        threats = []
        sentiment = data.get('sentiment_distribution', {})
        quality = data.get('quality_metrics', {})
        
        # Declining satisfaction
        if sentiment.get('negative', {}).get('percentage', 0) > 40:
            threats.append({
                "threat": "High Dissatisfaction Rate",
                "severity": "critical",
                "impact": "Risk of customer churn and negative word-of-mouth",
                "mitigation": "Immediate quality improvement initiative"
            })
        
        # Low review quality
        if quality.get('average_quality_score', 10) < 5:
            threats.append({
                "threat": "Low Review Authenticity",
                "severity": "medium",
                "impact": "Reduced trust in product reviews",
                "mitigation": "Encourage verified purchases and detailed reviews"
            })
        
        return threats
    
    def _generate_recommendations(self, data: Dict) -> List[Dict]:
        """Generate actionable recommendations."""
        recommendations = []
        
        sentiment = data.get('sentiment_distribution', {})
        emotions = data.get('emotion_analysis', {})
        segments = data.get('customer_segments', {})
        
        # Sentiment-based recommendations
        if sentiment.get('negative', {}).get('percentage', 0) > 25:
            recommendations.append({
                "priority": 1,
                "recommendation": "Address negative feedback patterns",
                "action": "Conduct root cause analysis of complaints",
                "expected_outcome": "Reduce negative reviews by 30%",
                "timeline": "30 days",
                "resources_needed": "QA team, customer feedback analysis"
            })
        
        # Emotion-based recommendations
        if emotions.get('emotional_tone') == 'negative':
            recommendations.append({
                "priority": 2,
                "recommendation": "Improve emotional connection with customers",
                "action": "Enhance customer service and product experience",
                "expected_outcome": "Shift emotional tone to positive",
                "timeline": "60 days",
                "resources_needed": "Customer service training, UX improvements"
            })
        
        # Segment-based recommendations
        if segments.get('critics', {}).get('percentage', 0) > 20:
            recommendations.append({
                "priority": 3,
                "recommendation": "Convert critics to advocates",
                "action": "Targeted outreach and issue resolution for dissatisfied customers",
                "expected_outcome": "Reduce critic segment by 50%",
                "timeline": "90 days",
                "resources_needed": "Customer success team"
            })
        
        return recommendations[:5]
    
    def _generate_action_items(self, data: Dict) -> List[Dict]:
        """Generate specific action items."""
        action_items = []
        
        # Based on insights
        insights = data.get('insights', [])
        
        for i, insight in enumerate(insights[:3]):
            action_items.append({
                "id": f"action_{i+1}",
                "action": f"Investigate: {insight}",
                "owner": "Product Team",
                "deadline": "2 weeks",
                "status": "pending"
            })
        
        # Add standard action items
        action_items.extend([
            {
                "id": "action_monitor",
                "action": "Set up continuous sentiment monitoring",
                "owner": "Analytics Team",
                "deadline": "1 week",
                "status": "pending"
            },
            {
                "id": "action_report",
                "action": "Create monthly review analysis report",
                "owner": "Marketing Team",
                "deadline": "Monthly",
                "status": "recurring"
            }
        ])
        
        return action_items
    
    def _identify_competitive_advantages(self, data: Dict) -> List[str]:
        """Identify competitive advantages."""
        advantages = []
        
        sentiment = data.get('sentiment_distribution', {})
        keywords = data.get('keyword_analysis', {}).get('top_keywords', [])
        
        if sentiment.get('positive', {}).get('percentage', 0) > 70:
            advantages.append("Superior customer satisfaction compared to industry average")
        
        # Look for unique features in keywords
        unique_features = ['innovative', 'unique', 'best', 'superior', 'advanced']
        for kw in keywords:
            if any(feat in kw['word'].lower() for feat in unique_features):
                advantages.append(f"Differentiation through {kw['word']}")
        
        return advantages[:3]
    
    def _extract_pain_points(self, data: Dict) -> List[Dict]:
        """Extract customer pain points."""
        pain_points = []
        
        keywords = data.get('keyword_analysis', {}).get('top_keywords', [])
        emotions = data.get('emotion_analysis', {})
        
        # Negative keyword patterns
        negative_patterns = ['problem', 'issue', 'broken', 'defect', 'poor', 'bad']
        
        for kw in keywords:
            if any(pattern in kw['word'].lower() for pattern in negative_patterns):
                pain_points.append({
                    "pain_point": kw['word'],
                    "frequency": kw['frequency'],
                    "severity": "high" if kw['frequency'] > 10 else "medium"
                })
        
        # Emotion-based pain points
        if emotions.get('dominant_emotions'):
            for emotion in emotions['dominant_emotions']:
                if emotion['emotion'] in ['anger', 'frustration', 'disappointment']:
                    pain_points.append({
                        "pain_point": f"Causing customer {emotion['emotion']}",
                        "frequency": f"{emotion['percentage']}% of reviews",
                        "severity": "high"
                    })
        
        return pain_points[:5]
    
    def _define_success_metrics(self, data: Dict) -> Dict[str, Any]:
        """Define success metrics and KPIs."""
        current_sentiment = data.get('sentiment_distribution', {})
        
        return {
            "current_metrics": {
                "satisfaction_rate": current_sentiment.get('positive', {}).get('percentage', 0),
                "average_rating": current_sentiment.get('average_rating', 0),
                "review_quality": data.get('quality_metrics', {}).get('average_quality_score', 0)
            },
            "target_metrics": {
                "satisfaction_rate": min(current_sentiment.get('positive', {}).get('percentage', 0) + 20, 90),
                "average_rating": min(current_sentiment.get('average_rating', 0) + 0.5, 4.5),
                "review_quality": min(data.get('quality_metrics', {}).get('average_quality_score', 0) + 2, 9)
            },
            "monitoring_frequency": "Weekly",
            "reporting_cadence": "Monthly"
        }
    
    def _generate_ai_insights(self, data: Dict) -> str:
        """Generate insights using OpenAI."""
        if not self.openai_client:
            return "AI insights not available"
        
        try:
            prompt = self._build_ai_prompt(data)
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4" if "gpt-4" in os.getenv('OPENAI_MODEL', '') else "gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert business analyst specializing in customer feedback analysis and strategic insights."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"⚠️ AI insight generation failed: {e}")
            return "AI insights generation failed"
    
    def _build_ai_prompt(self, data: Dict) -> str:
        """Build prompt for AI insights."""
        sentiment = data.get('sentiment_distribution', {})
        emotions = data.get('emotion_analysis', {})
        
        prompt = f"""
        Analyze this customer review data and provide strategic business insights:
        
        Sentiment Analysis:
        - Positive: {sentiment.get('positive', {}).get('percentage', 0)}%
        - Negative: {sentiment.get('negative', {}).get('percentage', 0)}%
        - Average Rating: {sentiment.get('average_rating', 0)}
        
        Emotional Profile:
        - Tone: {emotions.get('emotional_tone', 'unknown')}
        - Top Emotions: {[e['emotion'] for e in emotions.get('dominant_emotions', [])[:3]]}
        
        Provide:
        1. Strategic interpretation
        2. Hidden opportunities
        3. Risk factors to monitor
        4. Competitive positioning insights
        
        Be specific and actionable.
        """
        
        return prompt
    
    def _get_sentiment_verdict(self, sentiment: Dict) -> str:
        """Get sentiment verdict."""
        pos = sentiment.get('positive', {}).get('percentage', 0)
        neg = sentiment.get('negative', {}).get('percentage', 0)
        
        if pos > 80:
            return "Exceptional - Strong market acceptance"
        elif pos > 60:
            return "Positive - Good customer reception"
        elif pos > 40:
            return "Mixed - Room for improvement"
        elif neg > 50:
            return "Concerning - Significant issues present"
        else:
            return "Critical - Urgent attention required"
    
    def _assess_risk_level(self, data: Dict) -> str:
        """Assess overall risk level."""
        sentiment = data.get('sentiment_distribution', {})
        neg_pct = sentiment.get('negative', {}).get('percentage', 0)
        
        if neg_pct > 50:
            return "HIGH - Immediate action required"
        elif neg_pct > 30:
            return "MEDIUM - Monitor closely"
        elif neg_pct > 15:
            return "LOW - Normal range"
        else:
            return "MINIMAL - Excellent performance"


# Singleton instance
insight_generator = AdvancedInsightGenerator()
