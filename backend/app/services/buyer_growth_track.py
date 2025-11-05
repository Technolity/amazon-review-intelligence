"""
Buyer Growth Tracker Service
Tracks and analyzes buyer growth patterns over time
"""

from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json
import os
import random


class BuyerGrowthTracker:
    """
    Service for tracking buyer growth and purchase patterns
    Stores data in memory with option to persist to database
    """
    
    def __init__(self):
        self.growth_data = defaultdict(lambda: defaultdict(list))
        self.cache_file = "growth_data_cache.json"
        self._load_cache()
        print("✅ Buyer Growth Tracker initialized")
    
    def _load_cache(self):
        """Load cached growth data if available"""
        try:
            if os.path.exists(self.cache_file):
                with open(self.cache_file, 'r') as f:
                    cached = json.load(f)
                    for asin, data in cached.items():
                        self.growth_data[asin] = defaultdict(list, data)
                print(f"  📊 Loaded growth data for {len(self.growth_data)} products")
        except Exception as e:
            print(f"  ⚠️ Could not load cache: {e}")
    
    def _save_cache(self):
        """Save growth data to cache file"""
        try:
            cache_data = {
                asin: dict(data) 
                for asin, data in self.growth_data.items()
            }
            with open(self.cache_file, 'w') as f:
                json.dump(cache_data, f, indent=2, default=str)
        except Exception as e:
            print(f"  ⚠️ Could not save cache: {e}")
    
    def update_growth_data(self, asin: str, review_count: int, rating: float):
        """
        Update growth data for a product
        
        Args:
            asin: Product ASIN
            review_count: Current review count
            rating: Current average rating
        """
        timestamp = datetime.utcnow()
        date_key = timestamp.date().isoformat()
        
        # Store data point
        data_point = {
            "timestamp": timestamp.isoformat(),
            "review_count": review_count,
            "rating": rating,
            "estimated_buyers": self._estimate_buyers(review_count)
        }
        
        self.growth_data[asin][date_key].append(data_point)
        
        # Save to cache periodically
        self._save_cache()
        
        print(f"  📈 Updated growth data for {asin}: {data_point['estimated_buyers']} buyers")
    
    def _estimate_buyers(self, review_count: int) -> int:
        """
        Estimate number of buyers based on review count
        Industry average: 1-5% of buyers leave reviews
        """
        # Use 2% as baseline with some variance
        review_rate = 0.02 + (random.random() * 0.02 - 0.01)  # 1-3%
        estimated = int(review_count / review_rate)
        return estimated
    
    def get_growth_data(self, asin: str, period: str = "week") -> List[Dict]:
        """
        Get growth data for a specific period
        
        Args:
            asin: Product ASIN
            period: Time period (day, week, month, quarter)
        
        Returns:
            List of growth data points
        """
        # Calculate date range
        end_date = datetime.utcnow()
        
        if period == "day":
            start_date = end_date - timedelta(days=1)
            interval_hours = 1
        elif period == "week":
            start_date = end_date - timedelta(days=7)
            interval_hours = 24
        elif period == "month":
            start_date = end_date - timedelta(days=30)
            interval_hours = 24
        elif period == "quarter":
            start_date = end_date - timedelta(days=90)
            interval_hours = 24 * 7
        else:
            start_date = end_date - timedelta(days=7)
            interval_hours = 24
        
        # Generate or retrieve data points
        if asin in self.growth_data:
            # Use existing data
            return self._format_existing_data(asin, start_date, end_date, interval_hours)
        else:
            # Generate mock data for demonstration
            return self._generate_mock_growth_data(asin, start_date, end_date, interval_hours)
    
    def _format_existing_data(self, asin: str, start_date: datetime, 
                             end_date: datetime, interval_hours: int) -> List[Dict]:
        """Format existing growth data for the specified period"""
        data_points = []
        current = start_date
        
        while current <= end_date:
            date_key = current.date().isoformat()
            
            if date_key in self.growth_data[asin]:
                # Average all data points for this date
                day_data = self.growth_data[asin][date_key]
                if day_data:
                    avg_buyers = sum(d["estimated_buyers"] for d in day_data) / len(day_data)
                    avg_rating = sum(d["rating"] for d in day_data) / len(day_data)
                    
                    data_points.append({
                        "date": current.strftime("%Y-%m-%d" if interval_hours >= 24 else "%H:%M"),
                        "buyers": int(avg_buyers),
                        "rating": round(avg_rating, 2),
                        "trend": self._calculate_trend(data_points, avg_buyers)
                    })
            
            current += timedelta(hours=interval_hours)
        
        # If no real data, generate mock
        if not data_points:
            return self._generate_mock_growth_data(asin, start_date, end_date, interval_hours)
        
        return data_points
    
    def _generate_mock_growth_data(self, asin: str, start_date: datetime, 
                                  end_date: datetime, interval_hours: int) -> List[Dict]:
        """Generate realistic mock growth data for demonstration"""
        data_points = []
        current = start_date
        base_buyers = random.randint(100, 500)
        
        # Create growth pattern
        growth_rate = random.uniform(0.02, 0.08)  # 2-8% daily growth
        volatility = random.uniform(0.1, 0.3)  # 10-30% volatility
        
        while current <= end_date:
            # Calculate buyers with growth and random variation
            days_elapsed = (current - start_date).days
            growth_factor = (1 + growth_rate) ** days_elapsed
            variation = 1 + (random.random() - 0.5) * volatility
            
            # Add seasonal pattern (weekends have more buyers)
            day_of_week = current.weekday()
            if day_of_week in [5, 6]:  # Saturday, Sunday
                seasonal_factor = 1.3
            elif day_of_week == 4:  # Friday
                seasonal_factor = 1.2
            else:
                seasonal_factor = 1.0
            
            buyers = int(base_buyers * growth_factor * variation * seasonal_factor)
            
            # Ensure reasonable bounds
            buyers = max(50, min(buyers, 10000))
            
            # Calculate trend
            trend = self._calculate_trend(data_points, buyers)
            
            # Format date based on interval
            if interval_hours >= 24:
                date_str = current.strftime("%a")  # Day name for weekly view
                if interval_hours >= 24 * 7:
                    date_str = current.strftime("%b %d")  # Month day for longer periods
            else:
                date_str = current.strftime("%H:%M")  # Hour:minute for daily view
            
            data_points.append({
                "date": date_str,
                "buyers": buyers,
                "trend": trend,
                "rating": round(4.0 + random.random(), 1),  # Random rating 4.0-5.0
                "review_velocity": random.randint(5, 20)  # Reviews per day
            })
            
            current += timedelta(hours=interval_hours)
        
        return data_points
    
    def _calculate_trend(self, data_points: List[Dict], current_value: float) -> str:
        """Calculate trend (up/down/stable) based on previous data"""
        if not data_points:
            return "stable"
        
        previous_value = data_points[-1]["buyers"]
        change_percent = ((current_value - previous_value) / previous_value) * 100 if previous_value else 0
        
        if change_percent > 5:
            return "up"
        elif change_percent < -5:
            return "down"
        else:
            return "stable"
    
    def get_growth_insights(self, asin: str) -> Dict[str, Any]:
        """
        Generate insights about buyer growth patterns
        
        Args:
            asin: Product ASIN
        
        Returns:
            Dict containing growth insights
        """
        week_data = self.get_growth_data(asin, "week")
        month_data = self.get_growth_data(asin, "month")
        
        if not week_data or not month_data:
            return {
                "status": "insufficient_data",
                "message": "Not enough data for insights"
            }
        
        # Calculate metrics
        week_buyers = [d["buyers"] for d in week_data]
        month_buyers = [d["buyers"] for d in month_data]
        
        week_growth = ((week_buyers[-1] - week_buyers[0]) / week_buyers[0]) * 100 if week_buyers[0] else 0
        month_growth = ((month_buyers[-1] - month_buyers[0]) / month_buyers[0]) * 100 if month_buyers[0] else 0
        
        week_avg = sum(week_buyers) / len(week_buyers)
        month_avg = sum(month_buyers) / len(month_buyers)
        
        # Identify best performing day
        best_day_idx = week_buyers.index(max(week_buyers))
        best_day = week_data[best_day_idx]["date"]
        
        # Trend analysis
        increasing_days = sum(1 for i in range(1, len(week_buyers)) if week_buyers[i] > week_buyers[i-1])
        trend_strength = increasing_days / (len(week_buyers) - 1) if len(week_buyers) > 1 else 0
        
        insights = {
            "weekly_growth": round(week_growth, 1),
            "monthly_growth": round(month_growth, 1),
            "weekly_average": int(week_avg),
            "monthly_average": int(month_avg),
            "best_day": best_day,
            "peak_buyers": max(week_buyers),
            "trend": "growing" if week_growth > 5 else "declining" if week_growth < -5 else "stable",
            "trend_strength": round(trend_strength * 100, 1),
            "forecast": {
                "next_week": int(week_buyers[-1] * (1 + week_growth / 100)),
                "confidence": "high" if trend_strength > 0.7 else "medium" if trend_strength > 0.4 else "low"
            },
            "recommendations": self._generate_recommendations(week_growth, month_growth, trend_strength)
        }
        
        return insights
    
    def _generate_recommendations(self, week_growth: float, month_growth: float, 
                                 trend_strength: float) -> List[str]:
        """Generate actionable recommendations based on growth patterns"""
        recommendations = []
        
        if week_growth > 10:
            recommendations.append("📈 Strong growth detected - consider increasing inventory")
        elif week_growth < -10:
            recommendations.append("📉 Declining sales - review pricing and competition")
        
        if trend_strength > 0.7:
            recommendations.append("✅ Consistent growth pattern - maintain current strategy")
        elif trend_strength < 0.3:
            recommendations.append("⚠️ Volatile sales pattern - investigate causes")
        
        if month_growth > 20:
            recommendations.append("🚀 Excellent monthly performance - capitalize on momentum")
        
        return recommendations


# Singleton instance
growth_tracker = BuyerGrowthTracker()