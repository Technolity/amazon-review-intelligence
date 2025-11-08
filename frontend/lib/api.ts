// frontend/lib/api.ts
import axios from 'axios';
import type { AnalysisResult } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response:`, {
      url: response.config.url,
      status: response.status,
      success: response.data.success,
      total_reviews: response.data.total_reviews,
    });
    return response;
  },
  (error) => {
    console.error('🔴 Response error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

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
    const analysisData = response.data;
    
    console.log('📥 Analysis response:', {
      success: analysisData.success,
      total_reviews: analysisData.total_reviews,
      average_rating: analysisData.average_rating,
      has_product_info: !!analysisData.product_info,
      has_emotions: !!analysisData.emotions,
      data_source: analysisData.data_source,
    });
    
    if (!analysisData.success) {
      throw new Error(analysisData.error || 'Analysis failed');
    }
    
    if (typeof analysisData.total_reviews !== 'number') {
      analysisData.total_reviews = 0;
    }
    
    if (typeof analysisData.average_rating !== 'number') {
      analysisData.average_rating = 0;
    }
    
    analysisData.reviews = analysisData.reviews || [];
    analysisData.top_keywords = analysisData.top_keywords || [];
    analysisData.themes = analysisData.themes || [];
    analysisData.rating_distribution = analysisData.rating_distribution || {};
    analysisData.sentiment_distribution = analysisData.sentiment_distribution || null;
    
    return analysisData;
    
    export interface Keyword {
     word: string;
    frequency: number;
       }
  } catch (error: any) {
    console.error('❌ Analysis error:', error);
    
    if (error.response) {
      const errorData = error.response.data;
      throw new Error(errorData?.detail || errorData?.error || `Server error: ${error.response.status}`);
    } else if (error.request) {
      throw new Error('No response from server. Check if backend is running.');
    } else {
      throw new Error(error.message || 'Analysis failed');
    }
  }
}

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

export function formatErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.error) return error.error;
  return 'An unexpected error occurred';
}

export const MAX_REVIEWS_LIMIT = 100;
