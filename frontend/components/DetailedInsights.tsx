'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft, Star, TrendingUp, TrendingDown, AlertCircle,
  CheckCircle2, Sparkles, Download, Share2, Package,
  MessageSquare, ThumbsUp, ThumbsDown, Minus, Calendar,
  BarChart3, Eye, FileText, FileDown, Mail, Twitter, Linkedin, Facebook
} from 'lucide-react';
import type { AnalysisResult } from '@/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface DetailedInsightsProps {
  analysis: AnalysisResult;
  onBack: () => void;
}

export default function DetailedInsights({ analysis, onBack }: DetailedInsightsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const totalReviews = analysis.total_reviews || 0;
  const avgRating = analysis.average_rating || 0;
  const sentimentDist = analysis.sentiment_distribution || { positive: 0, neutral: 0, negative: 0 };
  const total = sentimentDist.positive + sentimentDist.neutral + sentimentDist.negative;
  
  const positivePercent = total > 0 ? (sentimentDist.positive / total) * 100 : 0;
  const neutralPercent = total > 0 ? (sentimentDist.neutral / total) * 100 : 0;
  const negativePercent = total > 0 ? (sentimentDist.negative / total) * 100 : 0;

  const themes = analysis.themes || [];
  const keywords = analysis.top_keywords || [];
  // Normalize analysis.insights which can be either Insights or string[]
  const rawInsights = analysis.insights || [];
  const insights = Array.isArray(rawInsights)
    ? rawInsights
    : (rawInsights.insights || []);
  const summary = Array.isArray(rawInsights)
    ? ''
    : (rawInsights.summary || '');
  const reviews = analysis.reviews || [];

  // Share functions
  const getShareContent = () => {
    const title = analysis?.product_info?.title || `ASIN ${analysis?.asin || ''}`;
    const text = `Amazon Review Intelligence: ${title} - Avg Rating ${avgRating.toFixed(1)}/5 based on ${totalReviews} reviews. AI Analysis shows ${positivePercent.toFixed(0)}% positive sentiment.`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    return { title, text, url };
  };

  const handleWebShare = async () => {
    try {
      const { title, text, url } = getShareContent();

      // Try Web Share API first (mobile)
      if (navigator?.share) {
        await navigator.share({ title, text, url });
        toast({
          title: '✅ Shared successfully',
          description: 'Analysis shared via your device.',
        });
        return;
      }

      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${url}`);
      toast({
        title: '📋 Copied to clipboard',
        description: 'Analysis summary copied. Paste it anywhere to share.',
        duration: 3000,
      });
    } catch (err: any) {
      console.error('Share error:', err);
      toast({
        title: 'Share failed',
        description: err?.message || 'Could not share the analysis',
        variant: 'destructive',
      });
    }
  };

  const handleEmailShare = () => {
    const { title, text, url } = getShareContent();
    const subject = encodeURIComponent(`Amazon Review Analysis: ${title}`);
    const body = encodeURIComponent(`${text}\n\nView full report: ${url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    toast({
      title: '📧 Email client opened',
      description: 'Opening your default email client...',
    });
  };

  const handleTwitterShare = () => {
    const { title, text, url } = getShareContent();
    const tweetText = encodeURIComponent(`${text.substring(0, 240)}... ${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
    toast({
      title: '🐦 Sharing to Twitter',
      description: 'Opening Twitter...',
    });
  };

  const handleLinkedInShare = () => {
    const { url } = getShareContent();
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    toast({
      title: '💼 Sharing to LinkedIn',
      description: 'Opening LinkedIn...',
    });
  };

  const handleFacebookShare = () => {
    const { url } = getShareContent();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    toast({
      title: '📘 Sharing to Facebook',
      description: 'Opening Facebook...',
    });
  };

  const handleSlackShare = () => {
    const { title, text, url } = getShareContent();
    const slackText = encodeURIComponent(`${title}\n${text}\n${url}`);
    window.open(`slack://open`, '_blank');
    // Copy to clipboard for easy pasting in Slack
    navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
    toast({
      title: '💬 Opening Slack',
      description: 'Message copied to clipboard - paste in any Slack channel!',
      duration: 4000,
    });
  };

  // Download CSV function
  const handleDownloadCSV = async () => {
    setIsExporting(true);
    try {
      toast({
        title: '📤 Generating CSV...',
        description: 'Please wait while we prepare your export.',
      });

      const response = await axios.post(
        `${API_URL}/api/v1/export/csv`,
        { analysis_data: analysis },
        { 
          responseType: 'blob',
          timeout: 30000,
        }
      );

      // Create download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reviews_${analysis.asin}_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ CSV Downloaded',
        description: 'Your review data has been exported successfully.',
      });
    } catch (err: any) {
      console.error('CSV download error:', err);
      toast({
        title: 'CSV export failed',
        description: err?.response?.data?.detail || err?.message || 'Could not generate CSV',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Download PDF function
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    try {
      toast({
        title: '📄 Generating PDF...',
        description: 'Creating your detailed report...',
      });

      const response = await axios.post(
        `${API_URL}/api/v1/export/pdf`,
        { analysis_data: analysis },
        { 
          responseType: 'blob',
          timeout: 30000,
        }
      );

      // Create download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${analysis.asin}_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ PDF Downloaded',
        description: 'Your detailed report has been saved.',
      });
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast({
        title: 'PDF export failed',
        description: err?.response?.data?.detail || err?.message || 'Could not generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Overview</span>
            </Button>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={isExporting}
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleWebShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share via Device
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleEmailShare}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email / Gmail
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSlackShare}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Slack
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTwitterShare}>
                    <Twitter className="h-4 w-4 mr-2" />
                    Twitter
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLinkedInShare}>
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFacebookShare}>
                    <Facebook className="h-4 w-4 mr-2" />
                    Facebook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button 
                size="sm" 
                className="gap-2" 
                onClick={handleDownloadCSV}
                disabled={isExporting}
              >
                <FileText className={cn("h-4 w-4", isExporting && "animate-spin")} />
                <span className="hidden sm:inline">CSV</span>
              </Button>
              <Button 
                size="sm" 
                className="gap-2" 
                onClick={handleDownloadPDF}
                disabled={isExporting}
              >
                <FileDown className={cn("h-4 w-4", isExporting && "animate-spin")} />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-[1400px]">
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-700">
          
          {/* Product Header */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <Badge variant="outline">ASIN: {analysis.asin}</Badge>
                    {analysis.country && (
                      <Badge variant="secondary">
                        {analysis.country === 'IN' ? '🇮🇳 India' : 
                         analysis.country === 'US' ? '🇺🇸 US' : 
                         analysis.country === 'UK' ? '🇬🇧 UK' : 
                         analysis.country === 'DE' ? '🇩🇪 Germany' : 
                         analysis.country === 'CA' ? '🇨🇦 Canada' : 
                         analysis.country}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl md:text-3xl">
                    {analysis.product_info?.title || 'Product Analysis Report'}
                  </CardTitle>
                  {analysis.product_info?.brand && (
                    <CardDescription className="text-base">
                      by {analysis.product_info.brand}
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                    <span className="text-3xl font-bold">{avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {totalReviews.toLocaleString()} reviews
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* AI Summary */}
          <Card className="border-none shadow-xl bg-gradient-to-r from-purple-500/10 via-background to-blue-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl md:text-2xl">
                <Sparkles className="h-6 w-6 text-primary" />
                AI-Generated Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base md:text-lg leading-relaxed">
                {summary || `This product has an average rating of ${avgRating.toFixed(1)} stars based on ${totalReviews} reviews. The sentiment analysis shows ${positivePercent.toFixed(0)}% positive, ${neutralPercent.toFixed(0)}% neutral, and ${negativePercent.toFixed(0)}% negative reviews.`}
              </p>
            </CardContent>
          </Card>

          {/* Sentiment Analysis */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sentiment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">Positive</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {positivePercent.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={positivePercent} className="h-2 bg-green-500/20">
                    <div className="h-full bg-green-500" style={{ width: `${positivePercent}%` }} />
                  </Progress>
                  <p className="text-xs text-muted-foreground mt-2">
                    {sentimentDist.positive} reviews
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Minus className="h-5 w-5 text-yellow-600" />
                      <span className="font-semibold">Neutral</span>
                    </div>
                    <span className="text-2xl font-bold text-yellow-600">
                      {neutralPercent.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={neutralPercent} className="h-2 bg-yellow-500/20">
                    <div className="h-full bg-yellow-500" style={{ width: `${neutralPercent}%` }} />
                  </Progress>
                  <p className="text-xs text-muted-foreground mt-2">
                    {sentimentDist.neutral} reviews
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-5 w-5 text-red-600" />
                      <span className="font-semibold">Negative</span>
                    </div>
                    <span className="text-2xl font-bold text-red-600">
                      {negativePercent.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={negativePercent} className="h-2 bg-red-500/20">
                    <div className="h-full bg-red-500" style={{ width: `${negativePercent}%` }} />
                  </Progress>
                  <p className="text-xs text-muted-foreground mt-2">
                    {sentimentDist.negative} reviews
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Key Insights
              </CardTitle>
              <CardDescription>
                AI-extracted patterns and important findings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {insights.length > 0 ? insights.map((insight, index) => (
                  <div 
                    key={index} 
                    className="flex gap-3 p-4 rounded-lg border bg-gradient-to-br from-muted/30 to-muted/10 hover:shadow-md transition-all"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{index + 1}</span>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed">{insight}</p>
                  </div>
                )) : (
                  <div className="col-span-2 text-center text-muted-foreground">
                    <p>Key insights will appear here when AI analysis is available.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Themes & Keywords */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Themes */}
            {themes.length > 0 && (
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Common Themes
                  </CardTitle>
                  <CardDescription>
                    Topics frequently mentioned in reviews
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {themes.slice(0, 8).map((theme, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{theme.theme}</span>
                            <Badge 
                              variant={
                                theme.sentiment === 'positive' ? 'default' : 
                                theme.sentiment === 'negative' ? 'destructive' : 
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {theme.sentiment}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {theme.mentions} mentions
                          </span>
                        </div>
                        <Progress 
                          value={(theme.mentions / totalReviews) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keywords */}
            {keywords.length > 0 && (
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-purple-500" />
                    Top Keywords
                  </CardTitle>
                  <CardDescription>
                    Most frequently used words
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {keywords.slice(0, 20).map((keyword, index) => {
                      const size = keyword.frequency > 15 ? 'large' : keyword.frequency > 10 ? 'medium' : 'small';
                      return (
                        <Badge
                          key={index}
                          variant="outline"
                          className={cn(
                            "transition-all hover:scale-110",
                            size === 'large' && "text-base px-4 py-2",
                            size === 'medium' && "text-sm px-3 py-1.5",
                            size === 'small' && "text-xs px-2 py-1"
                          )}
                        >
                          {keyword.word} ({keyword.frequency})
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sample Reviews */}
          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-orange-500" />
                Sample Reviews
              </CardTitle>
              <CardDescription>
                Representative reviews from the analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="positive" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="positive" className="gap-2">
                    <ThumbsUp className="h-4 w-4" />
                    Positive
                  </TabsTrigger>
                  <TabsTrigger value="neutral" className="gap-2">
                    <Minus className="h-4 w-4" />
                    Neutral
                  </TabsTrigger>
                  <TabsTrigger value="negative" className="gap-2">
                    <ThumbsDown className="h-4 w-4" />
                    Negative
                  </TabsTrigger>
                </TabsList>

                {/* Positive Reviews */}
                <TabsContent value="positive" className="space-y-4">
                  {reviews
                    .filter(r => r.sentiment === 'positive' || r.sentiment === 'positive' || r.rating >= 4)
                    .slice(0, 3)
                    .map((review, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-green-500/5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              by {review.author}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {review.sentiment_confidence?.toFixed(2) || 'N/A'} confidence
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-2">{review.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.text || review.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {review.date}
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </TabsContent>

                {/* Neutral Reviews */}
                <TabsContent value="neutral" className="space-y-4">
                  {reviews
                    .filter(r => r.sentiment === 'neutral' || r.sentiment === 'neutral' || r.rating === 3)
                    .slice(0, 3)
                    .map((review, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-yellow-500/5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              by {review.author}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {review.sentiment_confidence?.toFixed(2) || 'N/A'} confidence
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-2">{review.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.text || review.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {review.date}
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </TabsContent>

                {/* Negative Reviews */}
                <TabsContent value="negative" className="space-y-4">
                  {reviews
                    .filter(r => r.sentiment === 'negative' || r.sentiment === 'negative' || r.rating <= 2)
                    .slice(0, 3)
                    .map((review, index) => (
                      <div key={index} className="p-4 rounded-lg border bg-red-500/5">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={cn(
                                    "h-4 w-4",
                                    i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted"
                                  )}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              by {review.author}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {review.sentiment_confidence?.toFixed(2) || 'N/A'} confidence
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-sm mb-2">{review.title}</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {review.text || review.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {review.date}
                          {review.verified_purchase && (
                            <Badge variant="secondary" className="text-xs">
                              Verified Purchase
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Analysis Metadata */}
          <Card className="border-none shadow-xl bg-muted/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Data Source</p>
                  <p className="font-semibold">{analysis.data_source || 'Mock Generator'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">AI Provider</p>
                  <p className="font-semibold">{analysis.ai_provider || 'Free NLP Stack'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Models Used</p>
                  <p className="font-semibold text-xs">
                    {analysis.models_used?.join(', ') || 'VADER, TextBlob'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Analysis Date</p>
                  <p className="font-semibold text-xs">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 border-t">
            <p className="text-sm text-muted-foreground">
              Powered by <span className="font-semibold text-foreground">Technolity</span> • AI-Driven Analytics Platform
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              © 2025 Technolity. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
