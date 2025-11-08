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

  /**
   * Main analysis handler - FIXED with proper data extraction
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
    
    // Auto-hide sidebar on mobile after search
    if (isMobile) {
      setSidebarMobileOpen(false);
    }

    try {
      toast({
        title: enableAI ? '🧠 Starting AI Analysis' : '📋 Fetching Reviews',
        description: `Processing up to ${maxReviews} reviews for ASIN: ${asin}`,
      });

      // Call the FIXED analyzeReviews function from api.ts
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
        data_source: result.data_source,  // ✅ CORRECT - use result.data_source directly
      });

      if (result.success && result.total_reviews > 0) {
        setAnalysis(result);
        
        const dataSource = result.data_source || 'unknown';  // ✅ CORRECT - use result.data_source directly
        const sourceEmoji = dataSource === 'apify' ? '🌐' : dataSource === 'mock' ? '🎭' : '❓';

        toast({
          title: `✅ Analysis Complete! ${sourceEmoji}`,
          description: `Found ${result.total_reviews} reviews (Source: ${dataSource.toUpperCase()})`,
          duration: 4000,
        });
        
        // Scroll to top on mobile to show results
        if (isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else if (result.success && result.total_reviews === 0) {
        toast({
          title: '⚠️ No Reviews Found',
          description: 'This product has no reviews available. Try a different ASIN.',
          variant: 'destructive',
          duration: 5000,
        });
        setAnalysis(null);
      } else {
        throw new Error('Analysis returned no data');
      }
      
    } catch (error: any) {
      console.error('❌ Analysis failed:', error);
      
      const errorMessage = formatErrorMessage(error);
      
      toast({
        title: '❌ Analysis Failed',
        description: errorMessage,
        variant: 'destructive',
        duration: 6000,
      });
      
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export handler
   */
  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!currentAsin || !analysis) {
      toast({
        title: 'No Data to Export',
        description: 'Please analyze a product first',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: '📊 Export Feature',
      description: `${format.toUpperCase()} export coming soon!`,
    });
  };

  /**
   * Reset handler
   */
  const handleReset = () => {
    setAnalysis(null);
    setCurrentAsin('');
    setShowDetailedView(false);
    setMobileAsin('');
    
    toast({
      title: '🔄 Dashboard Reset',
      description: 'Ready for a new analysis',
    });
  };

  /**
   * Toggle sidebar
   */
  const handleToggleSidebar = () => {
    if (isMobile) {
      setSidebarMobileOpen(!sidebarMobileOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  /**
   * Show detailed view
   */
  const handleShowDetails = () => {
    if (analysis) {
      setShowDetailedView(true);
      if (isMobile) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  /**
   * Back to overview
   */
  const handleBackToOverview = () => {
    setShowDetailedView(false);
  };

  // Detailed view
  if (showDetailedView && analysis) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar
          onExport={handleExport}
          onToggleSidebar={handleToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
        />
        <DetailedInsights 
          analysis={analysis} 
          onBack={handleBackToOverview}
        />
      </div>
    );
  }

  // Main dashboard layout
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar - Only pass props it accepts */}
      <Navbar
        onExport={handleExport}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
      />

      {/* Main content area */}
      <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-3.5rem)] overflow-hidden">
        
        {/* Mobile overlay */}
        {isMobile && sidebarMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div 
          className={cn(
            "md:relative md:h-full",
            isMobile ? [
              "fixed inset-y-0 left-0 z-50 w-80 bg-background shadow-xl",
              "transform transition-transform duration-300 ease-in-out",
              sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"
            ] : [
              "transition-all duration-300 ease-in-out border-r bg-background",
              sidebarCollapsed ? "w-16" : "w-80"
            ]
          )}
        >
          <SidebarFilters
            onAnalyze={handleAnalyze}
            onReset={handleReset}
            isLoading={isLoading}
            isCollapsed={!isMobile && sidebarCollapsed}
            onToggleCollapse={handleToggleSidebar}
            mobileOpen={sidebarMobileOpen}
            isMobile={isMobile}
          />
        </div>

        {/* Content wrapper */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Graph area */}
          <div className="flex-1 overflow-auto bg-muted/30">
            
            {/* Mobile quick search */}
            {!analysis && !isLoading && (
              <div className="sm:hidden p-4 bg-background border-b">
                <h2 className="text-sm font-semibold mb-3">Quick Analysis</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleanAsin = mobileAsin.trim().toUpperCase();
                    if (cleanAsin.length === 10) {
                      handleAnalyze(cleanAsin, 50, true, 'US');
                    }
                  }}
                  className="space-y-3"
                >
                  <div>
                    <input
                      type="text"
                      inputMode="text"
                      placeholder="Enter ASIN (e.g., B0CHX3TYK1)"
                      value={mobileAsin}
                      onChange={(e) => setMobileAsin(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full border rounded-md px-3 h-10 font-mono text-sm"
                      disabled={isLoading}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      10-character Amazon product ID
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60"
                    disabled={isLoading || mobileAsin.length !== 10}
                  >
                    {isLoading ? 'Analyzing…' : 'Analyze Reviews'}
                  </button>
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

          {/* Insights panel */}
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
