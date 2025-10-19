/**
 * Utility to extract ASIN from Amazon URLs or validate ASINs
 */

export const amazonUrlParser = {
  /**
   * Extract ASIN from Amazon URL or return the input if it's already an ASIN
   */
  extractAsin(input: string): string | null {
    if (!input) return null;

    const trimmedInput = input.trim();

    // If it looks like an ASIN (10 characters starting with B, 0-9, A-Z)
    const asinRegex = /^[A-Z0-9]{10}$/;
    if (asinRegex.test(trimmedInput.toUpperCase())) {
      return trimmedInput.toUpperCase();
    }

    // Try to extract ASIN from URL patterns
    const urlPatterns = [
      /\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/product\/([A-Z0-9]{10})/i,
      /\/dp\/product\/([A-Z0-9]{10})/i,
      /\/ASIN\/([A-Z0-9]{10})/i,
      /amazon\.[^/]+\/.*?([A-Z0-9]{10})(?:[/?]|$)/i,
    ];

    for (const pattern of urlPatterns) {
      const match = trimmedInput.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return null;
  },

  /**
   * Check if input is a valid Amazon URL
   */
  isAmazonUrl(input: string): boolean {
    return input.includes('amazon.') && (
      input.includes('/dp/') ||
      input.includes('/gp/product/') ||
      input.includes('/product/') ||
      input.includes('/ASIN/')
    );
  },

  /**
   * Check if input is a valid ASIN
   */
  isValidAsin(asin: string): boolean {
    const asinRegex = /^[A-Z0-9]{10}$/;
    return asinRegex.test(asin);
  },

  /**
   * Build Amazon URL from ASIN and country code
   */
  buildAmazonUrl(asin: string, countryCode: string = 'IN'): string {
    const domains: { [key: string]: string } = {
      'US': 'amazon.com',
      'IN': 'amazon.in',
      'UK': 'amazon.co.uk',
      'DE': 'amazon.de',
      'FR': 'amazon.fr',
      'IT': 'amazon.it',
      'ES': 'amazon.es',
      'CA': 'amazon.ca',
      'JP': 'amazon.co.jp',
      'AU': 'amazon.com.au',
      'BR': 'amazon.com.br',
      'MX': 'amazon.com.mx'
    };

    const domain = domains[countryCode.toUpperCase()] || 'amazon.com';
    return `https://www.${domain}/dp/${asin}`;
  }
};