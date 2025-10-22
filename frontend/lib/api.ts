/**
 * API client for backend communication.
 * Updated for Apify-only backend with max 5 reviews.
 */

import axios, { AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// ==================== TYPE DEFINITIONS ====================

export interface ApiError {
  success: false;
  error: string;
  detail?: string;
  error_type?: string;
  suggestion?: string;
  asin?: string;
  country?: string;
}

export interface Review {
  success: boolean;
  asin: string;
  total_reviews: number;
  reviews: ReviewItem[];
  product_title: string;
  fetched_at: string;
  mock_data?: boolean;
  api_source?: string;
  max_reviews_limit?: number;
  country?: string;
  product_info?: ProductInfo;
  error?: string;
  error_type?: string;
  suggestion?: string;
}

export interface ReviewItem {
  review_id: string;
  asin: string;
  rating: number;
  review_text: string;
  review_title: string;
  review_date: string;
  verified_purchase: boolean;
  helpful_votes: number;
  author?: string;
  country?: string;
  source?: string;
}

export interface ProductInfo {
  title?: string;
  asin?: string;
  rating?: number;
  total_reviews?: number;
  price?: string;
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
  max_reviews_limit?: number;
  api_source?: string;
}

export interface SentimentDistribution {
  positive: SentimentCount;
  neutral: SentimentCount;
  negative: SentimentCount;
  average_rating: number;
  median_rating: number;
}

export interface SentimentCount {
  count: number;
  percentage: number;
}

export interface KeywordAnalysis {
  top_keywords: Keyword[];
  total_unique_words: number;
}

export interface Keyword {
  word: string;
  frequency: number;
  tfidf_score: number;
  importance: 'high' | 'medium' | 'low';
}

export interface RatingDistribution {
  '5_star': number;
  '4_star': number;
  '3_star': number;
  '2_star': number;
  '1_star': number;
}

export interface TemporalTrends {
  monthly_data: MonthlyData[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'unknown';
}

export interface MonthlyData {
  month: string;
  review_count: number;
  average_rating: number;
}

export interface Theme {
  topic_id: number;
  keywords: string[];
  weight: number;
  theme: string;
}

export interface Insights {
  insights: string[];
}

export interface AggregateMetrics {
  total_reviews: number;
  average_rating: number;
  verified_percentage: number;
  helpful_reviews_count: number;
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

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  services: {
    apify: ServiceStatus;
  };
}

export interface ServiceStatus {
  service: string;
  status: 'active' | 'inactive' | 'error';
  max_reviews_limit: number;
  description?: string;
  error?: string;
}

// ==================== API CLIENT ====================

// Create axios instance with appropriate timeout for Apify
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for Apify scraping
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const errorMessage = error.response?.data?.error || error.message || 'An error occurred';
    const errorDetail = error.response?.data?.detail;
    const errorType = error.response?.data?.error_type;
    const suggestion = error.response?.data?.suggestion;
    
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).detail = errorDetail;
    (enhancedError as any).error_type = errorType;
    (enhancedError as any).suggestion = suggestion;
    
    throw enhancedError;
  }
);

// ==================== API FUNCTIONS ====================

/**
 * Fetch reviews for a product using Apify (max 5 reviews)
 */
export async function fetchReviews(
  asin_or_url: string, 
  maxReviews: number = 5, 
  country: string = "IN", 
  multi_country: boolean = true
): Promise<Review> {
  
  // Enforce maximum 5 reviews for Apify
  const actualMaxReviews = Math.min(maxReviews, 5);
  
  const response = await apiClient.get<Review>(
    `${API_PREFIX}/reviews/fetch/${encodeURIComponent(asin_or_url)}`,
    {
      params: { 
        max_reviews: actualMaxReviews,
        country: country,
        multi_country: multi_country
      },
    }
  );
  return response.data;
}

/**
 * Fetch reviews using POST request (Apify only)
 */
export async function fetchReviewsPost(
  asin_or_url: string, 
  maxReviews: number = 5, 
  country: string = "IN", 
  multi_country: boolean = true
): Promise<Review> {
  
  // Enforce maximum 5 reviews for Apify
  const actualMaxReviews = Math.min(maxReviews, 5);
  
  const response = await apiClient.post<Review>(
    `${API_PREFIX}/reviews/fetch`,
    {
      asin: asin_or_url,
      max_reviews: actualMaxReviews,
      country: country,
      multi_country: multi_country
    }
  );
  return response.data;
}

