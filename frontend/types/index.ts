/**
 * TypeScript type definitions for the application.
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
  overall_sentiment_score: number;
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
  sentiment_by_keyword?: {
    [keyword: string]: number;
  };
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
  
  // New fields for country and source support
  country?: string;
  countries_tried?: string[];
  successful_country?: string;
  source?: 'apify' | 'mock' | 'scraperapi';
  fetched_at?: string;
  mock_data?: boolean;
  error_type?: string;
  suggestion?: string;
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
  reviewer_name?: string;
  reviewer_id?: string;
}

export interface ReviewsResponse {
  success: boolean;
  asin: string;
  total_reviews: number;
  reviews: Review[];
  product_title: string;
  fetched_at: string;
  mock_data?: boolean;
  
  // New fields for country and source support
  country?: string;
  countries_tried?: string[];
  successful_country?: string;
  source?: 'apify' | 'mock' | 'scraperapi';
  average_rating?: number;
  error_type?: string;
  suggestion?: string;
  error?: string;
  error_detail?: string;
}

export interface AnalyzeRequest {
  asin: string;
  keyword?: string;
  fetch_new?: boolean;
  
  // New fields for country support
  country?: string;
  multi_country?: boolean;
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
  detail?: string | {
    message: string;
    error_type: string;
    suggestion?: string;
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

// Country types for Amazon regions
export interface AmazonCountry {
  code: string;
  name: string;
  flag: string;
  domain: string;
}

export interface CountrySelectionProps {
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  availableCountries: AmazonCountry[];
  disabled?: boolean;
}

export interface MultiCountryToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
}