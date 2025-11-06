/**
 * Type definitions for Amazon Review Intelligence
 */

// Review types
export interface Review {
  id: string;
  rating: number;
  title: string;
  text: string;
  author: string;
  date: string;
  verified: boolean;
  helpful_count: number;
  sentiment?: string;
  sentiment_confidence?: number;
  polarity?: number;
  subjectivity?: number;
  emotions?: Record<string, number>;
}

// Product information
export interface ProductInfo {
  title: string;
  brand: string;
  price: string;
  image: string;
  rating?: number;
  total_reviews?: number;
  asin?: string;
}

// Sentiment distribution
export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

// Rating distribution
export interface RatingDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

// Keyword data
export interface Keyword {
  word: string;
  frequency: number;
  weight?: number;
}

// Theme data
export interface Theme {
  theme: string;
  keywords?: string[];
  mentions: number;
  importance?: number;
  sentiment?: string;
}

// Insights
export interface Insights {
  insights: string[];
  recommendations?: string[];
  summary: string;
  confidence?: string;
}

// Growth data point
export interface GrowthDataPoint {
  date: string;
  buyers: number;
  trend: 'up' | 'down' | 'stable';
  rating?: number;
  review_velocity?: number;
}

// Analysis metadata
export interface AnalysisMetadata {
  asin: string;
  timestamp: string;
  data_source: 'apify' | 'mock' | 'unknown';
  ai_enabled: boolean;
  total_reviews?: number;
  processing_time?: string;
}

// Main analysis result
export interface AnalysisResult {
  success: boolean;
  asin?: string;
  country?: string;
  product_info?: ProductInfo;
  reviews?: Review[];
  total_reviews: number;
  average_rating: number;
  rating_distribution: RatingDistribution;
  sentiment_distribution?: SentimentDistribution;
  aggregate_metrics?: {
    avg_confidence?: number;
    avg_polarity?: number;
    avg_subjectivity?: number;
  };
  emotions?: Record<string, number>;
  top_keywords?: Keyword[];
  themes?: Theme[];
  insights?: Insights | string[];
  summary?: string;
  data_source?: 'apify' | 'mock';
  ai_provider?: string;
  metadata?: AnalysisMetadata;
  error?: string;
  error_type?: string;
}

// API Request types
export interface AnalysisRequest {
  asin: string;
  max_reviews: number;
  enable_ai: boolean;
  country: string;
}

export interface ReviewFetchRequest {
  asin: string;
  max_reviews: number;
  country: string;
}

export interface GrowthRequest {
  asin: string;
  period: 'day' | 'week' | 'month' | 'quarter';
}

export interface InsightsRequest {
  reviews: Review[];
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  metadata?: AnalysisMetadata;
  error?: string;
  error_type?: string;
}

export interface GrowthResponse {
  success: boolean;
  asin: string;
  period: string;
  data: GrowthDataPoint[];
  metadata?: {
    timestamp: string;
    data_points: number;
  };
}

// Export request/response types
export interface ExportRequest {
  format: 'pdf' | 'excel' | 'csv';
  data: AnalysisResult;
}

export interface ExportResponse {
  success: boolean;
  filename?: string;
  url?: string;
  error?: string;
}

// Dashboard state types
export interface DashboardState {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  currentAsin: string;
  aiEnabled: boolean;
  error: string | null;
}

// Filter settings
export interface FilterSettings {
  asin: string;
  maxReviews: number;
  enableAI: boolean;
  country: string;
}

// Constants
export const MAX_REVIEWS_LIMIT = 100;
export const DEFAULT_MAX_REVIEWS = 50;
export const SUPPORTED_COUNTRIES = [
  { code: 'US', label: '🇺🇸 United States' },
  { code: 'UK', label: '🇬🇧 United Kingdom' },
  { code: 'IN', label: '🇮🇳 India' },
  { code: 'CA', label: '🇨🇦 Canada' },
  { code: 'DE', label: '🇩🇪 Germany' },
  { code: 'FR', label: '🇫🇷 France' },
  { code: 'JP', label: '🇯🇵 Japan' },
];

// Utility type for API errors
export interface APIError {
  success: false;
  error: string;
  error_type?: string;
  status?: number;
  data?: any;
}