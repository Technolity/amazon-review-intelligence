'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, TrendingUp, Activity, Heart, Star, Eye,
  MessageSquare, ThumbsUp, Clock, Sparkles
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart,
  Scatter, ZAxis
} from 'recharts';
import type { AnalysisResult } from '@/types';
import { cn } from '@/lib/utils';

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
  aiEnabled?: boolean;
}

// Premium color palette
const COLORS = {
  primary: '#8b5cf6',
  secondary: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  orange: '#f97316',
  gradient1: '#8b5cf6',
  gradient2: '#ec4899',
};

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#a3e635', '#22c55e'];

// Data interfaces
interface KeywordData {
  word: string;
  frequency: number;
  sentiment: string;
  size?: number;
}

interface ThemeData {
  theme: string;
  mentions: number;
  sentiment: string;
  fill: string;
}

interface EmotionData {
  emotion: string;
  value: number;
  fullMark: number;
}

interface RatingDistData {
  rating: string;
  count: number;
  percentage: number;
  fill: string;
}

interface SentimentTrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

interface SentimentPieData {
  name: string;
  value: number;
  fill: string;
}

// Custom Tooltips
const KeywordTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-2 md:p-3 shadow-lg">
        <p className="font-semibold text-xs sm:text-sm md:text-base text-foreground">{payload[0].payload.word}</p>
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
          Mentioned {payload[0].payload.frequency} times
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div
            className="w-2 h-2 md:w-3 md:h-3 rounded-full"
            style={{ backgroundColor: payload[0].fill }}
          />
          <span className="text-[9px] sm:text-[10px] md:text-xs capitalize">
            {payload[0].payload.sentiment || 'neutral'} sentiment
          </span>
        </div>
      </div>
    );
  }
  return null;
};

const EmotionTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-sm mb-1">{payload[0].payload.emotion}</p>
        <p className="text-xs text-muted-foreground">
          Intensity: <span className="font-bold text-primary">{(payload[0].value * 100).toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const RatingTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-sm">{payload[0].payload.rating} Stars</p>
        <p className="text-xs text-muted-foreground mt-1">
          Count: <span className="font-bold">{payload[0].payload.count}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Percentage: <span className="font-bold text-primary">{payload[0].payload.percentage.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const SentimentTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-xl">
        <p className="font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="capitalize">{entry.name}</span>
            </div>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Animated Bar Component
const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, ...rest } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g>
      <rect
        x={x}
        y={isHovered ? y - 8 : y}
        width={width}
        height={height}
        fill={fill}
        rx={8}
        className="transition-all duration-300 ease-out cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...rest}
      />
    </g>
  );
};

// Active Dot with Pulse
const ActiveDot = (props: any) => {
  const { cx, cy, fill } = props;
  return (
    <g>
      <circle cx={cx} cy={cy} r={4} fill={fill} className="animate-pulse" />
      <circle cx={cx} cy={cy} r={6} fill={fill} opacity={0.3} />
    </g>
  );
};

