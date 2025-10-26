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
}

interface GrowthData {
  date: string;
  buyers: number;
  trend: 'up' | 'down';
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
        <p className="font-semibold text-sm md:text-base text-foreground">{label}</p>
        <p className="text-xs md:text-sm text-muted-foreground">
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
      <div className="bg-background border border-border rounded-lg p-2 md:p-3 shadow-lg min-w-[140px]">
        <p className="font-semibold text-sm md:text-base text-foreground mb-1">
          {label}
        </p>
        <div className="space-y-1">
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
            <Activity className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            <span className="font-medium text-primary">
              {payload[0].value} mentions
            </span>
          </p>
          <p className="text-[10px] md:text-xs text-muted-foreground">
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
        <p className="font-semibold text-sm md:text-base text-foreground">{label}</p>
        <p className="text-xs md:text-sm text-muted-foreground">
          Mentioned {payload[0].value} times
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div 
            className="w-2 h-2 md:w-3 md:h-3 rounded-full"
            style={{ backgroundColor: payload[0].payload.fill }}
          />
          <span className="text-[10px] md:text-xs capitalize">
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

export default function GraphArea({ analysis, isLoading, onViewDetails }: GraphAreaProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-primary" />
            <div className="space-y-2 text-center">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold">Analyzing Reviews...</h2>
              <p className="text-sm md:text-base text-muted-foreground">
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="rounded-full bg-muted/50 p-4 md:p-6">
              <BarChart3 className="h-12 w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-primary/80" />
            </div>
            <div className="space-y-3 max-w-md">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Ready to Analyze</h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Enter an Amazon ASIN in the sidebar to unlock powerful AI-driven insights, 
                sentiment analysis, and visual analytics
              </p>
              <div className="flex gap-2 justify-center flex-wrap pt-2">
                <Badge variant="outline" className="text-xs">Real-time Analysis</Badge>
                <Badge variant="outline" className="text-xs">AI Insights</Badge>
                <Badge variant="outline" className="text-xs">Visual Reports</Badge>
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
    if (isMobile) return 250;
    return 300;
  };

