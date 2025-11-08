// ================================================================
// frontend/types/index.ts
// COMPLETE AND FULLY SYNCED WITH BACKEND
// ================================================================

// ================================================================
// CORE DATA TYPES
// ================================================================

export interface ProductInfo {
  title: string;
  brand?: string;
  price?: string;
  image?: string;
  image_url?: string;
  rating?: number;
  total_reviews?: number;
  asin?: string;
  url?: string;
  average_rating?: number;
}

export interface Review {
  id: string;
  rating: number;
  stars?: number;
  title: string;
  text: string;
  content?: string;
  author: string;
  date: string;
  verified: boolean;
  verified_purchase?: boolean;
  helpful_count: number;
  sentiment?: string;
  sentiment_confidence?: number;
  sentiment_score?: number;
  polarity?: number;
  subjectivity?: number;
  emotions?: Record<string, number>;
  bot_score?: number;
  is_bot_likely?: boolean;
  bot_indicators?: string[];
  images?: string[];
  variant?: string;
  country?: string;
  source?: string;
  sentiment_analysis?: SentimentAnalysis;
}

export interface SentimentAnalysis {
  sentiment: string;
  vader_compound: float;
  textblob_polarity: number;
  confidence: number;
  subjectivity: number;
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
  frequency?: number;
  weight?: number;
  sentiment?: string;
  size?: number;
}

export interface Theme {
  theme: string;
  keywords?: string[];
  mentions: number;
  importance?: number;
  sentiment?: string;
  fill?: string;
}

export interface Insights {
  summary: string;
  insights: string[];
  confidence?: string;
}

export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  trust: number;
  anticipation: number;
}

export interface BotDetectionStats {
  total_reviews: number;
  genuine_count: number;
  bot_count: number;
  bot_percentage: number;
  suspicious_count?: number;
  filtered_count?: number;
}

export interface AnalysisMetadata {
  source: string;
  timestamp: string;
  processing_time?: number;
  models_used?: Record<string, string>;
  data_quality?: {
    completeness: number;
    reliability: number;
    verified_percentage: number;
  };
}

// ================================================================
// MAIN ANALYSIS RESULT (FLAT STRUCTURE)
// ================================================================

export interface AnalysisResult {
  // Status
  success: boolean;
  error?: string;
  error_type?: string;
  
  // Product Information
  product_info: ProductInfo | null;
  asin: string;
  country?: string;
  
  // Core Metrics
  total_reviews: number;
  average_rating: number;
  
  // Distributions
  rating_distribution: Record<string, number>;
  sentiment_distribution: Record<string, number> | null;
  aggregate_metrics?: {
    average_sentiment_score: number;
    sentiment_consistency: number;
    rating_variance: number;
  };
  
  // Reviews
  reviews: Review[];
  review_samples: ReviewSamples | null;
  
  // AI/NLP Results
  ai_enabled: boolean;
  ai_provider?: string;
  top_keywords: Keyword[] | null;
  themes: (string | Theme)[] | null;
  emotions: Record<string, number> | EmotionScores | null;
  summaries: Summaries | null;
  
  // Insights
  insights: Insights | string[] | any | null;
  summary?: string;
  
  // Bot Detection
  bot_detection?: BotDetectionStats;
  
  // Metadata
  timestamp: string;
  processing_time: number | null;
  data_source: string;
  metadata?: AnalysisMetadata;
  models_used?: any;
}

// ================================================================
// REQUEST TYPES
// ================================================================

export interface AnalysisRequest {
  asin: string;
  max_reviews: number;
  enable_ai: boolean;
  country: string;
  enable_emotions?: boolean;
  enable_bot_detection?: boolean;
}

export interface ReviewFetchRequest {
  asin: string;
  max_reviews: number;
  country: string;
}

// ================================================================
// RESPONSE WRAPPERS
// ================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  error_type?: string;
  status?: number;
}

export interface APIError {
  success: false;
  error: string;
  error_type?: string;
  status?: number;
  data?: any;
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
  percentage?: number;
}

export interface KeywordChartData {
  word: string;
  frequency: number;
  sentiment?: string;
  size?: number;
  fill?: string;
}

export interface ThemeChartData {
  theme: string;
  mentions: number;
  sentiment: string;
  fill: string;
}

export interface EmotionChartData {
  emotion: string;
  value: number;
  fullMark: number;
}

export interface RatingChartData {
  rating: string;
  count: number;
  percentage: number;
  fill: string;
}

export interface SentimentChartData {
  name: string;
  value: number;
  fill: string;
}

export interface SentimentTrendData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
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
  { code: 'BR', label: '🇧🇷 Brazil' },
  { code: 'MX', label: '🇲🇽 Mexico' },
  { code: 'AE', label: '🇦🇪 UAE' },
  { code: 'SG', label: '🇸🇬 Singapore' },
  { code: 'NL', label: '🇳🇱 Netherlands' },
  { code: 'SE', label: '🇸🇪 Sweden' },
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
  '5_star': '#10b981',
  '4_star': '#84cc16',
  '3_star': '#f59e0b',
  '2_star': '#fb923c',
  '1_star': '#ef4444',
} as const;

export const CHART_COLORS = {
  primary: '#8b5cf6',
  secondary: '#ec4899',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  positive: '#22c55e',
  neutral: '#eab308',
  negative: '#ef4444',
  purple: '#a855f7',
  pink: '#ec4899',
  blue: '#3b82f6',
  cyan: '#06b6d4',
  teal: '#14b8a6',
  orange: '#f97316',
  gradient1: '#8b5cf6',
  gradient2: '#ec4899',
} as const;

// ================================================================
// UTILITY TYPES
// ================================================================

export type SentimentType = 'positive' | 'negative' | 'neutral';
export type CountryCode = typeof SUPPORTED_COUNTRIES[number]['code'];
export type DataSource = 'apify' | 'mock' | 'database' | 'unknown';
export type EmotionType = keyof typeof EMOTION_COLORS;

// ================================================================
// TYPE GUARDS
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

export function isReview(obj: any): obj is Review {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.id === 'string' &&
    (typeof obj.rating === 'number' || typeof obj.stars === 'number') &&
    typeof obj.text === 'string'
  );
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export function getSentimentColor(sentiment: string): string {
  const s = sentiment?.toLowerCase();
  if (s === 'positive') return SENTIMENT_COLORS.positive;
  if (s === 'negative') return SENTIMENT_COLORS.negative;
  return SENTIMENT_COLORS.neutral;
}

export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return RATING_COLORS['5'];
  if (rating >= 3.5) return RATING_COLORS['4'];
  if (rating >= 2.5) return RATING_COLORS['3'];
  if (rating >= 1.5) return RATING_COLORS['2'];
  return RATING_COLORS['1'];
}

export function formatRatingKey(rating: number | string): string {
  return `${rating}_star`;
}

// ================================================================
// EXPORT ALIASES
// ================================================================

export type {
  ProductInfo as Product,
  ReviewSamples as SampleReviews,
  EmotionScores as Emotions,
};
