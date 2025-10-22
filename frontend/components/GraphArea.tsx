'use client';

import React, { useState } from 'react';
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
  Activity, Sparkles, ChevronRight, Eye, Download
} from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { cn } from '@/lib/utils';

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
  onViewDetails?: () => void;
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

export default function GraphArea({ analysis, isLoading, onViewDetails }: GraphAreaProps) {
  const [activeTab, setActiveTab] = useState('overview');

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
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="sentiment" className="text-xs md:text-sm">
              <PieChartIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Sentiment</span>
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
                    <CardDescription>Customer rating breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={ratingData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis dataKey="rating" type="category" width={50} tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                        />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                          {ratingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
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
                        />
                        <Bar dataKey="frequency" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Themes - Horizontal Bar Chart */}
            {themeData.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Common Themes
                  </CardTitle>
                  <CardDescription>Key topics discussed in reviews</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={themeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="theme" type="category" width={120} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="mentions" radius={[0, 8, 8, 0]}>
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
                    <CardDescription>Emotional tone detected</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={emotionData}>
                        <PolarGrid stroke="currentColor" className="text-muted/20" />
                        <PolarAngleAxis dataKey="emotion" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fontSize: 10 }} />
                        <Radar name="Intensity" dataKey="value" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
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
                  View comprehensive insights, AI summaries, and export reports
                </p>
              </div>
              <div className="flex gap-3">
                <Button size="lg" variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-secondary hover:opacity-90" onClick={onViewDetails}>
                  View Details
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