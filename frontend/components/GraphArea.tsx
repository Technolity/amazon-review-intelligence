'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, MessageSquare, Star, BarChart3, PieChart as PieChartIcon,
  Activity, Sparkles, ChevronRight, Eye, Download, Users, TrendingDown, X,
  Clock, ThumbsUp, Shield, FileText, Zap, Heart
} from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { cn } from '@/lib/utils';

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
  aiEnabled?: boolean;
}

interface SentimentTrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

interface KeywordData {
  keyword: string;
  frequency: number;
}

interface ReviewLengthData {
  category: string;
  count: number;
  avgRating: number;
}

const COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  muted: '#64748b',
  success: '#22c55e',
  warning: '#eab308',
  info: '#06b6d4',
};

// Custom tooltip for rating distribution
const RatingTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-2 md:p-3 shadow-lg">
        <p className="font-semibold text-xs sm:text-sm md:text-base text-foreground">{label}</p>
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
          {payload[0].value} reviews
        </p>
      </div>
    );
  }
  return null;
};

// Enhanced tooltip for sentiment trend (ECG-like graph)
const SentimentTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-xl min-w-[140px]">
        <p className="font-semibold text-sm md:text-base text-foreground mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs capitalize text-muted-foreground">
                  {entry.name}
                </span>
              </div>
              <span className="text-xs font-bold" style={{ color: entry.color }}>
                {entry.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Enhanced tooltip for keywords with frequency
const KeywordTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-2 md:p-3 shadow-lg min-w-[120px] sm:min-w-[140px]">
        <p className="font-semibold text-xs sm:text-sm md:text-base text-foreground mb-1">
          {label}
        </p>
        <div className="space-y-1">
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground flex items-center gap-2">
            <Activity className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            <span className="font-medium text-primary">
              {payload[0].value} mentions
            </span>
          </p>
          <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
            Click to pin this keyword
          </p>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip for themes with frequency
const ThemeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-2 md:p-3 shadow-lg">
        <p className="font-semibold text-xs sm:text-sm md:text-base text-foreground">{label}</p>
        <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
          Mentioned {payload[0].value} times
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div
            className="w-2 h-2 md:w-3 md:h-3 rounded-full"
            style={{ backgroundColor: payload[0].payload.fill }}
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

// Custom tooltip for emotion radar
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

// Custom Bar component with smooth hover animation
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

// Custom Bar component for vertical charts
const AnimatedVerticalBar = (props: any) => {
  const { x, y, width, height, fill, ...rest } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g>
      <rect
        x={isHovered ? x - 4 : x}
        y={y}
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

// Custom dot for line chart with pulse animation
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
  const [sentimentTrendData, setSentimentTrendData] = useState<SentimentTrendData[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);

  // Detect mobile/tablet viewport
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

  // Generate sentiment trend data (ECG-like data)
  useEffect(() => {
    if (analysis?.reviews) {
      // Group reviews by date and calculate sentiment counts
      const dateMap = new Map<string, { positive: number; negative: number; neutral: number }>();

      analysis.reviews.forEach(review => {
        const date = review.date ? new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown';
        if (!dateMap.has(date)) {
          dateMap.set(date, { positive: 0, negative: 0, neutral: 0 });
        }
        const counts = dateMap.get(date)!;
        if (review.sentiment === 'positive') counts.positive++;
        else if (review.sentiment === 'negative') counts.negative++;
        else counts.neutral++;
      });

      const trendData = Array.from(dateMap.entries())
        .map(([date, counts]) => ({
          date,
          positive: counts.positive,
          negative: counts.negative,
          neutral: counts.neutral,
        }))
        .slice(-14); // Last 14 data points

      setSentimentTrendData(trendData);
    } else {
      // Mock data for demonstration
      const mockTrendData: SentimentTrendData[] = [
        { date: 'Jan 1', positive: 45, negative: 12, neutral: 8 },
        { date: 'Jan 3', positive: 52, negative: 15, neutral: 10 },
        { date: 'Jan 5', positive: 48, negative: 18, neutral: 12 },
        { date: 'Jan 7', positive: 60, negative: 10, neutral: 15 },
        { date: 'Jan 9', positive: 55, negative: 20, neutral: 9 },
        { date: 'Jan 11', positive: 65, negative: 8, neutral: 14 },
        { date: 'Jan 13', positive: 58, negative: 16, neutral: 11 },
        { date: 'Jan 15', positive: 70, negative: 12, neutral: 13 },
        { date: 'Jan 17', positive: 62, negative: 22, neutral: 10 },
        { date: 'Jan 19', positive: 75, negative: 9, neutral: 16 },
        { date: 'Jan 21', positive: 68, negative: 14, neutral: 12 },
        { date: 'Jan 23', positive: 80, negative: 11, neutral: 15 },
        { date: 'Jan 25', positive: 72, negative: 18, neutral: 14 },
        { date: 'Jan 27', positive: 85, negative: 7, neutral: 18 },
      ];
      setSentimentTrendData(mockTrendData);
    }
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
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">Ready to Analyze</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                Enter an Amazon ASIN in the sidebar to unlock powerful AI-driven insights,
                sentiment analysis, and visual analytics
              </p>
              <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap pt-2">
                <Badge variant="outline" className="text-[10px] sm:text-xs">Real-time Analysis</Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">AI Insights</Badge>
                <Badge variant="outline" className="text-[10px] sm:text-xs">Visual Reports</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Prepare chart data
  const sentimentData = [
    { name: 'Positive', value: analysis.sentiment_distribution?.positive || 0, fill: COLORS.positive },
    { name: 'Neutral', value: analysis.sentiment_distribution?.neutral || 0, fill: COLORS.neutral },
    { name: 'Negative', value: analysis.sentiment_distribution?.negative || 0, fill: COLORS.negative },
  ].filter(item => item.value > 0);

  const keywordData: KeywordData[] = (analysis.top_keywords || []).slice(0, 10).map(kw => ({
    keyword: kw.word,
    frequency: kw.frequency,
  }));

  const themeData = (analysis.themes || []).slice(0, 6).map(theme => ({
    theme: theme.theme,
    mentions: theme.mentions,
    sentiment: theme.sentiment,
    fill: theme.sentiment === 'positive' ? COLORS.positive :
          theme.sentiment === 'negative' ? COLORS.negative : COLORS.neutral
  }));

  const ratingData = analysis.rating_distribution ? [
    { rating: '5★', count: analysis.rating_distribution['5_star'] || 0, fill: COLORS.positive },
    { rating: '4★', count: analysis.rating_distribution['4_star'] || 0, fill: '#34d399' },
    { rating: '3★', count: analysis.rating_distribution['3_star'] || 0, fill: COLORS.neutral },
    { rating: '2★', count: analysis.rating_distribution['2_star'] || 0, fill: '#fb923c' },
    { rating: '1★', count: analysis.rating_distribution['1_star'] || 0, fill: COLORS.negative },
  ].filter(item => item.count > 0) : [];

  // Enhanced Emotion radar data with all emotions
  const emotionData = analysis.reviews && analysis.reviews.length > 0 ? [
    {
      emotion: 'Joy',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.joy || 0), 0) / analysis.reviews.length
    },
    {
      emotion: 'Trust',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.trust || 0.5), 0) / analysis.reviews.length
    },
    {
      emotion: 'Surprise',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.surprise || 0), 0) / analysis.reviews.length
    },
    {
      emotion: 'Anticipation',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.anticipation || 0.4), 0) / analysis.reviews.length
    },
    {
      emotion: 'Sadness',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.sadness || 0), 0) / analysis.reviews.length
    },
    {
      emotion: 'Anger',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.anger || 0), 0) / analysis.reviews.length
    },
    {
      emotion: 'Fear',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.fear || 0), 0) / analysis.reviews.length
    },
    {
      emotion: 'Disgust',
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.disgust || 0), 0) / analysis.reviews.length
    },
  ] : [
    { emotion: 'Joy', value: 0.75 },
    { emotion: 'Trust', value: 0.65 },
    { emotion: 'Surprise', value: 0.45 },
    { emotion: 'Anticipation', value: 0.55 },
    { emotion: 'Sadness', value: 0.25 },
    { emotion: 'Anger', value: 0.20 },
    { emotion: 'Fear', value: 0.15 },
    { emotion: 'Disgust', value: 0.18 },
  ];

  // Review length distribution
  const reviewLengthData: ReviewLengthData[] = analysis.reviews && analysis.reviews.length > 0
    ? (() => {
        const shortReviews = analysis.reviews.filter(r => (r.review_text?.length || 0) < 100);
        const mediumReviews = analysis.reviews.filter(r => (r.review_text?.length || 0) >= 100 && (r.review_text?.length || 0) < 300);
        const longReviews = analysis.reviews.filter(r => (r.review_text?.length || 0) >= 300);

        return [
          {
            category: 'Short (<100 chars)',
            count: shortReviews.length,
            avgRating: shortReviews.length > 0 ? shortReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / shortReviews.length : 0
          },
          {
            category: 'Medium (100-300)',
            count: mediumReviews.length,
            avgRating: mediumReviews.length > 0 ? mediumReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / mediumReviews.length : 0
          },
          {
            category: 'Long (>300 chars)',
            count: longReviews.length,
            avgRating: longReviews.length > 0 ? longReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / longReviews.length : 0
          },
        ];
      })()
    : [
        { category: 'Short (<100 chars)', count: 45, avgRating: 4.2 },
        { category: 'Medium (100-300)', count: 78, avgRating: 4.5 },
        { category: 'Long (>300 chars)', count: 32, avgRating: 4.7 },
      ];

  // Verified purchase distribution
  const verifiedData = analysis.reviews && analysis.reviews.length > 0
    ? [
        {
          name: 'Verified Purchase',
          value: analysis.reviews.filter(r => r.verified_purchase).length,
          fill: COLORS.success
        },
        {
          name: 'Unverified',
          value: analysis.reviews.filter(r => !r.verified_purchase).length,
          fill: COLORS.muted
        },
      ].filter(item => item.value > 0)
    : [
        { name: 'Verified Purchase', value: 85, fill: COLORS.success },
        { name: 'Unverified', value: 15, fill: COLORS.muted },
      ];

  const totalReviews = analysis.total_reviews || 0;
  const avgRating = analysis.average_rating || 0;
  const sentimentScore = sentimentData.length > 0
    ? ((sentimentData.find(s => s.name === 'Positive')?.value || 0) / totalReviews * 100)
    : 0;

  // Calculate responsive chart heights
  const getChartHeight = () => {
    if (isMobile) return 220;
    if (isTablet) return 280;
    return 320;
  };

  const getPieChartHeight = () => {
    if (isMobile) return 280;
    if (isTablet) return 320;
    return 350;
  };

  const getRadarChartHeight = () => {
    if (isMobile) return 280;
    if (isTablet) return 340;
    return 380;
  };

  // Handle keyword bar click
  const handleKeywordClick = (data: any) => {
    if (data && data.keyword) {
      setSelectedKeyword({
        keyword: data.keyword,
        frequency: data.frequency
      });
    }
  };

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto space-y-3 sm:space-y-4 md:space-y-6 animate-in fade-in duration-700">

        {/* Hero Stats - Fully Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Total Reviews</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {totalReviews.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <MessageSquare className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-blue-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-yellow-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Average Rating</CardDescription>
              <div className="flex items-baseline gap-1 sm:gap-1.5 md:gap-2">
                <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                  {avgRating.toFixed(1)}
                </CardTitle>
                <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 fill-yellow-500 text-yellow-500" />
              </div>
            </CardHeader>
            <Star className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-yellow-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Positive Sentiment</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {sentimentScore.toFixed(0)}%
              </CardTitle>
            </CardHeader>
            <TrendingUp className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-green-500/20" />
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

        {/* Main Charts - Responsive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-8 sm:h-9 md:h-10">
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
            <TabsTrigger value="insights" className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-1.5 sm:px-2 py-1.5 sm:py-2 md:py-2.5">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-0 sm:mr-1 md:mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">

              {/* Rating Distribution - Responsive */}
              {ratingData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                      <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                      <span>Rating Distribution</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Customer rating breakdown with review counts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart data={ratingData} layout="vertical" margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? 5 : 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis type="number" tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <YAxis
                          dataKey="rating"
                          type="category"
                          width={isMobile ? 35 : isTablet ? 45 : 50}
                          tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }}
                        />
                        <Tooltip content={<RatingTooltip />} cursor={false} />
                        <Bar
                          dataKey="count"
                          radius={[0, 8, 8, 0]}
                          shape={<AnimatedVerticalBar />}
                        >
                          {ratingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Top Keywords - Interactive with Frequency Display */}
              {keywordData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                          <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                          <span>Top Keywords</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                          Click on a bar to view frequency details
                        </CardDescription>
                      </div>
                      {selectedKeyword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedKeyword(null)}
                          className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 p-0 flex-shrink-0"
                        >
                          <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-2 sm:space-y-3 md:space-y-4">
                    {selectedKeyword && (
                      <div className="bg-primary/10 border-2 border-primary rounded-lg p-2.5 sm:p-3 md:p-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                              Selected Keyword:
                            </p>
                            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-primary truncate">
                              {selectedKeyword.keyword}
                            </p>
                            <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5">
                              Frequency: <span className="font-semibold text-primary">{selectedKeyword.frequency}</span> times
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart
                        data={keywordData}
                        onClick={handleKeywordClick}
                        margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? 5 : 10, bottom: isMobile ? 60 : 70 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis
                          dataKey="keyword"
                          angle={isMobile ? -45 : -30}
                          textAnchor="end"
                          height={isMobile ? 60 : 70}
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <Tooltip content={<KeywordTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar
                          dataKey="frequency"
                          fill={COLORS.primary}
                          radius={[8, 8, 0, 0]}
                          shape={<AnimatedBar />}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Second row - Verified Purchase & Review Length */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Verified Purchase Distribution */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                    <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                    <span>Purchase Verification</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                    Verified vs unverified purchases
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={getPieChartHeight()}>
                    <PieChart>
                      <Pie
                        data={verifiedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={isMobile ? 50 : isTablet ? 60 : 70}
                        outerRadius={isMobile ? 80 : isTablet ? 90 : 100}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {verifiedData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Review Length Distribution */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                    <span>Review Length Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                    Distribution by character count
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={getChartHeight()}>
                    <BarChart data={reviewLengthData} margin={{ top: 5, right: isMobile ? 10 : 20, left: isMobile ? 0 : 10, bottom: isMobile ? 40 : 50 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis
                        dataKey="category"
                        angle={isMobile ? -20 : -15}
                        textAnchor="end"
                        height={isMobile ? 40 : 50}
                        tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                      />
                      <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill={COLORS.info} radius={[8, 8, 0, 0]} shape={<AnimatedBar />} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sentiment Tab - ECG-like Graph */}
          <TabsContent value="sentiment" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Sentiment Trend - ECG Style */}
              <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 lg:col-span-2">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                        <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                        <span>Sentiment Trends Over Time</span>
                      </CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                        ECG-style visualization of positive vs negative reviews
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 sm:gap-3 items-center flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="text-[10px] sm:text-xs text-muted-foreground">Positive</span>
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
                    <LineChart
                      data={sentimentTrendData}
                      margin={{ top: 10, right: isMobile ? 10 : 20, left: isMobile ? 0 : 10, bottom: 5 }}
                    >
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
                      <Legend
                        wrapperStyle={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12 }}
                        iconType="line"
                      />
                      <Line
                        type="monotone"
                        dataKey="positive"
                        stroke={COLORS.positive}
                        strokeWidth={hoveredLine === 'positive' ? 4 : 3}
                        dot={{ fill: COLORS.positive, r: hoveredLine === 'positive' ? 6 : 4 }}
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
                        dot={{ fill: COLORS.negative, r: hoveredLine === 'negative' ? 6 : 4 }}
                        activeDot={<ActiveDot />}
                        fill="url(#colorNegative)"
                        onMouseEnter={() => setHoveredLine('negative')}
                        onMouseLeave={() => setHoveredLine(null)}
                        name="Negative"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sentiment Pie Chart */}
              {sentimentData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                      <PieChartIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                      <span>Sentiment Distribution</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Overall customer sentiment breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getPieChartHeight()}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 40 : isTablet ? 50 : 60}
                          outerRadius={isMobile ? 70 : isTablet ? 80 : 90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value}%`} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          wrapperStyle={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Themes Analysis */}
              {themeData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                      <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-500 flex-shrink-0" />
                      <span>Key Themes by Sentiment</span>
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Most discussed topics with sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart data={themeData} margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? 5 : 10, bottom: isMobile ? 50 : 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis
                          dataKey="theme"
                          angle={isMobile ? -45 : -30}
                          textAnchor="end"
                          height={isMobile ? 50 : 60}
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <Tooltip content={<ThemeTooltip />} cursor={{ fill: 'transparent' }} />
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

          {/* Emotions Tab */}
          <TabsContent value="emotions" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6">
              {/* Enhanced Emotion Radar - Full Width */}
              {emotionData.length > 0 && (
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                          <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-pink-500 flex-shrink-0" />
                          <span>Emotional Analysis Spider Chart</span>
                        </CardTitle>
                        <CardDescription className="text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                          Customer emotional response patterns across 8 dimensions
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-[10px] sm:text-xs">
                        AI-Powered
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getRadarChartHeight()}>
                      <RadarChart data={emotionData}>
                        <PolarGrid stroke="currentColor" className="text-muted/30" strokeWidth={1} />
                        <PolarAngleAxis
                          dataKey="emotion"
                          tick={{
                            fontSize: isMobile ? 10 : isTablet ? 11 : 13,
                            fill: 'hsl(var(--foreground))',
                            fontWeight: 600
                          }}
                        />
                        <PolarRadiusAxis
                          angle={90}
                          domain={[0, 1]}
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                          tickCount={6}
                        />
                        <Radar
                          name="Emotion Intensity"
                          dataKey="value"
                          stroke={COLORS.secondary}
                          fill={COLORS.secondary}
                          fillOpacity={0.5}
                          strokeWidth={2}
                        />
                        <Tooltip content={<EmotionTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">

              {/* Top Insight Cards */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-green-500/20">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xs sm:text-sm md:text-base">Top Strength</CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs mt-0.5 truncate">
                        {themeData.find(t => t.sentiment === 'positive')?.theme || 'Quality'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-500">
                    {themeData.find(t => t.sentiment === 'positive')?.mentions || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">mentions</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-red-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-red-500/20">
                      <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xs sm:text-sm md:text-base">Top Concern</CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs mt-0.5 truncate">
                        {themeData.find(t => t.sentiment === 'negative')?.theme || 'N/A'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-500">
                    {themeData.find(t => t.sentiment === 'negative')?.mentions || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">mentions</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background hover:shadow-xl transition-all duration-300">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-blue-500/20">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-xs sm:text-sm md:text-base">Engagement</CardTitle>
                      <CardDescription className="text-[10px] sm:text-xs mt-0.5 truncate">
                        Average review length
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-500">
                    {analysis.reviews && analysis.reviews.length > 0
                      ? Math.round(analysis.reviews.reduce((sum, r) => sum + (r.review_text?.length || 0), 0) / analysis.reviews.length)
                      : 180}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">characters</p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Insights */}
            <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500 flex-shrink-0" />
                  <span>AI-Powered Insights</span>
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                  Key takeaways from review analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                    <Badge className="mt-0.5 flex-shrink-0 text-[9px] sm:text-[10px]">1</Badge>
                    <p className="text-[10px] sm:text-xs md:text-sm flex-1">
                      <span className="font-semibold">Positive Trend:</span> {sentimentScore.toFixed(0)}% of reviews express positive sentiment
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                    <Badge className="mt-0.5 flex-shrink-0 text-[9px] sm:text-[10px]">2</Badge>
                    <p className="text-[10px] sm:text-xs md:text-sm flex-1">
                      <span className="font-semibold">Top Keyword:</span> "{keywordData[0]?.keyword || 'N/A'}" mentioned {keywordData[0]?.frequency || 0} times
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                    <Badge className="mt-0.5 flex-shrink-0 text-[9px] sm:text-[10px]">3</Badge>
                    <p className="text-[10px] sm:text-xs md:text-sm flex-1">
                      <span className="font-semibold">Verification:</span> {verifiedData[0]?.value || 0} verified purchases detected
                    </p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-muted/50">
                    <Badge className="mt-0.5 flex-shrink-0 text-[9px] sm:text-[10px]">4</Badge>
                    <p className="text-[10px] sm:text-xs md:text-sm flex-1">
                      <span className="font-semibold">Engagement:</span> Most reviews are {reviewLengthData.sort((a, b) => b.count - a.count)[0]?.category.toLowerCase() || 'medium length'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Details Button - Mobile Optimized */}
        {onViewDetails && (
          <div className="flex justify-center pt-2 sm:pt-3 md:pt-4">
            <Button
              onClick={onViewDetails}
              size={isMobile ? "sm" : "default"}
              className="gap-1.5 sm:gap-2 hover:scale-105 transition-transform duration-200"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">View Detailed Insights</span>
              <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
