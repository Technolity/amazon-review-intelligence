// ================================================================
// frontend/types/index.ts
// COMPLETE VERSION - Matches FIXED_api.ts perfectly
// Replace your entire types/index.ts with this file
// ================================================================

/**
 * TypeScript type definitions for Amazon Review Intelligence
 * These match the backend API response structure exactly
 */

// ================================================================
// CORE DATA TYPES
// ================================================================

export interface ProductInfo {
  title: string | null;
  image_url: string | null;
  asin: string | null;
  average_rating: number | null;
}

export interface Review {
  title: string | null;
  text: string | null;
  stars: number | null;
  date: string | null;
  verified: boolean | null;
  sentiment: string | null;
  sentiment_score: number | null;
}

export interface ReviewSamples {
  positive: Review[];
  negative: Review[];
  neutral: Review[];
}

export interface Summaries {
  overall: string;
  positive_highlights: string;
  negative_highlights: string;
}

export interface Keyword {
  word: string;
  count: number;
  weight?: number;
}

export interface Theme {
  theme: string;
  keywords?: string[];
  mentions: number;
  importance?: number;
  sentiment?: string;
}

export interface Insights {
  summary: string;
  insights: string[];
  confidence?: string;
}

// ================================================================
// MAIN ANALYSIS RESULT (matches backend response exactly)
// ================================================================

export interface AnalysisResult {
  // Status
  success: boolean;
  error?: string;
  
  // Product information
  product_info: ProductInfo | null;
  asin: string;
  
  // Core metrics
  total_reviews: number;
  average_rating: number;
  
  // Distributions
  rating_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number> | null;
  
  // Reviews
  reviews: Review[];
  review_samples: ReviewSamples | null;
  
  // AI/NLP results
  ai_enabled: boolean;
  top_keywords: Keyword[] | null;
  themes: string[] | Theme[] | null;
  emotions: Record<string, number> | null;  // For radar chart
  summaries: Summaries | null;
  
  // Insights
  insights: Insights | any | null;
  
  // Metadata
  timestamp: string;
  processing_time: number | null;
  data_source: string;
}

// ================================================================
// REQUEST TYPES
// ================================================================

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

// ================================================================
// RESPONSE WRAPPERS (for API responses)
// ================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  error_type?: string;
}

// ================================================================
// UI STATE TYPES
// ================================================================

export interface DashboardState {
  analysis: AnalysisResult | null;
  isLoading: boolean;
  currentAsin: string;
  aiEnabled: boolean;
  error: string | null;
}

export interface FilterSettings {
  asin: string;
  maxReviews: number;
  enableAI: boolean;
  country: string;
}

// ================================================================
// CHART DATA TYPES
// ================================================================

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}

export interface SentimentChartData {
  sentiment: string;
  count: number;
  percentage: number;
  fill: string;
}

export interface RatingChartData {
  rating: string;
  count: number;
  fill: string;
}

export interface EmotionChartData {
  emotion: string;
  value: number;
  fullMark: number;
}

export interface KeywordChartData {
  keyword: string;
  frequency: number;
  fill: string;
}

// ================================================================
// CONSTANTS
// ================================================================

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
  { code: 'AU', label: '🇦🇺 Australia' },
  { code: 'IT', label: '🇮🇹 Italy' },
  { code: 'ES', label: '🇪🇸 Spain' },
] as const;

export const SENTIMENT_COLORS = {
  positive: '#10b981',
  neutral: '#f59e0b',
  negative: '#ef4444',
} as const;

export const EMOTION_COLORS = {
  joy: '#10b981',
  trust: '#3b82f6',
  anticipation: '#8b5cf6',
  surprise: '#ec4899',
  sadness: '#64748b',
  fear: '#f59e0b',
  anger: '#ef4444',
  disgust: '#b45309',
} as const;

export const RATING_COLORS = {
  '5': '#10b981',
  '4': '#84cc16',
  '3': '#f59e0b',
  '2': '#fb923c',
  '1': '#ef4444',
} as const;

// ================================================================
// UTILITY TYPES
// ================================================================

export interface APIError {
  success: false;
  error: string;
  error_type?: string;
  status?: number;
  data?: any;
}

export type SentimentType = 'positive' | 'negative' | 'neutral';
export type CountryCode = typeof SUPPORTED_COUNTRIES[number]['code'];
export type DataSource = 'apify' | 'mock' | 'database' | 'unknown';

// ================================================================
// HELPER TYPE GUARDS
// ================================================================

export function isAnalysisResult(obj: any): obj is AnalysisResult {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.success === 'boolean' &&
    typeof obj.asin === 'string' &&
    typeof obj.total_reviews === 'number' &&
    typeof obj.average_rating === 'number'
  );
}

export function isAPIError(obj: any): obj is APIError {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.success === false &&
    typeof obj.error === 'string'
  );
}

// ================================================================
// EXPORT ALL
// ================================================================

export type {
  // Re-export for convenience
  ProductInfo as Product,
  ReviewSamples as SampleReviews,
};
