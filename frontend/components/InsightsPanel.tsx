/**
 * Right insights panel showing analysis results.
 */

'use client';

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { AnalysisResult } from '@/types';
import { formatPercentage, formatNumber, getRatingColor } from '@/lib/utils';

interface InsightsPanelProps {
  analysis: AnalysisResult | null;
}

export default function InsightsPanel({ analysis }: InsightsPanelProps) {
  if (!analysis) {
    return (
      <aside className="w-80 border-l bg-gray-50 p-4">
        <Card className="shadow-sm">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p className="text-sm text-gray-600">
              Enter an ASIN and click Analyze to see insights
            </p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  const sentiment = analysis.sentiment_distribution;
  const keywords = analysis.keyword_analysis.top_keywords.slice(0, 10);

  return (
    <aside className="w-80 border-l bg-gray-50 p-4 space-y-4 overflow-y-auto">
      {/* Summary Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Total Reviews</span>
            <span className="text-sm font-bold">{formatNumber(analysis.total_reviews)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Average Rating</span>
            <div className="flex items-center gap-1">
              <Star className={`h-4 w-4 fill-current ${getRatingColor(sentiment.average_rating)}`} />
              <span className={`text-sm font-bold ${getRatingColor(sentiment.average_rating)}`}>
                {sentiment.average_rating.toFixed(1)}
              </span>
            </div>
          </div>

          <Separator />

          <p className="text-xs text-gray-700 leading-relaxed">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Sentiment Distribution */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Sentiment Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Positive */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-green-700">Positive</span>
              <span className="text-xs font-bold text-green-700">
                {formatPercentage(sentiment.positive.percentage)}
              </span>
            </div>
            <Progress value={sentiment.positive.percentage} className="h-2 bg-green-100" />
            <span className="text-xs text-gray-500">
              {formatNumber(sentiment.positive.count)} reviews
            </span>
          </div>

          {/* Neutral */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-yellow-700">Neutral</span>
              <span className="text-xs font-bold text-yellow-700">
                {formatPercentage(sentiment.neutral.percentage)}
              </span>
            </div>
            <Progress value={sentiment.neutral.percentage} className="h-2 bg-yellow-100" />
            <span className="text-xs text-gray-500">
              {formatNumber(sentiment.neutral.count)} reviews
            </span>
          </div>

          {/* Negative */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-700">Negative</span>
              <span className="text-xs font-bold text-red-700">
                {formatPercentage(sentiment.negative.percentage)}
              </span>
            </div>
            <Progress value={sentiment.negative.percentage} className="h-2 bg-red-100" />
            <span className="text-xs text-gray-500">
              {formatNumber(sentiment.negative.count)} reviews
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Top Keywords */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Top Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant={
                  keyword.importance === 'high' ? 'default' :
                  keyword.importance === 'medium' ? 'secondary' :
                  'outline'
                }
                className="text-xs"
              >
                {keyword.word} ({keyword.frequency})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.insights.map((insight, index) => (
            <div key={index} className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-700 leading-relaxed">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}