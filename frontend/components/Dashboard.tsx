'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import SidebarFilters from './SidebarFilters';
import GraphArea from './GraphArea';
import InsightsPanel from './InsightsPanel';
import DetailedInsights from './DetailedInsights';
import { useToast } from '@/hooks/use-toast';
import type { AnalysisResult } from '@/types';
import type { Review } from '@/types';
import type { RatingDistribution } from '@/types';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAsin, setCurrentAsin] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async (asin: string, maxReviews: number) => {
    setIsLoading(true);
    setCurrentAsin(asin);
    setShowDetailedView(false);

    try {
      toast({
        title: 'Starting Analysis',
        description: `Analyzing ${maxReviews} reviews for ASIN: ${asin}`,
      });

      const response = await axios.post(`${API_URL}/api/v1/analyze`, {
        asin: asin,
        max_reviews: maxReviews,
        enable_ai: true,
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
      });

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
      toast({
        title: 'Analysis Failed',
        description: error.response?.data?.detail || error.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        let csvContent = 'ASIN,Total Reviews,Average Rating,Positive,Neutral,Negative\n';
        csvContent += `${currentAsin},${analysis.total_reviews},${analysis.average_rating},`;
        csvContent += `${analysis.sentiment_distribution?.positive || 0},`;
        csvContent += `${analysis.sentiment_distribution?.neutral || 0},`;
        csvContent += `${analysis.sentiment_distribution?.negative || 0}\n`;

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `review-analysis-${currentAsin}.csv`;
        link.click();
      } else {
        // For PDF, you'll need to install: npm install jspdf
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF();
        
        pdf.setFontSize(20);
        pdf.text('Review Analysis Report', 20, 20);
        pdf.setFontSize(12);
        pdf.text(`ASIN: ${currentAsin}`, 20, 35);
        pdf.text(`Total Reviews: ${analysis.total_reviews}`, 20, 45);
        pdf.text(`Average Rating: ${analysis.average_rating?.toFixed(2)}`, 20, 55);
        
        pdf.save(`review-analysis-${currentAsin}.pdf`);
      }

      toast({
        title: 'Export Complete',
        description: `Downloaded ${format.toUpperCase()} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setAnalysis(null);
    setCurrentAsin('');
    setShowDetailedView(false);
  };

  if (showDetailedView && analysis) {
    return <DetailedInsights analysis={analysis} onBack={() => setShowDetailedView(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        onExport={handleExport}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="flex">
        <SidebarFilters
          onAnalyze={handleAnalyze}
          onReset={handleReset}
          isLoading={isLoading}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 p-4 md:p-6">
          <GraphArea
            analysis={analysis}
            isLoading={isLoading}
            onViewDetails={() => setShowDetailedView(true)}
          />
        </main>

        {!sidebarCollapsed && analysis && (
          <aside className="hidden lg:block w-80 border-l p-4">
            <InsightsPanel analysis={analysis} onViewDetails={() => setShowDetailedView(true)} />
          </aside>
        )}
      </div>
    </div>
  );
}