/**
 * Analyze reviews for a product (Apify only)
 */
export async function analyzeReviews(request: {
  asin: string;
  fetch_new?: boolean;
  country?: string;
  multi_country?: boolean;
  max_reviews?: number; // Max 5 for Apify
}): Promise<AnalysisResult> {
  
  // Enforce maximum 5 reviews for Apify
  if (request.max_reviews && request.max_reviews > 5) {
    request.max_reviews = 5;
  }
  
  const response = await apiClient.post<AnalysisResult>(
    `${API_PREFIX}/analyze/`,
    request
  );
  return response.data;
}

/**
 * Analyze reviews by ASIN (GET request) - Apify only
 */
export async function analyzeReviewsByAsin(
  asin_or_url: string, 
  country: string = "IN", 
  multi_country: boolean = true,
  max_reviews: number = 5
): Promise<AnalysisResult> {
  
  // Enforce maximum 5 reviews for Apify
  const actualMaxReviews = Math.min(max_reviews, 5);
  
  const response = await apiClient.get<AnalysisResult>(
    `${API_PREFIX}/analyze/${encodeURIComponent(asin_or_url)}`,
    {
      params: {
        country: country,
        multi_country: multi_country,
        max_reviews: actualMaxReviews
      }
    }
  );
  return response.data;
}

/**
 * Export analysis results
 */
export async function exportAnalysis(request: ExportRequest): Promise<ExportResponse> {
  const response = await apiClient.post<ExportResponse>(
    `${API_PREFIX}/export/`,
    request
  );
  return response.data;
}

/**
 * Download exported file
 */
export function getDownloadUrl(filename: string): string {
  return `${API_BASE_URL}${API_PREFIX}/export/download/${filename}`;
}

/**
 * Health check with service status
 */
export async function healthCheck(): Promise<HealthCheckResponse> {
  const response = await apiClient.get('/health');
  return response.data;
}

/**
 * Get service status
 */
export async function getServiceStatus(): Promise<{ apify: ServiceStatus }> {
  try {
    const response = await apiClient.get(`${API_PREFIX}/status`);
    return response.data;
  } catch (error) {
    // Fallback if status endpoint doesn't exist yet
    return {
      apify: {
        service: 'apify',
        status: 'active',
        max_reviews_limit: 5,
        description: 'Amazon reviews scraper using Apify'
      }
    };
  }
}

/**
 * Test API connection
 */
export async function testConnection(): Promise<{ status: string; message: string }> {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (error) {
    throw new Error('Cannot connect to backend server');
  }
}

/**
 * Validate ASIN/URL before making API call
 */
export function validateInput(input: string): { isValid: boolean; asin?: string; error?: string } {
  if (!input || input.trim().length === 0) {
    return { isValid: false, error: 'Please enter an ASIN or Amazon URL' };
  }

  const trimmedInput = input.trim();
  
  // Check if it's a valid ASIN (10 characters, alphanumeric)
  const asinRegex = /^[A-Z0-9]{10}$/i;
  if (asinRegex.test(trimmedInput.toUpperCase())) {
    return { isValid: true, asin: trimmedInput.toUpperCase() };
  }

  // Check if it's a valid Amazon URL
  const urlPatterns = [
    /amazon\.(com|in|co\.uk|de|fr|it|es|ca|co\.jp|com\.au|com\.br|com\.mx)\/dp\/([A-Z0-9]{10})/i,
    /amazon\.(com|in|co\.uk|de|fr|it|es|ca|co\.jp|com\.au|com\.br|com\.mx)\/gp\/product\/([A-Z0-9]{10})/i,
    /amazon\.(com|in|co\.uk|de|fr|it|es|ca|co\.jp|com\.au|com\.br|com\.mx)\/product\/([A-Z0-9]{10})/i,
  ];

  for (const pattern of urlPatterns) {
    const match = trimmedInput.match(pattern);
    if (match && match[2]) {
      return { isValid: true, asin: match[2].toUpperCase() };
    }
  }

  return { 
    isValid: false, 
    error: 'Please enter a valid Amazon ASIN (10 characters) or product URL' 
  };
}

export default apiClient;