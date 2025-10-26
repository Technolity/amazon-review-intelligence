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
  Activity, Sparkles, ChevronRight, Eye, Download, Users, TrendingDown
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
      <div className="bg-background border border-border rounded-lg p-2 sm:p-3 shadow-lg text-xs sm:text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground">
          {payload[0].value} reviews
        </p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for common themes with frequency
const ThemeTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-2 sm:p-3 shadow-lg text-xs sm:text-sm">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground">
          Mentioned {payload[0].value} times
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div 
            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
            style={{ backgroundColor: payload[0].payload.fill }}
          />
          <span className="text-xs capitalize">
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

export default function GraphArea({ analysis, isLoading, onViewDetails }: GraphAreaProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [ecgGrowthData, setEcgGrowthData] = useState<{ date: string; buyers: number; originalBuyers: number }[]>([]);

  // Generate ECG-like growth data
  useEffect(() => {
    const generateEcgGrowthData = (baseData: GrowthData[]) => {
      return baseData.map(day => {
        const ecgVariation = Math.sin(day.buyers * 0.1) * 5 + Math.cos(day.buyers * 0.05) * 3;
        return {
          date: day.date,
          buyers: Math.max(0, day.buyers + ecgVariation),
          originalBuyers: day.buyers
        };
      });
    };

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
    setEcgGrowthData(generateEcgGrowthData(mockGrowthData));
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center space-y-4 sm:space-y-6 animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto text-primary opacity-20" />
              </div>
              <Sparkles className="relative h-8 w-8 sm:h-12 sm:w-12 md:h-16 md:w-16 mx-auto text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base sm:text-lg md:text-xl font-semibold">Analyzing with AI</h3>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-md mx-auto px-4">
                Processing reviews, extracting insights, and generating visualizations...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center space-y-4 sm:space-y-6 max-w-md animate-in fade-in duration-700 px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
              <BarChart3 className="relative h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 mx-auto text-primary/80" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Ready to Analyze</h2>
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
                Enter an Amazon ASIN in the sidebar to unlock powerful AI-driven insights, 
                sentiment analysis, and visual analytics
              </p>
              <div className="flex gap-2 justify-center flex-wrap pt-2">
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

  const keywordData = (analysis.top_keywords || []).slice(0, 8).map(kw => ({
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
    { emotion: 'Joy', value: Object.values(analysis.reviews.map(r => r.emotions?.joy || 0)).reduce((a, b) => a + b, 0) / analysis.reviews.length },
    { emotion: 'Trust', value: 0.6 },
    { emotion: 'Surprise', value: Object.values(analysis.reviews.map(r => r.emotions?.surprise || 0)).reduce((a, b) => a + b, 0) / analysis.reviews.length },
    { emotion: 'Sadness', value: Object.values(analysis.reviews.map(r => r.emotions?.sadness || 0)).reduce((a, b) => a + b, 0) / analysis.reviews.length },
    { emotion: 'Anger', value: Object.values(analysis.reviews.map(r => r.emotions?.anger || 0)).reduce((a, b) => a + b, 0) / analysis.reviews.length },
  ] : [];

  const totalReviews = analysis.total_reviews || 0;
  const avgRating = analysis.average_rating || 0;
  const sentimentScore = sentimentData.length > 0 
    ? ((sentimentData.find(s => s.name === 'Positive')?.value || 0) / totalReviews * 100) 
    : 0;

  // Calculate growth metrics
  const totalBuyers = growthData.reduce((sum, day) => sum + day.buyers, 0);
  const weeklyGrowth = growthData.length > 1 
    ? ((growthData[growthData.length - 1].buyers - growthData[0].buyers) / growthData[0].buyers * 100)
    : 0;

  // Responsive chart heights
  const getChartHeight = () => {
    if (typeof window === 'undefined') return 300;
    if (window.innerWidth < 640) return 200;  // Mobile
    if (window.innerWidth < 1024) return 250; // Tablet
    return 300; // Desktop
  };

  const chartHeight = getChartHeight();
  const largeChartHeight = Math.min(getChartHeight() + 50, 350);

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-700">
        
        {/* Hero Stats - Responsive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Reviews Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background relative overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                <CardDescription className="text-[10px] sm:text-xs font-medium">Total Reviews</CardDescription>
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{totalReviews.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>

          {/* Average Rating Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-yellow-500/10 via-background to-background relative overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-500 text-yellow-500" />
                <CardDescription className="text-[10px] sm:text-xs font-medium">Average Rating</CardDescription>
              </div>
              <div className="flex items-baseline gap-1 sm:gap-2">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{avgRating.toFixed(1)}</CardTitle>
                <Star className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 fill-yellow-500 text-yellow-500" />
              </div>
            </CardHeader>
          </Card>

          {/* Positive Sentiment Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background relative overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                <CardDescription className="text-[10px] sm:text-xs font-medium">Positive Sentiment</CardDescription>
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{sentimentScore.toFixed(0)}%</CardTitle>
            </CardHeader>
          </Card>

          {/* Key Themes Card */}
          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500/10 via-background to-background relative overflow-hidden">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
                <CardDescription className="text-[10px] sm:text-xs font-medium">Key Themes</CardDescription>
              </div>
              <CardTitle className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold">{themeData.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3">
              <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Growth</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-[10px] sm:text-xs md:text-sm px-2 sm:px-3">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Rating Distribution */}
              {ratingData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-yellow-500" />
                      Rating Distribution
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Customer rating breakdown with review counts</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                    <ResponsiveContainer width="100%" height={chartHeight} className="text-xs">
                      <BarChart data={ratingData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }} 
                        />
                        <YAxis 
                          dataKey="rating" 
                          type="category" 
                          width={window.innerWidth < 640 ? 35 : 45} 
                          tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }} 
                        />
                        <Tooltip 
                          content={<RatingTooltip />}
                          cursor={false}
                        />
                        <Bar 
                          dataKey="count" 
                          radius={[0, 8, 8, 0]}
                          shape={<AnimatedVerticalBar />}
                        >
                          {ratingData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.fill}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Top Keywords */}
              {keywordData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
                      Top Keywords
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Most mentioned words</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                    <ResponsiveContainer width="100%" height={chartHeight} className="text-xs">
                      <BarChart data={keywordData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis 
                          dataKey="keyword" 
                          angle={window.innerWidth < 640 ? -90 : -45} 
                          textAnchor="end" 
                          height={window.innerWidth < 640 ? 100 : 70}
                          tick={{ fontSize: window.innerWidth < 640 ? 8 : 9 }}
                          interval={0}
                        />
                        <YAxis 
                          tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: window.innerWidth < 640 ? '10px' : '11px'
                          }}
                          cursor={false}
                        />
                        <Bar 
                          dataKey="frequency" 
                          radius={[8, 8, 0, 0]}
                          shape={<AnimatedBar />}
                        >
                          {keywordData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.primary} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Themes */}
            {themeData.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-secondary" />
                    Common Themes
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Key topics discussed in reviews with mention frequency</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                  <ResponsiveContainer width="100%" height={chartHeight} className="text-xs">
                    <BarChart data={themeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis 
                        type="number" 
                        tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }} 
                      />
                      <YAxis 
                        dataKey="theme" 
                        type="category" 
                        width={window.innerWidth < 640 ? 80 : 100} 
                        tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }} 
                      />
                      <Tooltip 
                        content={<ThemeTooltip />}
                        cursor={false}
                      />
                      <Bar 
                        dataKey="mentions" 
                        radius={[0, 8, 8, 0]}
                        shape={<AnimatedVerticalBar />}
                      >
                        {themeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.fill}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sentiment Tab */}
          <TabsContent value="sentiment" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Sentiment Pie Chart */}
              <Card className="border-none shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <PieChartIcon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-accent" />
                    Sentiment Distribution
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Overall customer sentiment</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                  <ResponsiveContainer width="100%" height={largeChartHeight} className="text-xs">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={window.innerWidth < 640 ? 70 : window.innerWidth < 1024 ? 80 : 100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        wrapperStyle={{
                          fontSize: window.innerWidth < 640 ? '10px' : '12px',
                          paddingTop: '10px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emotion Radar */}
              {emotionData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-500" />
                      Emotion Analysis
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Emotional tone detected in reviews</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                    <ResponsiveContainer width="100%" height={largeChartHeight} className="text-xs">
                      <RadarChart cx="50%" cy="50%" outerRadius={window.innerWidth < 640 ? "65%" : "80%"} data={emotionData}>
                        <PolarGrid 
                          stroke="hsl(var(--muted-foreground))" 
                          className="opacity-40"
                        />
                        <PolarAngleAxis 
                          dataKey="emotion" 
                          tick={{ 
                            fontSize: window.innerWidth < 640 ? 10 : 12, 
                            fill: 'hsl(var(--foreground))',
                            fontWeight: 500 
                          }} 
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 1]} 
                          tick={{ 
                            fontSize: window.innerWidth < 640 ? 8 : 10,
                            fill: 'hsl(var(--muted-foreground))'
                          }} 
                        />
                        <Radar 
                          name="Emotion Intensity" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.7} 
                          strokeWidth={window.innerWidth < 640 ? 2 : 3}
                          className="drop-shadow-lg"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '2px solid hsl(var(--primary))',
                            borderRadius: '8px',
                            fontSize: window.innerWidth < 640 ? '10px' : '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Growth Tab - ECG-like Line Graph */}
          <TabsContent value="growth" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* ECG-like Growth Chart */}
              <Card className="border-none shadow-lg">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500" />
                    Weekly Buyer Growth
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Buyer trends with ECG-style visualization</CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0 md:p-6 md:pt-0">
                  <ResponsiveContainer width="100%" height={chartHeight} className="text-xs">
                    <LineChart data={ecgGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }}
                      />
                      <YAxis 
                        tick={{ fontSize: window.innerWidth < 640 ? 9 : 10 }} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: window.innerWidth < 640 ? '10px' : '12px'
                        }}
                        formatter={(value, name) => {
                          if (name === 'buyers') return [value, 'ECG Buyers'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Day: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="buyers" 
                        stroke="#10b981"
                        strokeWidth={window.innerWidth < 640 ? 2 : 3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: window.innerWidth < 640 ? 3 : 4 }}
                        activeDot={{ r: window.innerWidth < 640 ? 4 : 6, fill: '#059669' }}
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Growth Metrics */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background">
                <CardHeader className="p-3 sm:p-4 md:p-6">
                  <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-500" />
                    Growth Insights
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Weekly performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50 border">
                      <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600">
                        {totalBuyers.toLocaleString()}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Total Buyers
                      </div>
                    </div>
                    <div className="text-center p-3 sm:p-4 rounded-lg bg-background/50 border">
                      <div className={`text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold ${weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}%
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        Weekly Growth
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="font-semibold text-xs sm:text-sm">Daily Trends</h4>
                    {growthData.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium">{day.date}</span>
                          {day.trend === 'up' ? (
                            <TrendingUp className="h-2 w-2 sm:h-3 sm:w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-2 w-2 sm:h-3 sm:w-3 text-red-500" />
                          )}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold">
                          {day.buyers} buyers
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Growth Analysis */}
            <Card className="border-none shadow-lg">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500" />
                  Growth Analysis
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Key insights from buyer trends</CardDescription>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="font-semibold text-xs sm:text-sm text-green-600">Positive Trends</h4>
                    <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                        <span>Strong weekend performance with 15% increase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1 flex-shrink-0"></div>
                        <span>Consistent growth throughout the week</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <h4 className="font-semibold text-xs sm:text-sm text-red-600">Areas to Watch</h4>
                    <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                        <span>Mid-week dip observed on Wednesday</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1 flex-shrink-0"></div>
                        <span>Friday shows slight decline from Thursday peak</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
              <CardHeader className="p-3 sm:p-4 md:p-6">
                <CardTitle className="text-base sm:text-lg md:text-xl flex items-center gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Key takeaways from review analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 md:p-6">
                {(analysis.insights?.insights || []).map((insight, index) => (
                  <div key={index} className="flex gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-[10px] sm:text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm md:text-base leading-relaxed">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Detailed Report Button */}
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-base sm:text-lg md:text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Ready for Detailed Analysis?
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  View comprehensive insights, AI summaries, and detailed reports
                </p>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-xs sm:text-sm md:text-base" onClick={onViewDetails}>
                  View Detailed Insights
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer with Copyright */}
        <div className="text-center pt-4 sm:pt-6 md:pt-8 pb-4 border-t">
          <p className="text-xs sm:text-sm text-muted-foreground">
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