export default function GraphArea({ analysis, isLoading, onViewDetails, aiEnabled }: GraphAreaProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Detect device
  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Process data
  const { 
    keywordData, 
    themeData, 
    emotionData, 
    ratingDistData,
    sentimentPieData,
    sentimentTrendData,
    stats 
  } = useMemo(() => {
    if (!analysis) {
      return {
        keywordData: [],
        themeData: [],
        emotionData: [],
        ratingDistData: [],
        sentimentPieData: [],
        sentimentTrendData: [],
        stats: { avgRating: 0, totalReviews: 0, positivePercent: 0, negativePercent: 0, neutralPercent: 0 }
      };
    }

    // Keywords
    const keywords: KeywordData[] = (analysis.top_keywords || []).map(kw => ({
      word: kw.word,
      frequency: kw.frequency,
      sentiment: kw.sentiment || 'neutral',
      size: Math.min(kw.frequency * 5, 100)
    }));

    // Themes
    const themes: ThemeData[] = (analysis.themes || []).map((theme, idx) => ({
      theme: theme.theme,
      mentions: theme.mentions,
      sentiment: theme.sentiment || 'neutral',
      fill: [COLORS.primary, COLORS.secondary, COLORS.info, COLORS.success, COLORS.warning, COLORS.danger][idx % 6]
    }));

    // Emotions (if available)
    const emotions: EmotionData[] = analysis.emotions ? Object.entries(analysis.emotions).map(([key, value]) => ({
      emotion: key.charAt(0).toUpperCase() + key.slice(1),
      value: typeof value === 'number' ? value : 0,
      fullMark: 1
    })) : [];

    // Rating Distribution
    const ratingDist = analysis.rating_distribution || {};
    const totalRatings = Object.values(ratingDist).reduce((sum: number, count) => sum + (typeof count === 'number' ? count : 0), 0);
    
    const ratingDistribution: RatingDistData[] = [5, 4, 3, 2, 1].map((rating, idx) => {
      // Fix TypeScript indexing - use string keys
      const numKey = rating.toString() as '5' | '4' | '3' | '2' | '1';
      const starKey = `${rating}_star` as '5_star' | '4_star' | '3_star' | '2_star' | '1_star';
      const count = ratingDist[numKey] || ratingDist[starKey] || 0;
      return {
        rating: `${rating}★`,
        count: typeof count === 'number' ? count : 0,
        percentage: totalRatings > 0 ? ((typeof count === 'number' ? count : 0) / totalRatings) * 100 : 0,
        fill: RATING_COLORS[4 - idx]
      };
    });

    // Sentiment Pie Data
    const sentDist = analysis.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };
    const sentTotal = sentDist.positive + sentDist.neutral + sentDist.negative;
    
    const sentimentPie: SentimentPieData[] = [
      { name: 'Positive', value: sentDist.positive, fill: COLORS.positive },
      { name: 'Neutral', value: sentDist.neutral, fill: COLORS.neutral },
      { name: 'Negative', value: sentDist.negative, fill: COLORS.negative }
    ].filter(item => item.value > 0);

    // Sentiment Trend (mock data for now - would need temporal data from backend)
    const reviews = analysis.reviews || [];
    const dateMap = new Map<string, { positive: number; negative: number; neutral: number }>();
    
    reviews.forEach(review => {
      const date = review.date ? new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
      if (!dateMap.has(date)) {
        dateMap.set(date, { positive: 0, negative: 0, neutral: 0 });
      }
      const counts = dateMap.get(date)!;
      const sentiment = review.sentiment || (review.rating >= 4 ? 'positive' : review.rating <= 2 ? 'negative' : 'neutral');
      counts[sentiment as keyof typeof counts]++;
    });

    const sentimentTrend: SentimentTrendData[] = Array.from(dateMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .slice(0, 10);

    // Stats
    const avgRating = analysis.average_rating || 0;
    const totalReviews = analysis.total_reviews || 0;
    const positivePercent = sentTotal > 0 ? (sentDist.positive / sentTotal) * 100 : 0;
    const negativePercent = sentTotal > 0 ? (sentDist.negative / sentTotal) * 100 : 0;
    const neutralPercent = sentTotal > 0 ? (sentDist.neutral / sentTotal) * 100 : 0;

    return {
      keywordData: keywords,
      themeData: themes,
      emotionData: emotions,
      ratingDistData: ratingDistribution,
      sentimentPieData: sentimentPie,
      sentimentTrendData: sentimentTrend,
      stats: { avgRating, totalReviews, positivePercent, negativePercent, neutralPercent }
    };
  }, [analysis]);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] gap-3 sm:gap-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 border-primary" />
            <div className="space-y-1 sm:space-y-2 text-center">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">Analyzing Reviews...</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                This may take a few moments
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Empty state
  if (!analysis) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[50vh] sm:min-h-[60vh] gap-4 sm:gap-6 text-center px-3 sm:px-4">
            <div className="rounded-full bg-muted/50 p-3 sm:p-4 md:p-6">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-primary/80" />
            </div>
            <div className="space-y-2 sm:space-y-3 max-w-md">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">No Analysis Yet</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                Enter an Amazon ASIN in the sidebar to start analyzing product reviews
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Main render
  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6">
        
        {/* Header Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Total Reviews</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {stats.totalReviews}
              </CardTitle>
            </CardHeader>
            <MessageSquare className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-blue-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-yellow-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Average Rating</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold flex items-center gap-1 sm:gap-2">
                {stats.avgRating.toFixed(1)}
                <Star className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-yellow-500 text-yellow-500" />
              </CardTitle>
            </CardHeader>
            <Star className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-yellow-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Positive Sentiment</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {stats.positivePercent.toFixed(0)}%
              </CardTitle>
            </CardHeader>
            <ThumbsUp className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-green-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Key Themes</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {themeData.length}
              </CardTitle>
            </CardHeader>
            <Activity className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-purple-500/20" />
          </Card>
        </div>

        {/* Main Charts - Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9 md:h-10">
            <TabsTrigger value="overview" className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-1.5 sm:px-2 py-1.5 sm:py-2 md:py-2.5">
              <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-0 sm:mr-1 md:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-1.5 sm:px-2 py-1.5 sm:py-2 md:py-2.5">
              <Activity className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-0 sm:mr-1 md:mr-2" />
              <span className="hidden sm:inline">Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="emotions" className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-1.5 sm:px-2 py-1.5 sm:py-2 md:py-2.5">
              <Heart className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-0 sm:mr-1 md:mr-2" />
              <span className="hidden sm:inline">Emotions</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              
              {/* Rating Distribution */}
              {ratingDistData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 md:h-5 md:w-5 text-yellow-500 fill-yellow-500" />
                      Rating Distribution
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Breakdown of star ratings
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : isTablet ? 300 : 350}>
                      <BarChart data={ratingDistData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis type="number" tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <YAxis dataKey="rating" type="category" tick={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12 }} />
                        <Tooltip content={<RatingTooltip />} />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]} shape={<AnimatedBar />}>
                          {ratingDistData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Sentiment Pie Chart */}
              {sentimentPieData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2">
                      <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      Sentiment Split
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Overall sentiment distribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 250 : isTablet ? 300 : 350}>
                      <PieChart>
                        <Pie
                          data={sentimentPieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={isMobile ? 70 : isTablet ? 90 : 110}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {sentimentPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Keywords */}
              {keywordData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 lg:col-span-2">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      Top Keywords
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Most frequently mentioned terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 280 : isTablet ? 340 : 400}>
                      <BarChart data={keywordData.slice(0, 10)} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis
                          dataKey="word"
                          angle={isMobile ? -45 : -30}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <Tooltip content={<KeywordTooltip />} />
                        <Bar dataKey="frequency" radius={[8, 8, 0, 0]} shape={<AnimatedBar />}>
                          {keywordData.slice(0, 10).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.sentiment === 'positive' ? COLORS.positive : entry.sentiment === 'negative' ? COLORS.negative : COLORS.neutral}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Themes */}
              {themeData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 lg:col-span-2">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      Key Themes
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Common discussion topics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 280 : isTablet ? 340 : 400}>
                      <BarChart data={themeData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis
                          dataKey="theme"
                          angle={isMobile ? -45 : -30}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <Tooltip />
                        <Bar dataKey="mentions" radius={[8, 8, 0, 0]} shape={<AnimatedBar />}>
                          {themeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              {/* Sentiment Trend */}
              {sentimentTrendData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2">
                          <Activity className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          Sentiment Trends Over Time
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1">
                          Track sentiment changes across reviews
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Positive</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Neutral</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-[10px] sm:text-xs text-muted-foreground">Negative</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 280 : isTablet ? 340 : 400}>
                      <LineChart data={sentimentTrendData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.positive} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.positive} stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS.negative} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={COLORS.negative} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 11 }}
                          angle={isMobile ? -25 : 0}
                          textAnchor={isMobile ? "end" : "middle"}
                          height={isMobile ? 50 : 30}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <Tooltip content={<SentimentTrendTooltip />} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12 }} iconType="line" />
                        <Line
                          type="monotone"
                          dataKey="positive"
                          stroke={COLORS.positive}
                          strokeWidth={hoveredLine === 'positive' ? 4 : 3}
                          dot={{ fill: COLORS.positive, r: 4 }}
                          activeDot={<ActiveDot />}
                          fill="url(#colorPositive)"
                          onMouseEnter={() => setHoveredLine('positive')}
                          onMouseLeave={() => setHoveredLine(null)}
                          name="Positive"
                        />
                        <Line
                          type="monotone"
                          dataKey="negative"
                          stroke={COLORS.negative}
                          strokeWidth={hoveredLine === 'negative' ? 4 : 3}
                          dot={{ fill: COLORS.negative, r: 4 }}
                          activeDot={<ActiveDot />}
                          fill="url(#colorNegative)"
                          onMouseEnter={() => setHoveredLine('negative')}
                          onMouseLeave={() => setHoveredLine(null)}
                          name="Negative"
                        />
                        <Line
                          type="monotone"
                          dataKey="neutral"
                          stroke={COLORS.neutral}
                          strokeWidth={hoveredLine === 'neutral' ? 4 : 3}
                          dot={{ fill: COLORS.neutral, r: 4 }}
                          activeDot={<ActiveDot />}
                          onMouseEnter={() => setHoveredLine('neutral')}
                          onMouseLeave={() => setHoveredLine(null)}
                          name="Neutral"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Emotions Tab */}
          <TabsContent value="emotions" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              {/* Emotion Radar */}
              {emotionData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-2">
                          <Heart className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
                          Emotional Analysis Spider Chart
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-1">
                          Customer emotional response patterns across multiple dimensions
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        AI-Powered
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 300 : isTablet ? 380 : 450}>
                      <RadarChart data={emotionData}>
                        <PolarGrid stroke="currentColor" className="text-muted/30" strokeWidth={1} />
                        <PolarAngleAxis
                          dataKey="emotion"
                          tick={{
                            fontSize: isMobile ? 9 : isTablet ? 10 : 11,
                            fill: 'currentColor'
                          }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 1]}
                          tick={{ fontSize: isMobile ? 8 : 9 }}
                        />
                        <Tooltip content={<EmotionTooltip />} />
                        <Radar
                          name="Emotion Intensity"
                          dataKey="value"
                          stroke={COLORS.primary}
                          fill={COLORS.primary}
                          fillOpacity={0.6}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* View Details Button */}
        {onViewDetails && (
          <div className="flex justify-center pt-2 sm:pt-4">
            <Button
              onClick={onViewDetails}
              size={isMobile ? "sm" : "default"}
              className="gap-2 text-xs sm:text-sm md:text-base"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              View Detailed Insights
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
