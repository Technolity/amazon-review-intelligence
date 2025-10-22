// Type definitions for Amazon Review Intelligence

export interface Review {
  id: string;
  asin: string;
  title: string;
  text: string;
  rating: number;
  author: string;
  date: string;
  verified_purchase: boolean;
  helpful_count: number;
  vine_program?: boolean;
  country?: string;
  
  // AI/NLP fields (added after analysis)
  ai_sentiment?: string;
  sentiment_confidence?: number;
  sentiment_scores?: {
    positive: number;
    neutral: number;
    negative: number;
    compound: number;
  };
  polarity?: number;
  subjectivity?: number;
  emotions?: {
    joy: number;
    sadness: number;
    anger: number;
    fear: number;
    surprise: number;
  };
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface RatingDistribution {
  '5_star': number;
  '4_star': number;
  '3_star': number;
  '2_star': number;
  '1_star': number;
}

export interface Keyword {
  word: string;
  frequency: number;
  relevance?: number;
}

export interface Theme {
  theme: string;
  mentions: number;
  sentiment: string;
  confidence: number;
  keywords?: string[];
}

export interface AggregateMetrics {
  avg_confidence: number;
  avg_polarity: number;
  avg_subjectivity: number;
}

export interface Insights {
  insights: string[];
  summary: string;
  confidence_level: string;
}

export interface ProductInfo {
  asin?: string;
  title?: string;
  brand?: string;
  category?: string;
  price?: number;
  currency?: string;
  in_stock?: boolean;
  images?: string[];
}

export interface AnalysisResult {
  success: boolean;
  asin: string;
  total_reviews: number;
  average_rating?: number;
  
  // Sentiment data
  sentiment_distribution: SentimentDistribution;
  
  // Rating distribution (optional)
  rating_distribution?: RatingDistribution;
  
  // Aggregate metrics
  aggregate_metrics?: AggregateMetrics;
  
  // Themes and keywords
  themes?: Theme[];
  top_keywords?: Keyword[];
  
  // Insights
  insights?: Insights;
  
  // Reviews (subset with AI analysis)
  reviews?: Review[];
  
  // Product information
  product_info?: ProductInfo;
  
  // Metadata
  data_source?: string;
  ai_provider?: string;
  models_used?: string[];
  generated_at?: string;
  
  // Error handling
  error?: string;
  error_type?: string;
}

export interface ExportRequest {
  asin: string;
  format: 'csv' | 'pdf';
  include_raw_reviews?: boolean;
}

export interface ExportResponse {
  success: boolean;
  file_path?: string;
  download_url?: string;
  error?: string;
}