  const getPieChartHeight = () => {
    if (isMobile) return 300;
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
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6 animate-in fade-in duration-700">
        
        {/* Hero Stats - Fully Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background">
            <CardHeader className="pb-2 md:pb-3 p-3 sm:p-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium">Total Reviews</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                {totalReviews.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <MessageSquare className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-blue-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-yellow-500/10 via-background to-background">
            <CardHeader className="pb-2 md:pb-3 p-3 sm:p-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium">Average Rating</CardDescription>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                  {avgRating.toFixed(1)}
                </CardTitle>
                <Star className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 fill-yellow-500 text-yellow-500" />
              </div>
            </CardHeader>
            <Star className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-yellow-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background">
            <CardHeader className="pb-2 md:pb-3 p-3 sm:p-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium">Positive Sentiment</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                {sentimentScore.toFixed(0)}%
              </CardTitle>
            </CardHeader>
            <TrendingUp className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-green-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500/10 via-background to-background">
            <CardHeader className="pb-2 md:pb-3 p-3 sm:p-4">
              <CardDescription className="text-[10px] sm:text-xs font-medium">Key Themes</CardDescription>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">
                {themeData.length}
              </CardTitle>
            </CardHeader>
            <Activity className="absolute right-2 bottom-2 sm:right-4 sm:bottom-4 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 text-purple-500/20" />
          </Card>
        </div>

        {/* Main Charts - Responsive Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 py-2 md:py-2.5">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-[10px] sm:text-xs md:text-sm px-2 py-2 md:py-2.5">
              <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="text-[10px] sm:text-xs md:text-sm px-2 py-2 md:py-2.5">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Growth</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-[10px] sm:text-xs md:text-sm px-2 py-2 md:py-2.5">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              
              {/* Rating Distribution - Responsive */}
              {ratingData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                      <span>Rating Distribution</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Customer rating breakdown with review counts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart data={ratingData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis 
                          dataKey="rating" 
                          type="category" 
                          width={isMobile ? 40 : 50} 
                          tick={{ fontSize: isMobile ? 10 : 12 }} 
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
                        <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                          <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                          <span>Top Keywords</span>
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          Click on a bar to view frequency details
                        </CardDescription>
                      </div>
                      {selectedKeyword && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedKeyword(null)}
                          className="h-6 w-6 p-0 sm:h-8 sm:w-8 flex-shrink-0"
                        >
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                    {/* Selected Keyword Display */}
                    {selectedKeyword && (
                      <div className="bg-primary/10 border-2 border-primary rounded-lg p-3 md:p-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              Selected Keyword:
                            </p>
                            <p className="text-base sm:text-lg md:text-xl font-bold text-primary truncate">
                              {selectedKeyword.keyword}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                              Frequency:
                            </p>
                            <Badge variant="default" className="text-sm sm:text-base md:text-lg px-2 py-1">
                              {selectedKeyword.frequency}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-primary/20">
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            This keyword appears <span className="font-semibold text-primary">{selectedKeyword.frequency} times</span> across all analyzed reviews
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Keywords Chart */}
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart 
                        data={keywordData} 
                        margin={{ top: 5, right: 10, left: 10, bottom: isMobile ? 60 : 80 }}
                        onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            handleKeywordClick(data.activePayload[0].payload);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis 
                          dataKey="keyword" 
                          angle={-45} 
                          textAnchor="end" 
                          height={isMobile ? 60 : 80}
                          tick={{ fontSize: isMobile ? 9 : 10 }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip content={<KeywordTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                        <Bar 
                          dataKey="frequency" 
                          radius={[8, 8, 0, 0]}
                          shape={<AnimatedBar />}
                          onClick={handleKeywordClick}
                        >
                          {keywordData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={selectedKeyword?.keyword === entry.keyword ? COLORS.accent : COLORS.primary}
                              className="cursor-pointer"
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Themes - Responsive Horizontal Bar Chart */}
            {themeData.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-secondary flex-shrink-0" />
                    <span>Common Themes</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Key topics discussed in reviews with mention frequency
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={getChartHeight()}>
                    <BarChart 
                      data={themeData} 
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: isMobile ? 80 : 120, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis type="number" tick={{ fontSize: isMobile ? 10 : 12 }} />
                      <YAxis 
                        dataKey="theme" 
                        type="category" 
                        width={isMobile ? 80 : 120} 
                        tick={{ fontSize: isMobile ? 9 : 12 }} 
                      />
                      <Tooltip content={<ThemeTooltip />} cursor={false} />
                      <Bar 
                        dataKey="mentions" 
                        radius={[0, 8, 8, 0]}
                        shape={<AnimatedVerticalBar />}
                      >
                        {themeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sentiment Tab - Responsive */}
          <TabsContent value="sentiment" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              
              {/* Sentiment Pie Chart */}
              <Card className="border-none shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0" />
                    <span>Sentiment Distribution</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Overall customer sentiment
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <ResponsiveContainer width="100%" height={getPieChartHeight()}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => 
                          isMobile 
                            ? `${(percent * 100).toFixed(0)}%` 
                            : `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={isMobile ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        wrapperStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                        iconSize={isMobile ? 10 : 14}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emotion Radar - Responsive */}
              {emotionData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 flex-shrink-0" />
                      <span>Emotion Analysis</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Emotional tone detected in reviews
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getPieChartHeight()}>
                      <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "70%" : "80%"} data={emotionData}>
                        <PolarGrid stroke="hsl(var(--muted-foreground))" className="opacity-40" />
                        <PolarAngleAxis 
                          dataKey="emotion" 
                          tick={{ 
                            fontSize: isMobile ? 10 : 12, 
                            fill: 'hsl(var(--foreground))',
                            fontWeight: 500 
                          }}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 1]} 
                          tick={{ fontSize: isMobile ? 9 : 10 }}
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

          {/* Growth Tab - Responsive */}
          <TabsContent value="growth" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                  <span>Review Growth Trend</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Daily review activity (simulated data)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                <ResponsiveContainer width="100%" height={isMobile ? 280 : 350}>
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: isMobile ? 0 : 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorBuyers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: isMobile ? 10 : 12 }}
                      interval={isMobile ? 1 : 0}
                    />
                    <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="buyers" 
                      stroke={COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorBuyers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab - Responsive */}
          <TabsContent value="insights" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <Card className="border-none shadow-lg">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>AI-Generated Insights</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Key takeaways from review analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 md:space-y-4">
                {(analysis.insights?.insights || []).map((insight, index) => (
                  <div 
                    key={index} 
                    className="flex gap-2 md:gap-3 p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] md:text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base leading-relaxed flex-1">
                      {insight}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Detailed Report Button - Responsive */}
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
              <div className="text-center md:text-left space-y-2 flex-1">
                <h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  <span>Ready for Detailed Analysis?</span>
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  View comprehensive insights, AI summaries, and detailed reports
                </p>
              </div>
              <Button 
                size={isMobile ? "default" : "lg"} 
                className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 w-full md:w-auto" 
                onClick={onViewDetails}
              >
                <span className="text-sm sm:text-base">View Detailed Insights</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer - Responsive */}
        <div className="text-center pt-6 pb-4 border-t">
          <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">Technolity</span> • AI-Driven Analytics Platform
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            © 2025 Technolity. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}