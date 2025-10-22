/**
 * API Client for Amazon Review Intelligence
 * Corrected to match YOUR actual types/index.ts
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Import types from YOUR actual index.ts
import type {
  AnalysisResult,
  ExportRequest,
  ExportResponse,
  Review,
} from '@/types';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 120000; // 2 minutes for analysis requests

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
    console.log(`✅ API Response: ${response.config.url} - ${response.status}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ Response Error:', error.response?.data || error.message);
    
    if (error.response) {
      const errorData = error.response.data as any;
      throw {
        success: false,
        error: errorData?.error || errorData?.detail || error.message || 'An error occurred',
        error_type: errorData?.error_type || 'unknown',
        asin: errorData?.asin,
      };
    } else if (error.request) {
      throw {
        success: false,
        error: 'No response from server. Please check your connection.',
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
 * Matches your backend /api/analyze/ endpoint
 */
export async function analyzeReviews(params: {
  asin: string;
  country?: string;
  fetch_new?: boolean;
  max_reviews?: number;
}): Promise<AnalysisResult> {
  try {
    const requestData = {
      input: params.asin,
      country: params.country || 'US',
      fetch_new: params.fetch_new ?? true,
      max_reviews: params.max_reviews || 5,
    };

    const response = await apiClient.post<AnalysisResult>('/api/analyze/', requestData);
    return response.data;
  } catch (error) {
    console.error('Analyze Reviews Error:', error);
    throw error;
  }
}

/**
 * Fetch raw reviews without full analysis
 */
export async function fetchReviews(params: {
  asin: string;
  country?: string;
  max_reviews?: number;
}): Promise<{ success: boolean; reviews: Review[]; asin: string; total_reviews: number }> {
  try {
    const response = await apiClient.post('/api/reviews/fetch', {
      asin: params.asin,
      country: params.country || 'US',
      max_reviews: params.max_reviews || 5,
      multi_country: true,
    });
    return response.data;
  } catch (error) {
    console.error('Fetch Reviews Error:', error);
    throw error;
  }
}

/**
 * Export analysis results to CSV or PDF
 */
export async function exportAnalysis(params: ExportRequest): Promise<ExportResponse> {
  try {
    const response = await apiClient.post<ExportResponse>('/api/export/', {
      asin: params.asin,
      format: params.format,
      include_raw_reviews: params.include_raw_reviews ?? (params.format === 'csv'),
    });
    return response.data;
  } catch (error) {
    console.error('Export Analysis Error:', error);
    throw error;
  }
}

/**
 * Get download URL for exported file
 */
export function getDownloadUrl(filename: string): string {
  return `${API_BASE_URL}/api/export/download/${filename}`;
}

/**
 * Download exported file
 */
export async function downloadExport(filename: string): Promise<void> {
  try {
    const url = getDownloadUrl(filename);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Download Export Error:', error);
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{
  status: string;
  app_name?: string;
  version?: string;
  timestamp: string;
}> {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health Check Error:', error);
    throw error;
  }
}

/**
 * Validate ASIN format
 */
export function isValidAsin(asin: string): boolean {
  // Amazon ASIN is typically 10 characters: B0[8 alphanumeric chars]
  const asinRegex = /^[A-Z0-9]{10}$/;
  return asinRegex.test(asin.toUpperCase());
}

/**
 * Extract ASIN from Amazon URL
 */
export function extractAsinFromUrl(url: string): string | null {
  try {
    // Match various Amazon URL patterns
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/,
      /\/product\/([A-Z0-9]{10})/,
      /\/gp\/product\/([A-Z0-9]{10})/,
      /ASIN[=:]([A-Z0-9]{10})/i,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    // If no match and it looks like a plain ASIN, return it
    if (isValidAsin(url)) {
      return url.toUpperCase();
    }

    return null;
  } catch (error) {
    console.error('Extract ASIN Error:', error);
    return null;
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const err = error as any;
    return err.error || err.message || 'An unexpected error occurred';
  }
  return String(error);
}

/**
 * Retry mechanism for failed requests
 */
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
      return await requestFn();
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError;
}

/**
 * Batch analyze multiple ASINs
 */
export async function analyzeBatch(
  asins: string[],
  country: string = 'US'
): Promise<AnalysisResult[]> {
  const results: AnalysisResult[] = [];
  const errors: { asin: string; error: string }[] = [];

  for (const asin of asins) {
    try {
      console.log(`📊 Analyzing ${asin}...`);
      const result = await analyzeReviews({ asin, country });
      results.push(result);
    } catch (error) {
      console.error(`Failed to analyze ${asin}:`, error);
      errors.push({
        asin,
        error: formatErrorMessage(error),
      });
    }
  }

  if (errors.length > 0) {
    console.warn('⚠️ Some analyses failed:', errors);
  }

  return results;
}

// Export the axios instance for custom requests if needed
export { apiClient };

// Re-export types for convenience
export type { AnalysisResult, ExportRequest, ExportResponse, Review };