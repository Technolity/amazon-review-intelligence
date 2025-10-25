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
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
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
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">
          Mentioned {payload[0].value} times
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div 
            className="w-3 h-3 rounded-full"
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
  const [ecgGrowthData, setEcgGrowthData] = useState<{ date: string; buyers: number; originalBuyers: number }[]>([]);

  // Generate ECG-like growth data
  useEffect(() => {
    const generateEcgGrowthData = (baseData: GrowthData[]) => {
      return baseData.map(day => {
        // Add ECG-like variations to the buyer count
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center space-y-6 animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="h-12 w-12 md:h-16 md:w-16 mx-auto text-primary opacity-20" />
              </div>
              <Sparkles className="relative h-12 w-12 md:h-16 md:w-16 mx-auto text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg md:text-xl font-semibold">Analyzing with AI</h3>
              <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto">
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
      <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center space-y-6 max-w-md animate-in fade-in duration-700">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full"></div>
              <BarChart3 className="relative h-16 w-16 md:h-20 md:w-20 mx-auto text-primary/80" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold">Ready to Analyze</h2>
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

  const keywordData = (analysis.top_keywords || []).slice(0, 10).map(kw => ({
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

  return (
    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700">
        
        {/* Hero Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-blue-500/10 via-background to-background">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">Total Reviews</CardDescription>
              <CardTitle className="text-3xl md:text-4xl font-bold">{totalReviews.toLocaleString()}</CardTitle>
            </CardHeader>
            <MessageSquare className="absolute right-4 bottom-4 h-16 w-16 text-blue-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-yellow-500/10 via-background to-background">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">Average Rating</CardDescription>
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-3xl md:text-4xl font-bold">{avgRating.toFixed(1)}</CardTitle>
                <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
              </div>
            </CardHeader>
            <Star className="absolute right-4 bottom-4 h-16 w-16 text-yellow-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">Positive Sentiment</CardDescription>
              <CardTitle className="text-3xl md:text-4xl font-bold">{sentimentScore.toFixed(0)}%</CardTitle>
            </CardHeader>
            <TrendingUp className="absolute right-4 bottom-4 h-16 w-16 text-green-500/20" />
          </Card>

          <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-br from-purple-500/10 via-background to-background">
            <CardHeader className="pb-3">
              <CardDescription className="text-xs font-medium">Key Themes</CardDescription>
              <CardTitle className="text-3xl md:text-4xl font-bold">{themeData.length}</CardTitle>
            </CardHeader>
            <Activity className="absolute right-4 bottom-4 h-16 w-16 text-purple-500/20" />
          </Card>
        </div>

        {/* Main Charts */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-xs md:text-sm">
              <PieChartIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sentiment</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="text-xs md:text-sm">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Growth</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs md:text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Rating Distribution - Multi-line Bar */}
              {ratingData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Rating Distribution
                    </CardTitle>
                    <CardDescription>Customer rating breakdown with review counts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ratingData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="rating" type="category" width={50} tick={{ fontSize: 12 }} />
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

              {/* Top Keywords - Modern Bar Chart */}
              {keywordData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Top Keywords
                    </CardTitle>
                    <CardDescription>Most mentioned words</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={keywordData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis 
                          dataKey="keyword" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
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

            {/* Themes - Horizontal Bar Chart with Frequency Tooltip */}
            {themeData.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Common Themes
                  </CardTitle>
                  <CardDescription>Key topics discussed in reviews with mention frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={themeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="theme" type="category" width={120} tick={{ fontSize: 12 }} />
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
          <TabsContent value="sentiment" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Sentiment Pie Chart */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-accent" />
                    Sentiment Distribution
                  </CardTitle>
                  <CardDescription>Overall customer sentiment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emotion Radar */}
              {emotionData.length > 0 && (
                <Card className="border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      Emotion Analysis
                    </CardTitle>
                    <CardDescription>Emotional tone detected in reviews</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionData}>
                        <PolarGrid 
                          stroke="hsl(var(--muted-foreground))" 
                          className="opacity-40"
                        />
                        <PolarAngleAxis 
                          dataKey="emotion" 
                          tick={{ 
                            fontSize: 12, 
                            fill: 'hsl(var(--foreground))',
                            fontWeight: 500 
                          }} 
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 1]} 
                          tick={{ 
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))'
                          }} 
                        />
                        <Radar 
                          name="Emotion Intensity" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          fill="hsl(var(--primary))" 
                          fillOpacity={0.7} 
                          strokeWidth={3}
                          className="drop-shadow-lg"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '2px solid hsl(var(--primary))',
                            borderRadius: '8px',
                            fontSize: '12px',
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
          <TabsContent value="growth" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* ECG-like Growth Chart */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Weekly Buyer Growth
                  </CardTitle>
                  <CardDescription>Buyer trends with ECG-style visualization</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={ecgGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
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
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: '#059669' }}
                        isAnimationActive={true}
                        animationDuration={500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Growth Metrics */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-green-500/10 via-background to-background">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-green-500" />
                    Growth Insights
                  </CardTitle>
                  <CardDescription>Weekly performance metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 rounded-lg bg-background/50 border">
                      <div className="text-2xl md:text-3xl font-bold text-green-600">
                        {totalBuyers.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total Buyers
                      </div>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-background/50 border">
                      <div className={`text-2xl md:text-3xl font-bold ${weeklyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Weekly Growth
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Daily Trends</h4>
                    {growthData.map((day, index) => (
                      <div key={day.date} className="flex items-center justify-between p-2 rounded-lg bg-background/30">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{day.date}</span>
                          {day.trend === 'up' ? (
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          ) : (
                            <TrendingDown className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                        <div className="text-sm font-semibold">
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
              <CardHeader>
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-500" />
                  Growth Analysis
                </CardTitle>
                <CardDescription>Key insights from buyer trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-green-600">Positive Trends</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                        <span>Strong weekend performance with 15% increase</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0"></div>
                        <span>Consistent growth throughout the week</span>
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-red-600">Areas to Watch</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                        <span>Mid-week dip observed on Wednesday</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                        <span>Friday shows slight decline from Thursday peak</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6 mt-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-background">
              <CardHeader>
                <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Key takeaways from review analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(analysis.insights?.insights || []).map((insight, index) => (
                  <div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed">{insight}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* View Detailed Report Button */}
        <Card className="border-2 border-primary/20 shadow-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left space-y-2">
                <h3 className="text-lg md:text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Ready for Detailed Analysis?
                </h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  View comprehensive insights, AI summaries, and detailed reports
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90" onClick={onViewDetails}>
                  View Detailed Insights
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer with Copyright */}
        <div className="text-center pt-8 pb-4 border-t">
          <p className="text-xs md:text-sm text-muted-foreground">
            Powered by <span className="font-semibold text-foreground">Technolity</span> • AI-Driven Analytics Platform
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2025 Technolity. All rights reserved.
          </p>
        </div>
      </div>
    </main>
  );
}