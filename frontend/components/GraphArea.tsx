'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AnalysisResult } from '@/types';
import { BarChart3, TrendingUp, PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
}

// Minimal color palette
const COLORS = {
  primary: '#000000',
  secondary: '#666666',
  tertiary: '#999999',
  quaternary: '#CCCCCC',
  background: '#F5F5F5',
};

export default function GraphArea({ analysis, isLoading }: GraphAreaProps) {
  const chartData = useMemo(() => {
    if (!analysis) return null;

    return {
      rating: [
        { name: '5★', value: analysis.rating_distribution['5_star'], fill: COLORS.primary },
        { name: '4★', value: analysis.rating_distribution['4_star'], fill: COLORS.secondary },
        { name: '3★', value: analysis.rating_distribution['3_star'], fill: COLORS.tertiary },
        { name: '2★', value: analysis.rating_distribution['2_star'], fill: COLORS.quaternary },
        { name: '1★', value: analysis.rating_distribution['1_star'], fill: COLORS.background },
      ],
      sentiment: [
        { name: 'Positive', value: analysis.sentiment_distribution.positive.percentage, fill: COLORS.primary },
        { name: 'Neutral', value: analysis.sentiment_distribution.neutral.percentage, fill: COLORS.tertiary },
        { name: 'Negative', value: analysis.sentiment_distribution.negative.percentage, fill: COLORS.quaternary },
      ],
      keywords: analysis.keyword_analysis.top_keywords.slice(0, 8).map(kw => ({
        name: kw.word,
        frequency: kw.frequency,
      })),
      temporal: analysis.temporal_trends.monthly_data.map(td => ({
        month: td.month.substring(5), // Show only MM
        reviews: td.review_count,
        rating: td.average_rating,
      })),
    };
  }, [analysis]);

  if (isLoading) {
    return (
      <main className="flex-1 p-4 lg:p-6">
        <Card className="h-full flex items-center justify-center border-0 bg-muted/10">
          <CardContent className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto mb-4" />
            <p className="text-sm font-medium">Analyzing Reviews...</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="flex-1 p-4 lg:p-6">
        <Card className="h-full flex items-center justify-center border-dashed">
          <CardContent className="text-center max-w-md">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold mb-2">
              Welcome to Review Intelligence
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter an Amazon ASIN to start analyzing
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              <code className="px-2 py-1 bg-muted rounded text-xs">B08N5WRWNW</code>
              <code className="px-2 py-1 bg-muted rounded text-xs">B07XJ8C8F5</code>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
      <div className="space-y-4">
        {/* Header */}
        <Card className="border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base lg:text-lg">
              {analysis.product_title}
            </CardTitle>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>ASIN: {analysis.asin}</span>
              <span>Reviews: {analysis.total_reviews}</span>
            </div>
          </CardHeader>
        </Card>

        {/* Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="keywords" className="text-xs">Keywords</TabsTrigger>
            <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Rating Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData?.rating}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px'
                        }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData?.rating.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sentiment Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData?.sentiment}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {chartData?.sentiment.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="keywords">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Top Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData?.keywords} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="frequency" fill={COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Review Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData?.temporal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="reviews"
                      stroke={COLORS.primary}
                      strokeWidth={2}
                      name="Reviews"
                      dot={false}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rating"
                      stroke={COLORS.secondary}
                      strokeWidth={2}
                      name="Rating"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}