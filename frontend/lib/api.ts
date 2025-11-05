/**
 * API Client for Amazon Review Intelligence
 * Updated with proper backend endpoints and review limits
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 60000; // 60 seconds for analysis requests
const MAX_REVIEWS_LIMIT = 100; // Enforce maximum to protect free tier

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📦 Request payload:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ Response Error:', error);
    
    if (error.code === 'ECONNABORTED') {
      throw {
        success: false,
        error: 'Request timeout. Please try again with fewer reviews.',
        error_type: 'timeout_error',
      };
    }
    
    if (error.response) {
      const errorData = error.response.data as any;
      throw {
        success: false,
        error: errorData?.error || errorData?.detail || 'An error occurred',
        error_type: errorData?.error_type || 'api_error',
        status: error.response.status,
        data: errorData, // Include full error data for debugging
      };
    } else if (error.request) {
      throw {
        success: false,
        error: 'Cannot reach server. Please check your connection.',
        error_type: 'network_error',
      };
    } else {
      throw {
        success: false,
        error: error.message || 'Request failed',
        error_type: 'request_error',
      };
    }
  }
);

/**
 * Analyze Amazon product reviews
 */
export async function analyzeReviews(params: {
  asin: string;
  max_reviews?: number;
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
    
    console.log('📥 Analysis complete:', {
      success: response.data.success,
      reviews: response.data.data?.total_reviews || 0,
      source: response.data.metadata?.data_source || 'unknown'
    });
    
    return response.data;
  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
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
    // Enforce maximum review limit
    const safeMaxReviews = Math.min(params.max_reviews || 50, MAX_REVIEWS_LIMIT);
    
    const response = await apiClient.post('/api/v1/reviews/fetch', {
      asin: params.asin,
      max_reviews: safeMaxReviews,
      country: params.country || 'US',
    });
    
    return response.data;
  } catch (error) {
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

// Export the axios instance for custom requests
export { apiClient, MAX_REVIEWS_LIMIT };