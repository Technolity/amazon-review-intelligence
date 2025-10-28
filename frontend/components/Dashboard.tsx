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
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsin, setCurrentAsin] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true); // Track AI state globally
  const { toast } = useToast();

  /**
   * Main analysis handler - now includes enableAI parameter
   */
  const handleAnalyze = async (
    asin: string, 
    maxReviews: number, 
    enableAI: boolean,
    country: string = 'US'
  ) => {
    setIsLoading(true);
    setCurrentAsin(asin);
    setShowDetailedView(false);
    setAiEnabled(enableAI);

    try {
      toast({
        title: enableAI ? '🧠 Starting AI Analysis' : '📋 Fetching Raw Reviews',
        description: `Processing ${maxReviews} reviews for ASIN: ${asin}`,
      });

      const response = await axios.post(
        `${API_URL}/api/v1/analyze`,
        {
          asin: asin,
          max_reviews: maxReviews,
          enable_ai: enableAI, // ✅ Pass AI toggle to backend
          country: country,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000,
        }
      );

      if (response.data.success) {
        setAnalysis(response.data);
        toast({
          title: enableAI ? '✅ AI Analysis Complete!' : '✅ Reviews Fetched!',
          description: `Successfully processed ${response.data.total_reviews} reviews`,
          duration: 3000,
        });
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: '❌ Analysis Failed',
        description: error.response?.data?.detail || error.message || 'An error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export handler for CSV and PDF
   */
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!analysis) {
      toast({
        title: 'No Data',
        description: 'Please analyze a product first',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Generating Export...',
        description: `Creating ${format.toUpperCase()} file`,
      });

      if (format === 'csv') {
        // Generate CSV content
        let csvContent = 'ASIN,Total Reviews,Average Rating,Positive,Neutral,Negative\n';
        csvContent += `${currentAsin},${analysis.total_reviews},${analysis.average_rating},`;
        csvContent += `${analysis.sentiment_distribution?.positive || 0},`;
        csvContent += `${analysis.sentiment_distribution?.neutral || 0},`;
        csvContent += `${analysis.sentiment_distribution?.negative || 0}\n\n`;

        // Add review details if available
        if (analysis.reviews && analysis.reviews.length > 0) {
          csvContent += '\nReview Title,Rating,Sentiment,Text\n';
          analysis.reviews.forEach((review) => {
            const text = review.text?.replace(/"/g, '""') || '';
            csvContent += `"${review.title || ''}",${review.stars || 0},${review.sentiment || 'N/A'},"${text}"\n`;
          });
        }

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `amazon_review_analysis_${currentAsin}_${Date.now()}.csv`;
        link.click();

        toast({
          title: '✅ CSV Downloaded',
          description: 'Your analysis report has been downloaded',
        });
      } else if (format === 'pdf') {
        // For PDF, we would typically call a backend endpoint
        // For now, show a placeholder
        toast({
          title: '🚧 PDF Export',
          description: 'PDF export is coming soon! Use CSV for now.',
          duration: 4000,
        });
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error.message || 'Could not generate export file',
        variant: 'destructive',
      });
    }
  };

  /**
   * Reset handler
   */
  const handleReset = () => {
    setAnalysis(null);
    setCurrentAsin('');
    setShowDetailedView(false);
    toast({
      title: 'Reset Complete',
      description: 'All filters and data have been cleared',
    });
  };

  /**
   * Toggle sidebar collapse
   */
  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  /**
   * Show detailed view
   */
  const handleShowDetails = () => {
    if (analysis) {
      setShowDetailedView(true);
    }
  };

  /**
   * Back to overview from detailed view
   */
  const handleBackToOverview = () => {
    setShowDetailedView(false);
  };

  // If detailed view is active, show that instead
  if (showDetailedView && analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          onExport={handleExport}
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        <DetailedInsights 
          analysis={analysis} 
          onBack={handleBackToOverview}
        />
      </div>
    );
  }

  // Main Dashboard Layout
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar
        onExport={handleExport}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        
        {/* Sidebar Filters - Collapsible */}
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out border-r bg-background",
            sidebarCollapsed ? "w-16" : "w-80"
          )}
        >
          <SidebarFilters
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isLoading={isLoading}
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
          />
        </div>

        {/* Graph/Chart Area - Main Content */}
        <div className="flex-1 overflow-auto bg-muted/30">
          <GraphArea 
            analysis={analysis}
            isLoading={isLoading}
            aiEnabled={aiEnabled}
            onShowDetails={handleShowDetails}
          />
        </div>

        {/* Insights Panel - Right Side */}
        <div className="w-96 border-l bg-background overflow-auto">
          <InsightsPanel 
            analysis={analysis}
            isLoading={isLoading}
            aiEnabled={aiEnabled}
          />
        </div>
      </div>
    </div>
  );
}
