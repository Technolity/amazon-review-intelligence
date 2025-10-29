'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area,
  ResponsiveContainer
} from 'recharts';
import { 
  TrendingUp, Star, MessageSquare, BarChart3, Sparkles, 
  ChevronRight, Eye, Package, Calendar, Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult, EmotionAnalysis } from '@/types';
import { cn } from '@/lib/utils';

const COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b', 
  negative: '#ef4444',
  primary: '#3b82f6',
  secondary: '#8b5cf6',
};

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
  aiEnabled?: boolean;
  onViewDetails?: () => void;
}

export default function GraphArea({ 
  analysis, 
  isLoading = false,
  aiEnabled = true,
  onViewDetails 
}: GraphAreaProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [growthData, setGrowthData] = useState<any[]>([]);

  // Responsive detection
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

  // Get responsive chart height
  const getChartHeight = () => {
    if (isMobile) return 250;
    if (isTablet) return 300;
    return 350;
  };

  // Generate mock growth data
  useEffect(() => {
    const mockGrowthData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        reviews: Math.floor(Math.random() * 50) + 20,
        buyers: Math.floor(Math.random() * 100) + 50,
      };
    });
    setGrowthData(mockGrowthData);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6">
          <div className="flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] gap-4">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 border-b-2 border-primary" />
            <div className="space-y-2 text-center px-4">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
                Analyzing Reviews...
              </h2>
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
          <div className="flex flex-col items-center justify-center min-h-[50vh] md:min-h-[60vh] gap-4 md:gap-6 text-center px-4">
            <div className="rounded-full bg-muted/50 p-3 sm:p-4 md:p-6">
              <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 text-primary/80" />
            </div>
            <div className="space-y-2 md:space-y-3 max-w-md">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                Ready to Analyze
              </h2>
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

  const keywordData = (analysis.top_keywords || []).slice(0, 10).map(kw => ({
    keyword: kw.word,
    frequency: kw.frequency,
  }));

  const themeData = (analysis.themes || []).slice(0, 6).map(theme => ({
    theme: theme.theme,
    mentions: theme.mentions,
    sentiment: theme.sentiment,
    fill: theme.sentiment === 'positive' ? COLORS.positive : 
          theme.sentiment === 'negative' ? COLORS.negative : COLORS.neutral,
  }));

  const ratingData = Object.entries(analysis.rating_distribution || {}).map(([rating, count]) => ({
    rating: `${rating.replace('_star', '')}★`,
    count: count || 0,
  })).reverse();

  const emotionData = analysis.emotion_analysis ? [
    { emotion: 'Joy', value: analysis.emotion_analysis.joy || 0 },
    { emotion: 'Trust', value: analysis.emotion_analysis.trust || 0 },
    { emotion: 'Surprise', value: analysis.emotion_analysis.surprise || 0 },
    { emotion: 'Sadness', value: analysis.emotion_analysis.sadness || 0 },
    { emotion: 'Anger', value: analysis.emotion_analysis.anger || 0 },
    { emotion: 'Fear', value: analysis.emotion_analysis.fear || 0 },
  ] : [];

  return (
    <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-6">
        
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold">
                Product Analysis
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                ASIN: <span className="font-mono font-semibold">{analysis.asin}</span>
              </p>
            </div>
          </div>
          
          {onViewDetails && (
            <Button 
              onClick={onViewDetails} 
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              <Eye className="h-4 w-4 mr-2" />
              <span className="text-xs sm:text-sm">Detailed View</span>
            </Button>
          )}
        </div>

        {/* Tabs - Mobile Optimized */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-9 sm:h-10">
            <TabsTrigger 
              value="overview" 
              className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="growth" 
              className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2"
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Trends</span>
            </TabsTrigger>
            <TabsTrigger 
              value="insights" 
              className="text-[10px] sm:text-xs md:text-sm px-2 py-1.5 sm:py-2"
            >
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Responsive Grid */}
          <TabsContent value="overview" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              
              {/* Sentiment Distribution - Full Width on Mobile */}
              {sentimentData.length > 0 && (
                <Card className="border-none shadow-lg lg:col-span-1">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span>Sentiment Analysis</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Customer sentiment breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 40 : 60}
                          outerRadius={isMobile ? 70 : 90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => `${value}%`}
                          contentStyle={{ fontSize: isMobile ? 11 : 12 }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ fontSize: isMobile ? 11 : 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Rating Distribution - Full Width on Mobile */}
              {ratingData.length > 0 && (
                <Card className="border-none shadow-lg lg:col-span-1">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg flex items-center gap-2">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 flex-shrink-0" />
                      <span>Rating Distribution</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Star rating breakdown
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={getChartHeight()}>
                      <BarChart data={ratingData} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis dataKey="rating" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip contentStyle={{ fontSize: isMobile ? 11 : 12 }} />
                        <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Keywords - Responsive */}
              {keywordData.length > 0 && (
                <Card className="border-none shadow-lg col-span-1 lg:col-span-2">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <CardTitle className="text-sm sm:text-base md:text-lg">
                      Top Keywords
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Most frequently mentioned terms
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
                      <BarChart data={keywordData} margin={{ left: isMobile ? 40 : 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis 
                          dataKey="keyword" 
                          angle={isMobile ? -45 : -30}
                          textAnchor="end"
                          height={60}
                          tick={{ fontSize: isMobile ? 9 : 11 }}
                        />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip contentStyle={{ fontSize: isMobile ? 11 : 12 }} />
                        <Bar dataKey="frequency" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                      </BarChart>
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
                <ResponsiveContainer width="100%" height={getChartHeight()}>
                  <AreaChart data={growthData} margin={{ top: 10, right: 10, left: isMobile ? 0 : 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
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
                    <Tooltip contentStyle={{ fontSize: isMobile ? 11 : 12 }} />
                    <Area 
                      type="monotone" 
                      dataKey="reviews" 
                      stroke={COLORS.primary} 
                      fillOpacity={1} 
                      fill="url(#colorReviews)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab - Responsive */}
          <TabsContent value="insights" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            {aiEnabled ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                
                {/* Themes - Responsive */}
                {themeData.length > 0 && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="p-3 sm:p-4 md:p-6">
                      <CardTitle className="text-sm sm:text-base md:text-lg">
                        Key Themes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                      <ResponsiveContainer width="100%" height={getChartHeight()}>
                        <BarChart data={themeData} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                          <XAxis dataKey="theme" tick={{ fontSize: isMobile ? 9 : 11 }} />
                          <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                          <Tooltip contentStyle={{ fontSize: isMobile ? 11 : 12 }} />
                          <Bar dataKey="mentions" fill={COLORS.primary} radius={[4, 4, 0, 0]}>
                            {themeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Emotion Analysis - Responsive */}
                {emotionData.length > 0 && (
                  <Card className="border-none shadow-lg">
                    <CardHeader className="p-3 sm:p-4 md:p-6">
                      <CardTitle className="text-sm sm:text-base md:text-lg">
                        Emotion Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                      <ResponsiveContainer width="100%" height={getChartHeight()}>
                        <RadarChart data={emotionData}>
                          <PolarGrid stroke="currentColor" className="text-muted/20" />
                          <PolarAngleAxis 
                            dataKey="emotion" 
                            tick={{ 
                              fontSize: isMobile ? 9 : 11,
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
                          <Tooltip contentStyle={{ fontSize: isMobile ? 11 : 12 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-none shadow-lg">
                <CardContent className="p-6 sm:p-8 md:p-12">
                  <div className="text-center space-y-4">
                    <Sparkles className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground/50" />
                    <div>
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                        AI Analysis Disabled
                      </h3>
                      <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                        Enable AI analysis to see advanced insights, themes, and emotion detection
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
