'use client';

import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2, Star, Sparkles } from 'lucide-react';
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
        "bg-background p-3 md:p-4 space-y-3 md:space-y-4",
        "lg:h-full overflow-y-auto"
      )}>
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-4 md:pt-6 text-center">
            <AlertCircle className="h-8 w-8 md:h-10 md:w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-xs md:text-sm text-muted-foreground">
              No analysis data available
            </p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-2">
              Enter an ASIN to start
            </p>
          </CardContent>
        </Card>
      </aside>
    );
  }

  // Safe access with fallbacks
  const totalReviews = analysis.total_reviews || 0;
  const averageRating = analysis.average_rating || 0;
  const sentimentDist = analysis.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };
  const themes = analysis.themes || [];
  const keywords = analysis.top_keywords || [];
  const insights = analysis.insights?.insights || [];
  const summary = analysis.insights?.summary || 'Analysis complete';

  // Calculate percentages safely
  const total = sentimentDist.positive + sentimentDist.neutral + sentimentDist.negative;
  const positivePercent = total > 0 ? (sentimentDist.positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (sentimentDist.neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentimentDist.negative / total) * 100 : 0;

  return (
    <aside className={cn(
      "w-full lg:w-80 border-t lg:border-t-0 lg:border-l",
      "bg-background p-3 md:p-4 space-y-3 md:space-y-4",
      "lg:h-full overflow-y-auto lg:max-w-[320px]"
    )}>
      {/* Summary - Responsive */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-muted-foreground">Total Reviews</span>
            <span className="text-xs md:text-sm font-semibold">{totalReviews.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] md:text-xs text-muted-foreground">Avg Rating</span>
            <div className="flex items-center gap-1">
              <Star className="h-2.5 w-2.5 md:h-3 md:w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs md:text-sm font-semibold">
                {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
              </span>
            </div>
          </div>

          <div className="h-px bg-border" />

          <p className="text-[10px] md:text-xs leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </CardContent>
      </Card>

      {/* Sentiment - Responsive */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 md:pb-3">
          <CardTitle className="text-xs md:text-sm font-semibold">Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 md:space-y-3">
          {/* Positive */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs">Positive</span>
              <span className="text-[10px] md:text-xs font-semibold text-green-600">
                {positivePercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={positivePercent} className="h-1 md:h-1.5 bg-muted">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${positivePercent}%` }}
              />
            </Progress>
          </div>

          {/* Neutral */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs">Neutral</span>
              <span className="text-[10px] md:text-xs font-semibold text-yellow-600">
                {neutralPercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={neutralPercent} className="h-1 md:h-1.5 bg-muted">
              <div 
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${neutralPercent}%` }}
              />
            </Progress>
          </div>

          {/* Negative */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] md:text-xs">Negative</span>
              <span className="text-[10px] md:text-xs font-semibold text-red-600">
                {negativePercent.toFixed(0)}%
              </span>
            </div>
            <Progress value={negativePercent} className="h-1 md:h-1.5 bg-muted">
              <div 
                className="h-full bg-red-500 transition-all"
                style={{ width: `${negativePercent}%` }}
              />
            </Progress>
          </div>
        </CardContent>
      </Card>

      {/* Top Themes - Responsive */}
      {themes.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-semibold">Top Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 md:space-y-2">
              {themes.slice(0, 5).map((theme, index) => (
                <div key={index} className="flex items-center justify-between text-[10px] md:text-xs">
                  <span className="truncate flex-1">{theme.theme}</span>
                  <Badge 
                    variant={
                      theme.sentiment === 'positive' ? 'default' : 
                      theme.sentiment === 'negative' ? 'destructive' : 
                      'secondary'
                    }
                    className="ml-2 text-[9px] md:text-[10px] px-1 md:px-1.5 py-0"
                  >
                    {theme.mentions}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Keywords - Responsive */}
      {keywords.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-semibold">Top Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {keywords.slice(0, 10).map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-[9px] md:text-xs px-1.5 md:px-2 py-0"
                >
                  {keyword.word} ({keyword.frequency})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights - Responsive */}
      {insights.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 md:pb-3">
            <CardTitle className="text-xs md:text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-primary" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 md:space-y-2">
            {insights.slice(0, 5).map((insight, index) => (
              <div key={index} className="flex gap-1.5 md:gap-2">
                <CheckCircle2 className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0 mt-0.5 text-green-500" />
                <p className="text-[10px] md:text-xs leading-relaxed">{insight}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Data Source Info - Responsive */}
      <Card className="border-0 bg-muted/50">
        <CardContent className="pt-3 md:pt-4">
          <div className="text-[10px] md:text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data Source:</span>
              <span className="font-medium">{analysis.data_source || 'Mock'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AI Provider:</span>
              <span className="font-medium">{analysis.ai_provider || 'Free NLP'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}