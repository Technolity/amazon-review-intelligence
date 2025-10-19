/**
 * Main graph area with charts and visualizations.
 */

'use client';

import React from 'react';
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

interface GraphAreaProps {
  analysis: AnalysisResult | null;
  isLoading?: boolean;
}

export default function GraphArea({ analysis, isLoading }: GraphAreaProps) {
  if (isLoading) {
    return (
      <main className="flex-1 p-6">
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">Analyzing Reviews...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we process the data</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="flex-1 p-6">
        <Card className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="text-center max-w-md">
            <BarChart3 className="h-20 w-20 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to Review Intelligence
            </h2>
            <p className="text-gray-600 mb-6">
              Enter an Amazon ASIN in the sidebar to start analyzing product reviews and
              discover valuable insights about customer sentiment and feedback.
            </p>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Example ASINs to try:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">B08N5WRWNW</code>
                <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">B07XJ8C8F5</code>
                <code className="px-3 py-1 bg-gray-100 rounded text-sm font-mono">B0B7CPSN8B</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Prepare chart data
  const ratingData = [
    { name: '5 Star', value: analysis.rating_distribution['5_star'], fill: '#10b981' },
    { name: '4 Star', value: analysis.rating_distribution['4_star'], fill: '#3b82f6' },
    { name: '3 Star', value: analysis.rating_distribution['3_star'], fill: '#f59e0b' },
    { name: '2 Star', value: analysis.rating_distribution['2_star'], fill: '#f97316' },
    { name: '1 Star', value: analysis.rating_distribution['1_star'], fill: '#ef4444' },
  ];

  const sentimentData = [
    { name: 'Positive', value: analysis.sentiment_distribution.positive.percentage, fill: '#10b981' },
    { name: 'Neutral', value: analysis.sentiment_distribution.neutral.percentage, fill: '#f59e0b' },
    { name: 'Negative', value: analysis.sentiment_distribution.negative.percentage, fill: '#ef4444' },
  ];

  const keywordData = analysis.keyword_analysis.top_keywords.slice(0, 10).map(kw => ({
    name: kw.word,
    frequency: kw.frequency,
    score: kw.tfidf_score * 100,
  }));

  const temporalData = analysis.temporal_trends.monthly_data.map(td => ({
    month: td.month,
    reviews: td.review_count,
    rating: td.average_rating,
  }));

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="space-y-6">
        {/* Product Info Header */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">
              {analysis.product_title}
            </CardTitle>
            <p className="text-sm text-gray-500">ASIN: {analysis.asin}</p>
          </CardHeader>
        </Card>

        {/* Charts Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="keywords" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Keywords
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Rating Distribution */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Rating Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ratingData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                        {ratingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sentiment Pie Chart */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-base">Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {sentimentData.map((entry, index) => (
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

          {/* Keywords Tab */}
          <TabsContent value="keywords">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Top Keywords by Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={keywordData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="frequency" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">Review Trends Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={temporalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="reviews"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Review Count"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rating"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Avg Rating"
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