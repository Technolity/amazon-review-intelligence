/**
 * TypeScript type definitions for the application.
 * Updated for Apify-only backend with max 5 reviews.
 */

export interface KeywordItem {
  word: string;
  frequency: number;
  tfidf_score: number;
  importance: 'high' | 'medium' | 'low';
}

export interface SentimentCount {
  count: number;
  percentage: number;
}

export interface SentimentDistribution {
  positive: SentimentCount;
  neutral: SentimentCount;
  negative: SentimentCount;
  average_rating: number;
  median_rating: number;
}

export interface RatingDistribution {
  '5_star': number;
  '4_star': number;
  '3_star': number;
  '2_star': number;
  '1_star': number;
}

export interface TemporalTrend {
  month: string;
  review_count: number;
  average_rating: number;
}

export interface KeywordAnalysis {
  top_keywords: KeywordItem[];
  total_unique_words: number;
}

export interface TemporalTrends {
  monthly_data: TemporalTrend[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
}

export interface AnalysisResult {
  success: boolean;
  asin: string;
  product_title: string;
  total_reviews: number;
  analyzed_at: string;
  sentiment_distribution: SentimentDistribution;
  keyword_analysis: KeywordAnalysis;
  rating_distribution: RatingDistribution;
  temporal_trends: TemporalTrends;
  insights: string[];
  summary: string;
  max_reviews_limit?: number;
  api_source?: string;
}

export interface Review {
  review_id: string;
  asin: string;
  rating: number;
  review_text: string;
  review_title: string;
  review_date: string;
  verified_purchase: boolean;
  helpful_votes: number;
  author?: string;
  country?: string;
  source?: string;
}

export interface ReviewsResponse {
  success: boolean;
  asin: string;
  total_reviews: number;
  reviews: Review[];
  product_title: string;
  fetched_at: string;
  mock_data?: boolean;
  api_source?: string;
  max_reviews_limit?: number;
  country?: string;
  product_info?: {
    title?: string;
    asin?: string;
    rating?: number;
    total_reviews?: number;
    price?: string;
  };
  error?: string;
  error_type?: string;
  suggestion?: string;
}

export interface AnalyzeRequest {
  input: string;  // ASIN or URL
  keyword?: string;
  fetch_new?: boolean;
  country?: string;  // Country code
  multi_country?: boolean;
  max_reviews?: number; // Max 5 for Apify
}

export interface ExportRequest {
  asin: string;
  format: 'csv' | 'pdf';
  include_raw_reviews?: boolean;
}

export interface ExportResponse {
  success: boolean;
  file_path: string;
  file_size: number;
  format: string;
  download_url: string;
}

export interface ApiError {
  success: false;
  error: string;
  detail?: string;
  error_type?: string;
  suggestion?: string;
  asin?: string;
  country?: string;
}

export interface ServiceStatus {
  service: string;
  status: 'active' | 'inactive' | 'error';
  max_reviews_limit: number;
  description?: string;
  error?: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    apify: ServiceStatus;
  };
}

// Graph Node Types for React Flow
export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    value?: number;
    sentiment?: 'positive' | 'neutral' | 'negative';
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}