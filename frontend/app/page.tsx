/**
 * Main application page - Amazon Review Intelligence Dashboard
 */

'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import SidebarFilters from '@/components/SidebarFilters';
import GraphArea from '@/components/GraphArea';
import InsightsPanel from '@/components/InsightsPanel';
import { analyzeReviews, exportAnalysis, getDownloadUrl } from '@/lib/api';
import type { AnalysisResult } from '@/types';
import { useToast } from '@/components/ui/use-toast';

export default function Home() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsin, setCurrentAsin] = useState('');
  const { toast } = useToast();

  const handleAnalyze = async (asin: string) => {
    setIsLoading(true);
    setCurrentAsin(asin);

    try {
      const result = await analyzeReviews({
        asin,
        fetch_new: true,
      });

      setAnalysis(result);
      
      toast({
        title: 'Analysis Complete',
        description: `Successfully analyzed ${result.total_reviews} reviews for ${asin}`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      
      // Extract error details
      let errorTitle = 'Analysis Failed';
      let errorMessage = 'An error occurred while analyzing reviews.';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // Handle detailed error object
        if (typeof detail === 'object') {
          errorMessage = detail.message || errorMessage;
          
          // Add suggestion if available
          if (detail.suggestion) {
            errorMessage += `\n\n${detail.suggestion}`;
          }
          
          // Customize title based on error type
          if (detail.error_type === 'timeout') {
            errorTitle = '⏱️ Request Timeout';
          } else if (detail.error_type === 'connection_error') {
            errorTitle = '🌐 Connection Error';
          } else if (detail.error_type === 'http_error') {
            errorTitle = '⚠️ Service Error';
          }
        } else {
          errorMessage = detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
        duration: 8000, // Show for 8 seconds
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!currentAsin) {
      toast({
        title: 'No Data',
        description: 'Please analyze a product first',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Exporting...',
        description: `Generating ${format.toUpperCase()} report`,
      });

      const result = await exportAnalysis({
        asin: currentAsin,
        format,
        include_raw_reviews: format === 'csv',
      });

      // Download the file
      const filename = result.download_url.split('/').pop() || '';
      const downloadUrl = getDownloadUrl(filename);
      window.open(downloadUrl, '_blank');

      toast({
        title: 'Export Complete',
        description: `${format.toUpperCase()} file is ready for download`,
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCurrentAsin('');
    toast({
      title: 'Reset Complete',
      description: 'Dashboard has been reset',
    });
  };

  const handleSearch = async (query: string) => {
    // If query looks like an ASIN, analyze it
    if (query.length === 10 && query[0].toUpperCase() === 'B') {
      handleAnalyze(query.toUpperCase());
    } else {
      toast({
        title: 'Invalid ASIN',
        description: 'Please enter a valid 10-character ASIN starting with B',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar onExport={handleExport} onSearch={handleSearch} />

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Filters & Input */}
        <SidebarFilters
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          isLoading={isLoading}
        />

        {/* Center - Graph Area with Charts */}
        <GraphArea 
          analysis={analysis} 
          isLoading={isLoading} 
        />

        {/* Right - Insights Panel */}
        <InsightsPanel analysis={analysis} />
      </div>
    </div>
  );
}