'use client';

import React, { useState, useEffect } from 'react';
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
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // NEW: Mobile-only quick search state
  const [mobileAsin, setMobileAsin] = useState('');
  const [mobileEnableAI, setMobileEnableAI] = useState(true);
  const [mobileMaxReviews, setMobileMaxReviews] = useState(50);
  const [mobileCountry, setMobileCountry] = useState('US');
  
  const { toast } = useToast();

  // Detect mobile/tablet breakpoints
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse sidebar on tablets in portrait mode
      if (window.innerWidth < 1024 && window.innerWidth >= 768) {
        setSidebarCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  /**
   * Main analysis handler - includes mobile sidebar auto-hide
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
    
    // AUTO-HIDE sidebar on mobile after search
    if (isMobile) {
      setSidebarMobileOpen(false);
    }

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
          enable_ai: enableAI,
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
          description: `Found ${response.data.total_reviews} reviews`,
          duration: 4000,
        });
        
        // Scroll to top on mobile to show results
        if (isMobile) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: '❌ Analysis Failed',
        description: error.message || 'Could not analyze the product',
        variant: 'destructive',
        duration: 5000,
      });
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

    try {
      const response = await axios.post(
        `${API_URL}/api/v1/export`,
        {
          asin: currentAsin,
          format: format,
        },
        {
          responseType: format === 'pdf' ? 'blob' : 'text',
        }
      );

      if (format === 'csv') {
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reviews_${currentAsin}_${Date.now()}.csv`;
        a.click();
        
        toast({
          title: '✅ Export Successful',
          description: 'CSV file has been downloaded',
        });
      } else {
        toast({
          title: 'PDF Export',
          description: 'PDF export coming soon. Use CSV for now.',
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
    // NEW: Reset mobile search form
    setMobileAsin('');
    setMobileEnableAI(true);
    setMobileMaxReviews(50);
    setMobileCountry('US');
    
    toast({
      title: 'Reset Complete',
      description: 'All filters and data have been cleared',
    });
  };

  /**
   * Toggle sidebar - different behavior for mobile vs desktop
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
          isMobile={isMobile}
        />
        <DetailedInsights 
          analysis={analysis} 
          onBack={handleBackToOverview}
        />
      </div>
    );
  }

  // Main Dashboard Layout - RESPONSIVE
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <Navbar
        onExport={handleExport}
        onToggleSidebar={handleToggleSidebar}
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
      />

      {/* Main Content Area - Responsive Flex Layout */}
      <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-3.5rem)] overflow-hidden">
        
        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarMobileOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarMobileOpen(false)}
          />
        )}
        
        {/* Sidebar Filters - Mobile Modal or Desktop Fixed */}
        <div 
          className={cn(
            // Mobile: Full-screen modal
            "md:relative md:h-full",
            isMobile ? [
              "fixed inset-y-0 left-0 z-50 w-80 bg-background shadow-xl",
              "transform transition-transform duration-300 ease-in-out",
              sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"
            ] : [
              // Desktop: Collapsible sidebar
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

        {/* Main Content Wrapper - Vertical on Mobile */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Graph/Chart Area - Full Width on Mobile */}
          <div className="flex-1 overflow-auto bg-muted/30">
            
            {/* NEW: Compact Mobile Quick Search - Only visible when no analysis or when loading */}
            {(!analysis || isLoading) && (
              <div className="sm:hidden p-3 bg-background border-b">
                <h2 className="text-sm font-semibold mb-3 text-foreground">Ready to analyze</h2>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const cleanAsin = mobileAsin.trim().toUpperCase();
                    if (cleanAsin.length === 10) {
                      handleAnalyze(cleanAsin, mobileMaxReviews, mobileEnableAI, mobileCountry);
                    }
                  }}
                  className="space-y-2"
                >
                  {/* ASIN input */}
                  <div>
                    <input
                      type="text"
                      inputMode="text"
                      placeholder="Enter ASIN (e.g., B0CHX3TYK1)"
                      value={mobileAsin}
                      onChange={(e) => setMobileAsin(e.target.value.toUpperCase())}
                      maxLength={10}
                      className="w-full border rounded-md px-3 h-10 font-mono text-sm bg-background"
                      disabled={isLoading}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      10-character Amazon product ID
                    </p>
                  </div>

                  {/* Compact Row: AI toggle + Max reviews + Country */}
                  <div className="flex items-center gap-2 text-xs">
                    <label className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-muted/50">
                      <input
                        type="checkbox"
                        checked={mobileEnableAI}
                        onChange={(e) => setMobileEnableAI(e.target.checked)}
                        className="h-3 w-3"
                        disabled={isLoading}
                      />
                      <span className="font-medium">AI</span>
                    </label>

                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Max</span>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        step={10}
                        value={mobileMaxReviews}
                        onChange={(e) => setMobileMaxReviews(Number(e.target.value))}
                        className="w-12 border rounded px-1 h-6 text-xs bg-background"
                        disabled={isLoading}
                      />
                    </div>

                    <select
                      value={mobileCountry}
                      onChange={(e) => setMobileCountry(e.target.value)}
                      className="flex-1 border rounded px-2 h-6 text-xs bg-background"
                      disabled={isLoading}
                    >
                      <option value="US">🇺🇸 US</option>
                      <option value="UK">🇬🇧 UK</option>
                      <option value="DE">🇩🇪 DE</option>
                      <option value="FR">🇫🇷 FR</option>
                      <option value="JP">🇯🇵 JP</option>
                      <option value="CA">🇨🇦 CA</option>
                      <option value="IN">🇮🇳 IN</option>
                    </select>
                  </div>

                  {/* Analyze button */}
                  <button
                    type="submit"
                    className="w-full h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
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

          {/* Insights Panel - Below Graphs on Mobile, Right Side on Desktop */}
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
