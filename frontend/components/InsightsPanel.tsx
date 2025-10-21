'use client';

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { AnalysisResult } from '@/types';
import { cn } from '@/lib/utils';

interface InsightsPanelProps {
  analysis: AnalysisResult | null;
}

export default function InsightsPanel({ analysis }: InsightsPanelProps) {
  if (!analysis) {
    return (
      <aside className={cn(
        "w-full lg:w-80 border-t lg:border-t-0 lg:border-l",
        "bg-background p-4 space-y-4",
        "lg:h-full overflow-y-auto"
      )}>
        <Card className="border-0">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No analysis data
            </p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  const sentiment = analysis.sentiment_distribution;

  return (
    <aside className={cn(
      "w-full lg:w-80 border-t lg:border-t-0 lg:border-l",
      "bg-background p-4 space-y-4",
      "lg:h-full overflow-y-auto"
    )}>
      {/* Summary */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium uppercase tracking-wide">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Total Reviews</span>
            <span className="text-sm font-semibold">{analysis.total_reviews.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Avg Rating</span>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-current" />
              <span className="text-sm font-semibold">
                {sentiment.average_rating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <p className="text-xs leading-relaxed text-muted-foreground">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Sentiment */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium uppercase tracking-wide">Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Positive */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Positive</span>
              <span className="text-xs font-semibold">
                {sentiment.positive.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={sentiment.positive.percentage} className="h-1.5" />
          </div>

          {/* Neutral */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Neutral</span>
              <span className="text-xs font-semibold">
                {sentiment.neutral.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={sentiment.neutral.percentage} className="h-1.5" />
          </div>

          {/* Negative */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Negative</span>
              <span className="text-xs font-semibold">
                {sentiment.negative.percentage.toFixed(0)}%
              </span>
            </div>
            <Progress value={sentiment.negative.percentage} className="h-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium uppercase tracking-wide">Top Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1.5">
            {analysis.keyword_analysis.top_keywords.slice(0, 8).map((keyword, index) => (
              <Badge
                key={index}
                variant={keyword.importance === 'high' ? 'default' : 'secondary'}
                className="text-xs px-2 py-0.5"
              >
                {keyword.word} ({keyword.frequency})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-medium uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="h-3 w-3" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {analysis.insights.slice(0, 3).map((insight, index) => (
            <div key={index} className="flex gap-2">
              <CheckCircle2 className="h-3 w-3 flex-shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  )
}