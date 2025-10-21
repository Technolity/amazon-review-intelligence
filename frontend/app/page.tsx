'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import SidebarFilters from '@/components/SidebarFilters';
import GraphArea from '@/components/GraphArea';
import InsightsPanel from '@/components/InsightsPanel';
import { analyzeReviews, exportAnalysis, getDownloadUrl } from '@/lib/api';
import { amazonUrlParser } from '@/app/utils/amazon_url_parser';
import type { AnalysisResult } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentInput, setCurrentInput] = useState<{ asin: string; country: string }>({ 
    asin: '', 
    country: 'US' 
  });
  const { toast } = useToast();

  const handleAnalyze = useCallback(async (input: string, country: string) => {
    // Extract ASIN from URL or use direct ASIN
    const asin = amazonUrlParser.extractAsin(input);
    
    if (!asin) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid ASIN or Amazon product URL',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setCurrentInput({ asin, country });

    try {
      const result = await analyzeReviews({
        asin,
        country,
        fetch_new: true,
        max_reviews: 5,
      });

      setAnalysis(result);
      
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${result.total_reviews} reviews`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail?.message || 
                          error.response?.data?.error || 
                          'Failed to analyze reviews';
      
      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 6000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    if (!currentInput.asin) {
      toast({
        title: 'No Data',
        description: 'Please analyze a product first',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await exportAnalysis({
        asin: currentInput.asin,
        format,
        include_raw_reviews: format === 'csv',
      });

      const filename = result.download_url.split('/').pop() || '';
      const downloadUrl = getDownloadUrl(filename);
      window.open(downloadUrl, '_blank');

      toast({
        title: 'Export Complete',
        description: `${format.toUpperCase()} file downloaded`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data',
        variant: 'destructive',
      });
    }
  }, [currentInput.asin, toast]);

  const handleReset = useCallback(() => {
    setAnalysis(null);
    setCurrentInput({ asin: '', country: 'US' });
  }, []);

  const handleSearch = useCallback(async (query: string) => {
    await handleAnalyze(query, currentInput.country);
  }, [handleAnalyze, currentInput.country]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar onExport={handleExport} onSearch={handleSearch} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile: Stack layout, Desktop: Side by side */}
        <div className="flex flex-col lg:flex-row w-full">
          <SidebarFilters
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isLoading={isLoading}
          />
          
          <GraphArea 
            analysis={analysis} 
            isLoading={isLoading} 
          />
          
          <InsightsPanel analysis={analysis} />
        </div>
      </div>
    </div>
  );
}