'use client';
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import SidebarFilters from './SidebarFilters';
import GraphArea from './GraphArea';
import InsightsPanel from './InsightsPanel';
import DetailedInsights from './DetailedInsights';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult } from '@/types';
import { analyzeReviews, formatErrorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsin, setCurrentAsin] = useState('');
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileAsin, setMobileAsin] = useState('');
  
  const { toast } = useToast();

  // Detect mobile/tablet breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    
    if (isMobile) {
      setSidebarMobileOpen(false);
    }

    try {
      toast({
        title: enableAI ? '🧠 Starting AI Analysis' : '📋 Fetching Reviews',
        description: `Processing up to ${maxReviews} reviews for ASIN: ${asin}`,
      });

      const result = await analyzeReviews({
        asin: asin,
        max_reviews: maxReviews,
        enable_ai: enableAI,
        country: country,
      });

      console.log('✅ Analysis result received:', {
        success: result.success,
        total_reviews: result.total_reviews,
        has_reviews: (result.reviews?.length || 0) > 0,
        data_source: result.data_source,
      });

      if (result.success && result.total_reviews > 0) {
        setAnalysis(result);
        
        const dataSource = result.data_source || 'unknown';
        const sourceEmoji = dataSource === 'apify' ? '🌐' : dataSource === 'mock' ? '🎭' : '❓';

        toast({
          title: `✅ Analysis Complete!`,
          description: `${sourceEmoji} Analyzed ${result.total_reviews} reviews from ${dataSource}`,
        });
      } else {
        toast({
          title: '⚠️ No Reviews Found',
          description: `No reviews available for ASIN: ${asin}. Try a different product.`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('❌ Analysis error:', error);
      const errorMessage = formatErrorMessage(error);
      
      toast({
        title: '❌ Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!analysis) {
      toast({
        title: '⚠️ No Data',
        description: 'Please analyze reviews first',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: `📥 Exporting ${format.toUpperCase()}`,
        description: 'Preparing your file...',
      });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${API_URL}/api/v1/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysis),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `amazon-review-analysis-${analysis.asin}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Export Complete',
        description: `Downloaded ${format.toUpperCase()} file`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: '❌ Export Failed',
        description: 'Unable to export file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCurrentAsin('');
    setShowDetailedView(false);
    setIsLoading(false);
    
    toast({
      title: '🔄 Reset Complete',
      description: 'Ready for new analysis',
    });
  };

  const handleShowDetails = () => {
    if (analysis) {
      setShowDetailedView(true);
    }
  };

  const handleBackFromDetails = () => {
    setShowDetailedView(false);
  };

  if (showDetailedView && analysis) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar 
          onExport={handleExport}
          onToggleSidebar={() => {
            if (isMobile) {
              setSidebarMobileOpen(!sidebarMobileOpen);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
        <DetailedInsights 
          analysis={analysis} 
          onBack={handleBackFromDetails}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar 
        onExport={handleExport}
        onToggleSidebar={() => {
          if (isMobile) {
            setSidebarMobileOpen(!sidebarMobileOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
      />

      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex-shrink-0 bg-background border-r transition-all duration-300 ease-in-out",
            "lg:relative lg:z-0",
            isMobile
              ? sidebarMobileOpen
                ? "translate-x-0 w-full sm:w-80"
                : "-translate-x-full w-0"
              : sidebarCollapsed
              ? "w-0 lg:w-16"
              : "w-80"
          )}
        >
          {(isMobile ? sidebarMobileOpen : true) && (
            <SidebarFilters
              onAnalyze={handleAnalyze}
              onReset={handleReset}
              isLoading={isLoading}
              collapsed={!isMobile && sidebarCollapsed}
            />
          )}
        </div>

        {isMobile && sidebarMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          <div className={cn(
            "flex-1 flex flex-col min-h-0 overflow-auto",
            "bg-gradient-to-br from-background via-background to-muted/20"
          )}>
            {!analysis && !isLoading && (
              <div className="flex-1 flex items-center justify-center p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (mobileAsin.trim()) {
                      handleAnalyze(mobileAsin.trim(), 50, true, 'US');
                    }
                  }}
                  className="w-full max-w-md space-y-4"
                >
                  <div className="text-center space-y-2 mb-6">
                    <h2 className="text-2xl font-bold">Start Analysis</h2>
                    <p className="text-muted-foreground text-sm">
                      Enter an Amazon ASIN or use the sidebar filters
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={mobileAsin}
                      onChange={(e) => setMobileAsin(e.target.value)}
                      placeholder="Enter Amazon ASIN"
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !mobileAsin.trim()}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Analyzing…' : 'Analyze Reviews'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <GraphArea 
              analysis={analysis}
              isLoading={isLoading}
              aiEnabled={aiEnabled}
              onViewDetails={handleShowDetails}
            />
          </div>

          <div className={cn(
            "w-full lg:w-96 border-t lg:border-t-0 lg:border-l bg-background overflow-auto",
            "min-h-[400px] lg:min-h-0"
          )}>
            <InsightsPanel 
              analysis={analysis}
              isLoading={isLoading}
              aiEnabled={aiEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
