'use client';

import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, MessageSquare, Star, BarChart3, PieChart as PieChartIcon,
  Activity, Sparkles, ChevronRight, Eye, Download, Users, TrendingDown, X
} from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { cn } from '@/lib/utils';

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
  aiEnabled?: boolean;
}

interface KeywordData {
  keyword: string;
  frequency: number;
}

const COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b', 
  negative: '#ef4444',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#ec4899',
  muted: '#64748b',
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

// Custom Bar component with smooth hover animation
const AnimatedBar = (props: any) => {
  const { x, y, width, height, fill, ...rest } = props;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <g>
      <rect
        x={x}
        y={isHovered ? y - 8 : y} // Lift up on hover
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
        x={isHovered ? x - 4 : x} // Move left on hover for vertical bars
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

export default function GraphArea({ analysis, isLoading, onViewDetails, aiEnabled }: GraphAreaProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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

  // Generate growth data
  useEffect(() => {
    const mockGrowthData: GrowthData[] = [
      { date: 'Mon', buyers: 120, trend: 'up' },
      { date: 'Tue', buyers: 145, trend: 'up' },
      { date: 'Wed', buyers: 130, trend: 'down' },
      { date: 'Thu', buyers: 160, trend: 'up' },
      { date: 'Fri', buyers: 155, trend: 'down' },
      { date: 'Sat', buyers: 180, trend: 'up' },
      { date: 'Sun', buyers: 195, trend: 'up' },
    ];
    setGrowthData(mockGrowthData);
  }, []);

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

  // Emotion radar data
  const emotionData = analysis.reviews?.[0]?.emotions ? [
    { 
      emotion: 'Joy', 
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.joy || 0), 0) / analysis.reviews.length 
    },
    { emotion: 'Trust', value: 0.6 },
    { 
      emotion: 'Surprise', 
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.surprise || 0), 0) / analysis.reviews.length 
    },
    { 
      emotion: 'Sadness', 
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.sadness || 0), 0) / analysis.reviews.length 
    },
    { 
      emotion: 'Anger', 
      value: analysis.reviews.reduce((sum, r) => sum + (r.emotions?.anger || 0), 0) / analysis.reviews.length 
    },
  ] : [];

  const totalReviews = analysis.total_reviews || 0;
  const avgRating = analysis.average_rating || 0;
  const sentimentScore = sentimentData.length > 0 
    ? ((sentimentData.find(s => s.name === 'Positive')?.value || 0) / totalReviews * 100) 
    : 0;

  // Calculate responsive chart heights
  const getChartHeight = () => {
    if (isMobile) return 220;
    if (isTablet) return 280;
    return 300;
  };

  const getPieChartHeight = () => {
    if (isMobile) return 280;
    if (isTablet) return 320;
    return 350;
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
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Total Reviews</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {totalReviews.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <MessageSquare className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-blue-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-yellow-500/10 via-background to-background">
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

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background">
            <CardHeader className="pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardDescription className="text-[9px] sm:text-[10px] md:text-xs font-medium">Positive Sentiment</CardDescription>
              <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                {sentimentScore.toFixed(0)}%
              </CardTitle>
            </CardHeader>
            <TrendingUp className="absolute right-2 bottom-2 sm:right-3 sm:bottom-3 md:right-4 md:bottom-4 h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-16 lg:w-16 text-green-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500/10 via-background to-background">
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
          <TabsList className="grid w-full grid-cols-3 h-8 sm:h-9 md:h-10">
            <TabsTrigger value="overview" className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-1.5 sm:px-2 py-1.5 sm:py-2 md:py-2.5">
              <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-0 sm:mr-1 md:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm px-1.5 sm:px-2 py-1.5 sm:py-2 md:py-2.5">
              <PieChartIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 mr-0 sm:mr-1 md:mr-2" />
              <span className="hidden sm:inline">Sentiment</span>
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
                <Card className="border-none shadow-lg">
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
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                          <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
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
                    {/* Selected Keyword Display */}
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
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            {sentimentData.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg flex items-center gap-1.5 sm:gap-2">
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary flex-shrink-0" />
                    <span>Sentiment Analysis</span>
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                    Overall customer sentiment distribution
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
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-3 sm:space-y-4 md:space-y-6 mt-3 sm:mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              
              {/* Themes Analysis */}
              {themeData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">Key Themes</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Most discussed topics with sentiment
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart data={themeData} margin={{ top: 5, right: isMobile ? 5 : 10, left: isMobile ? 5 : 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis 
                          dataKey="theme" 
                          angle={isMobile ? -45 : -30}
                          textAnchor="end"
                          height={isMobile ? 60 : 70}
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 9 : isTablet ? 10 : 12 }} />
                        <Tooltip content={<ThemeTooltip />} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="mentions" radius={[8, 8, 0, 0]}>
                          {themeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Emotion Radar */}
              {emotionData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">Emotion Analysis</CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">
                      Customer emotional response patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <RadarChart data={emotionData}>
                        <PolarGrid stroke="currentColor" className="text-muted/20" />
                        <PolarAngleAxis 
                          dataKey="emotion" 
                          tick={{ 
                            fontSize: isMobile ? 9 : isTablet ? 10 : 12, 
                            fill: 'hsl(var(--foreground))',
                            fontWeight: 500 
                          }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 1]} 
                          tick={{ fontSize: isMobile ? 8 : isTablet ? 9 : 10 }}
                        />
                        <Radar 
                          name="Emotion Intensity" 
                          dataKey="value" 
                          stroke={COLORS.secondary} 
                          fill={COLORS.secondary} 
                          fillOpacity={0.6}
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* View Details Button - Mobile Optimized */}
        {onViewDetails && (
          <div className="flex justify-center pt-2 sm:pt-3 md:pt-4">
            <Button 
              onClick={onViewDetails}
              size={isMobile ? "sm" : "default"}
              className="gap-1.5 sm:gap-2"
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
