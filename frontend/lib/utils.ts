/**
 * Utility functions for the application.
 * Updated for Apify-only backend with max 5 reviews.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number with commas.
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format percentage.
 */
export function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

/**
 * Validate ASIN format.
 */
export function isValidAsin(asin: string): boolean {
  if (!asin || asin.length !== 10) return false;
  return /^[A-Z0-9]+$/.test(asin);
}

/**
 * Format date to readable string.
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Get sentiment color based on type.
 */
export function getSentimentColor(sentiment: 'positive' | 'neutral' | 'negative'): string {
  const colors = {
    positive: 'text-green-600 bg-green-50 border-green-200',
    neutral: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    negative: 'text-red-600 bg-red-50 border-red-200',
  };
  return colors[sentiment] || colors.neutral;
}

/**
 * Get rating color based on value.
 */
export function getRatingColor(rating: number): string {
  if (rating >= 4.5) return 'text-green-600 bg-green-50';
  if (rating >= 4.0) return 'text-blue-600 bg-blue-50';
  if (rating >= 3.0) return 'text-yellow-600 bg-yellow-50';
  if (rating >= 2.0) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

/**
 * Get rating badge color for stars.
 */
export function getRatingBadgeColor(rating: number): string {
  if (rating === 5) return 'bg-green-100 text-green-800 border-green-200';
  if (rating === 4) return 'bg-blue-100 text-blue-800 border-blue-200';
  if (rating === 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (rating === 2) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

/**
 * Truncate text to specified length.
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate random color for charts.
 */
export function generateColor(index: number): string {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#f97316', // orange
  ];
  return colors[index % colors.length];
}

/**
 * Download file from blob.
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

/**
 * Extract ASIN from input (supports both ASIN and URL)
 */
export function extractAsin(input: string): string | null {
  if (!input) return null;

  const trimmedInput = input.trim();

  // If it looks like an ASIN (10 characters, alphanumeric)
  const asinRegex = /^[A-Z0-9]{10}$/i;
  if (asinRegex.test(trimmedInput.toUpperCase())) {
    return trimmedInput.toUpperCase();
  }

  // Try to extract ASIN from URL patterns
  const urlPatterns = [
    /amazon\.(com|in|co\.uk|de|fr|it|es|ca|co\.jp|com\.au|com\.br|com\.mx)\/dp\/([A-Z0-9]{10})/i,
    /amazon\.(com|in|co\.uk|de|fr|it|es|ca|co\.jp|com\.au|com\.br|com\.mx)\/gp\/product\/([A-Z0-9]{10})/i,
    /amazon\.(com|in|co\.uk|de|fr|it|es|ca|co\.jp|com\.au|com\.br|com\.mx)\/product\/([A-Z0-9]{10})/i,
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
  ];

  for (const pattern of urlPatterns) {
    const match = trimmedInput.match(pattern);
    if (match) {
      const asin = match[2] || match[1];
      if (asin && asin.length === 10) {
        return asin.toUpperCase();
      }
    }
  }

  return null;
}

/**
 * Get country flag emoji from country code
 */
export function getCountryFlag(countryCode: string): string {
  const flags: { [key: string]: string } = {
    US: '🇺🇸',
    IN: '🇮🇳',
    UK: '🇬🇧',
    DE: '🇩🇪',
    FR: '🇫🇷',
    IT: '🇮🇹',
    ES: '🇪🇸',
    CA: '🇨🇦',
    JP: '🇯🇵',
    AU: '🇦🇺',
    BR: '🇧🇷',
    MX: '🇲🇽',
  };
  return flags[countryCode.toUpperCase()] || '🌐';
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const countries: { [key: string]: string } = {
    US: 'United States',
    IN: 'India',
    UK: 'United Kingdom',
    DE: 'Germany',
    FR: 'France',
    IT: 'Italy',
    ES: 'Spain',
    CA: 'Canada',
    JP: 'Japan',
    AU: 'Australia',
    BR: 'Brazil',
    MX: 'Mexico',
  };
  return countries[countryCode.toUpperCase()] || countryCode;
}

/**
 * Format API error message for display
 */
export function formatApiError(error: any): string {
  if (typeof error === 'string') return error;
  
  if (error.message) {
    return error.message;
  }
  
  if (error.detail) {
    return `${error.message} - ${error.detail}`;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Check if we're in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}