/**
 * API Client for Amazon Review Intelligence
 * Handles all communication with the FastAPI backend
 */

import axios from 'axios';

// Get API URL from environment or use default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Maximum review limit (enforced by backend)
export const MAX_REVIEWS_LIMIT = 100;

// Configure axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('🔴 Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`🟢 API Response: ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('🔴 Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/**
 * Analyze Amazon product reviews
 * CRITICAL FIX: Backend returns nested structure { success, data: {...}, metadata }
 * We need to extract the actual analysis from response.data.data
 */
export async function analyzeReviews(params: {
  asin: string;
  max_reviews: number;
  enable_ai?: boolean;
  country?: string;
}): Promise<any> {
  try {
    // Enforce maximum review limit
    const safeMaxReviews = Math.min(params.max_reviews || 50, MAX_REVIEWS_LIMIT);
    
    const requestData = {
      asin: params.asin,
      max_reviews: safeMaxReviews,
      enable_ai: params.enable_ai ?? true,
      country: params.country || 'US',
    };

    console.log('📤 Analyzing with params:', requestData);
    
    const response = await apiClient.post('/api/v1/analyze', requestData);
    
    // CRITICAL FIX: Extract data from nested structure
    const backendResponse = response.data;
    
    if (!backendResponse.success) {
      throw new Error(backendResponse.error || 'Analysis failed');
    }
    
    // The actual analysis data is in backendResponse.data
    const analysisData = backendResponse.data || {};
    const metadata = backendResponse.metadata || {};
    
    // Flatten the structure for frontend consumption
    const flattenedResponse = {
      success: true,
      asin: metadata.asin || analysisData.asin || params.asin,
      country: params.country || 'US',
      
      // Core metrics
      total_reviews: analysisData.total_reviews || 0,
      average_rating: analysisData.average_rating || 0,
      
      // Distributions
      rating_distribution: analysisData.rating_distribution || {},
      sentiment_distribution: analysisData.sentiment_distribution || null,
      
      // Product info
      product_info: analysisData.product_info || null,
      
      // Reviews array
      reviews: analysisData.reviews || [],
      
      // AI/NLP results
      top_keywords: analysisData.top_keywords || [],
      themes: analysisData.themes || [],
      insights: analysisData.insights || [],
      summary: analysisData.summary || '',
      aggregate_metrics: analysisData.aggregate_metrics || null,
      emotions: analysisData.emotions || null,
      
      // Metadata
      metadata: {
        ...metadata,
        data_source: metadata.data_source || analysisData.data_source || 'unknown',
        ai_enabled: metadata.ai_enabled || params.enable_ai || false,
        timestamp: metadata.timestamp || new Date().toISOString(),
      },
      
      // Legacy support
      data_source: metadata.data_source || analysisData.data_source,
      ai_provider: analysisData.ai_provider,
    };
    
    console.log('📥 Analysis complete (flattened):', {
      success: true,
      reviews: flattenedResponse.total_reviews,
      source: flattenedResponse.metadata.data_source,
      hasKeywords: (flattenedResponse.top_keywords?.length || 0) > 0,
      hasSentiment: !!flattenedResponse.sentiment_distribution,
    });
    
    return flattenedResponse;
    
  } catch (error: any) {
    console.error('❌ Analysis error:', error.response?.data || error.message);
    
    // Return error in consistent format
    throw {
      success: false,
      error: error.response?.data?.detail || error.response?.data?.error || error.message || 'Analysis failed',
      error_type: error.response?.data?.error_type || 'unknown',
    };
  }
}

/**
 * Fetch raw reviews without analysis
 */
export async function fetchReviews(params: {
  asin: string;
  max_reviews?: number;
  country?: string;
}): Promise<any> {
  try {
    const safeMaxReviews = Math.min(params.max_reviews || 50, MAX_REVIEWS_LIMIT);
    
    const response = await apiClient.post('/api/v1/reviews/fetch', {
      asin: params.asin,
      max_reviews: safeMaxReviews,
      country: params.country || 'US',
    });
    
    // Apply same flattening logic
    const backendResponse = response.data;
    const analysisData = backendResponse.data || backendResponse;
    
    return {
      success: true,
      ...analysisData,
      metadata: backendResponse.metadata || {},
    };
    
  } catch (error: any) {
    console.error('Fetch reviews error:', error);
    throw error;
  }
}

/**
 * Get buyer growth data
 */
export async function getBuyerGrowth(
  asin: string,
  period: 'day' | 'week' | 'month' | 'quarter' = 'week'
): Promise<any> {
  try {
    const response = await apiClient.get(`/api/v1/growth/${asin}`, {
      params: { period }
    });
    
    return response.data;
  } catch (error) {
    console.error('Growth data error:', error);
    throw error;
  }
}

/**
 * Generate insights from reviews
 */
export async function generateInsights(reviews: any[]): Promise<any> {
  try {
    const response = await apiClient.post('/api/v1/insights', {
      reviews: reviews
    });
    
    return response.data;
  } catch (error) {
    console.error('Insights error:', error);
    throw error;
  }
}

/**
 * Export analysis results
 */
export async function exportAnalysis(params: {
  format: 'pdf' | 'excel';
  data: any;
}): Promise<any> {
  try {
    const response = await apiClient.post('/api/v1/export', params);
    return response.data;
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<any> {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check error:', error);
    throw error;
  }
}

/**
 * Helper function to format error messages
 */
export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.error) {
    return error.error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if API is using mock data
 */
export function isUsingMockData(response: any): boolean {
  return response?.metadata?.data_source === 'mock' || 
         response?.data_source === 'mock';
}
