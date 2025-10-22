'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import SidebarFilters from './SidebarFilters';
import GraphArea from './GraphArea';
import InsightsPanel from './InsightsPanel';
import DetailedInsights from './DetailedInsights';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult } from '@/types';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsin, setCurrentAsin] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async (asin: string) => {
    setIsLoading(true);
    setCurrentAsin(asin);
    setShowDetailedView(false); // Reset to overview when new analysis starts

    try {
      console.log('🔍 Analyzing ASIN:', asin);
      console.log('📡 API URL:', API_URL);

      toast({
        title: 'Starting Analysis',
        description: `Analyzing reviews for ASIN: ${asin}`,
      });

      const response = await axios.post(`${API_URL}/api/v1/analyze`, {
        asin: asin,
        max_reviews: 50,
        enable_ai: true,
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      console.log('✅ Response received:', response.data);

      if (response.data.success) {
        setAnalysis(response.data);
        toast({
          title: 'Analysis Complete!',
          description: `Successfully analyzed ${response.data.total_reviews} reviews`,
        });
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      
      let errorMessage = 'An error occurred';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to backend. Is it running on port 8000?';
      } else if (error.response) {
        errorMessage = error.response?.data?.detail || error.message;
      } else if (error.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = error.message;
      }

      toast({
        title: 'Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
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

      const response = await axios.post(
        `${API_URL}/api/v1/export`,
        {
          asin: currentAsin,
          format: format,
          include_raw_reviews: true,
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analysis_${currentAsin}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Export Complete',
        description: `Downloaded ${format.toUpperCase()} report`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'An error occurred',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCurrentAsin('');
    setShowDetailedView(false);
    toast({
      title: 'Reset Complete',
      description: 'Dashboard has been reset',
    });
  };

  const handleSearch = async (query: string) => {
    if (query.length === 10 && query[0] === 'B') {
      handleAnalyze(query.toUpperCase());
    } else {
      toast({
        title: 'Invalid ASIN',
        description: 'Please enter a valid 10-character ASIN starting with B',
        variant: 'destructive',
      });
    }
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleViewDetails = () => {
    setShowDetailedView(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToOverview = () => {
    setShowDetailedView(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Show detailed insights view
  if (showDetailedView && analysis) {
    return <DetailedInsights analysis={analysis} onBack={handleBackToOverview} />;
  }

  // Show main dashboard
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navbar */}
      <Navbar 
        onExport={handleExport} 
        onSearch={handleSearch}
        onToggleSidebar={toggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content - 3 Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Filters (Hidden on mobile when viewing analysis) */}
        <div className={analysis ? "hidden lg:block" : "block"}>
          <SidebarFilters
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isLoading={isLoading}
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
          />
        </div>

        {/* Center - Graph Area */}
        <GraphArea 
          analysis={analysis} 
          isLoading={isLoading}
          onViewDetails={handleViewDetails}
        />

        {/* Right - Insights Panel (Hidden on mobile, shown on desktop) */}
        <div className="hidden xl:block">
          <InsightsPanel analysis={analysis} />
        </div>
      </div>
    </div>
  );
}