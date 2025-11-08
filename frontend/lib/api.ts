// ================================================================
// FIXED: frontend/lib/api.ts
// Replace your current api.ts with this version
// ================================================================

/**
 * API Client for Amazon Review Intelligence
 * FIXED VERSION - handles actual backend response structure
 */

import axios from 'axios';

// Get API URL from environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

console.log('🔧 API configured:', API_URL);

// Configure axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 90000, // 90 seconds for Apify
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('🔴 Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response:`, {
      url: response.config.url,
      status: response.status,
      dataKeys: Object.keys(response.data),
      success: response.data.success,
      total_reviews: response.data.total_reviews,
      hasEmotions: !!response.data.emotions,
      hasSummaries: !!response.data.summaries,
    });
    return response;
  },
  (error) => {
    console.error('🔴 Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ================================================================
// TYPESCRIPT INTERFACES (matching backend)
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
}

export interface AnalysisResult {
  // Status
  success: boolean;
  error?: string;
  
  // Product info
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
  themes: string[] | null;
  emotions: Record<string, number> | null;  // For radar chart!
  summaries: Summaries | null;
  
  // Insights
  insights: any;
  
  // Metadata
  timestamp: string;
  processing_time: number | null;
  data_source: string;
}

// ================================================================
// API FUNCTIONS
// ================================================================

/**
 * Analyze Amazon product reviews
 * FIXED: Backend now returns FLAT structure (no nesting)
 */
export async function analyzeReviews(params: {
  asin: string;
  max_reviews?: number;
  enable_ai?: boolean;
  country?: string;
}): Promise<AnalysisResult> {
  try {
    const requestData = {
      asin: params.asin,
      max_reviews: Math.min(params.max_reviews || 50, 100),
      enable_ai: params.enable_ai ?? true,
      country: params.country || 'US',
    };

    console.log('📤 Analyzing reviews:', requestData);
    
    const response = await apiClient.post<AnalysisResult>('/api/v1/analyze', requestData);
    
    // CRITICAL FIX: Backend NOW returns FLAT structure
    // No need to extract from nested 'data' object anymore!
    const analysisData = response.data;
    
    console.log('📥 Analysis response:', {
      success: analysisData.success,
      total_reviews: analysisData.total_reviews,
      average_rating: analysisData.average_rating,
      has_product_info: !!analysisData.product_info,
      has_emotions: !!analysisData.emotions,
      emotions_count: analysisData.emotions ? Object.keys(analysisData.emotions).length : 0,
      has_summaries: !!analysisData.summaries,
      has_review_samples: !!analysisData.review_samples,
      positive_samples: analysisData.review_samples?.positive?.length || 0,
      negative_samples: analysisData.review_samples?.negative?.length || 0,
      data_source: analysisData.data_source,
    });
    
    // Validate success
    if (!analysisData.success) {
      throw new Error(analysisData.error || 'Analysis failed');
    }
    
    // Ensure required fields exist with defaults
    if (typeof analysisData.total_reviews !== 'number') {
      console.warn('⚠️ Invalid total_reviews, defaulting to 0');
      analysisData.total_reviews = 0;
    }
    
    if (typeof analysisData.average_rating !== 'number') {
      console.warn('⚠️ Invalid average_rating, defaulting to 0');
      analysisData.average_rating = 0;
    }
    
    // Ensure arrays exist
    analysisData.reviews = analysisData.reviews || [];
    analysisData.top_keywords = analysisData.top_keywords || [];
    analysisData.themes = analysisData.themes || [];
    
    // Ensure distributions exist
    analysisData.rating_distribution = analysisData.rating_distribution || {};
    analysisData.sentiment_distribution = analysisData.sentiment_distribution || null;
    
    // Check critical fields for debugging
    if (!analysisData.emotions) {
      console.warn('⚠️ No emotions data - radar chart will not work!');
    } else {
      console.log('✅ Emotions data present:', Object.keys(analysisData.emotions));
    }
    
    if (!analysisData.product_info) {
      console.warn('⚠️ No product_info - title/image will not display!');
    } else {
      console.log('✅ Product info present:', analysisData.product_info.title);
    }
    
    if (!analysisData.review_samples) {
      console.warn('⚠️ No review_samples - positive/negative examples missing!');
    } else {
      console.log('✅ Review samples:', {
        positive: analysisData.review_samples.positive.length,
        negative: analysisData.review_samples.negative.length,
      });
    }
    
    return analysisData;
    
  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    
    if (error.response) {
      // Server responded with error
      const errorData = error.response.data;
      throw new Error(errorData?.detail || errorData?.error || `Server error: ${error.response.status}`);
    } else if (error.request) {
      // No response received
      throw new Error('No response from server. Check if backend is running.');
    } else {
      // Request setup error
      throw new Error(error.message || 'Analysis failed');
    }
  }
}

/**
 * Health check
 */
export async function healthCheck(): Promise<any> {
  try {
    const response = await apiClient.get('/health');
    console.log('✅ Health check passed:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { status: 'unhealthy', error };
  }
}

/**
 * Extract ASIN from Amazon URL or validate ASIN
 */
export function extractASIN(input: string): string | null {
  const trimmed = input.trim().toUpperCase();
  
  // Already an ASIN
  if (/^[A-Z0-9]{10}$/.test(trimmed)) {
    return trimmed;
  }
  
  // Extract from URL
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/product\/([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /asin=([A-Z0-9]{10})/i,
  ];
  
  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

// ================================================================
// CONSTANTS
// ================================================================

export const MAX_REVIEWS_LIMIT = 100;

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

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Format error message
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
}

/**
 * Check if using mock data
 */
export function isUsingMockData(response: AnalysisResult): boolean {
  return response.data_source === 'mock';
}

/**
 * Validate ASIN format
 */
export function isValidASIN(asin: string): boolean {
  return /^[A-Z0-9]{10}$/.test(asin.toUpperCase());
}
