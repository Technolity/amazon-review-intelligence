'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  TrendingUp,
  Star,
  Globe,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Package,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SidebarFiltersProps {
  onAnalyze: (asin: string, maxReviews: number, country: string) => void;
  onReset: () => void;
  isLoading?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const EXAMPLE_ASINS = [
  { asin: 'B08N5WRWNW', label: 'Electronics' },
  { asin: 'B07XJ8C8F5', label: 'Home & Kitchen' },
  { asin: 'B09B8RJNBQ', label: 'Books' },
];

export default function SidebarFilters({
  onAnalyze,
  onReset,
  isLoading = false,
  collapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  onMobileClose,
}: SidebarFiltersProps) {
  const [asin, setAsin] = useState('');
  const [maxReviews, setMaxReviews] = useState(50);
  const [country, setCountry] = useState('US');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (asin.length === 10) {
      onAnalyze(asin.toUpperCase(), maxReviews, country);
      // Close mobile menu after submit
      if (onMobileClose) onMobileClose();
    }
  };

  const handleExampleClick = (exampleAsin: string) => {
    setAsin(exampleAsin);
    onAnalyze(exampleAsin, maxReviews, country);
    if (onMobileClose) onMobileClose();
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    if (asin.length === 10) {
      onAnalyze(asin, maxReviews, newCountry);
    }
  };

  const handleMaxReviewsChange = (value: number[]) => {
    const newMaxReviews = value[0];
    setMaxReviews(newMaxReviews);
    if (asin.length === 10) {
      onAnalyze(asin, newMaxReviews, country);
    }
  };

  // Collapsed view - Desktop only
  if (collapsed && !mobileOpen) {
    return (
      <aside className="hidden lg:flex w-16 border-r bg-background flex-col items-center py-4 gap-4 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-2 hover:bg-primary/10 h-9 w-9"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col gap-3 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-primary/20 transition-colors h-10 w-10"
            title="Search"
          >
            <Search className="h-5 w-5 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors h-10 w-10"
            title="Filters"
          >
            <Filter className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-muted/50 transition-colors h-10 w-10"
            title="Trending"
          >
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="mt-auto hover:bg-destructive/10 h-9 w-9"
          title="Reset"
          disabled={isLoading}
        >
          <RotateCcw className="h-5 w-5 text-muted-foreground" />
        </Button>
      </aside>
    );
  }

  // Sidebar Content Component (shared between mobile and desktop)
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary flex-shrink-0" />
          <h2 className="text-base font-semibold">Filters & Search</h2>
        </div>
        
        {/* Desktop collapse button */}
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hidden lg:flex hover:bg-primary/10 h-8 w-8"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Mobile close button */}
        {onMobileClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="lg:hidden h-8 w-8"
            title="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* ASIN Input */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="text-sm font-medium">Amazon ASIN</Label>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              placeholder="B08N5WRWNW"
              value={asin}
              onChange={(e) => setAsin(e.target.value.toUpperCase())}
              maxLength={10}
              className="font-mono text-sm h-10"
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full h-10 text-sm"
              disabled={isLoading || asin.length !== 10}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Reviews
                </>
              )}
            </Button>
          </form>
        </div>

        <Separator />

        {/* Example ASINs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="text-sm font-medium">Try Examples</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_ASINS.map((example) => (
              <Button
                key={example.asin}
                variant="secondary"
                size="sm"
                onClick={() => handleExampleClick(example.asin)}
                disabled={isLoading}
                className="flex-1 min-w-[100px] h-9 text-xs"
              >
                <span className="truncate">{example.label}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Review Count Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Label className="text-sm font-medium">Max Reviews</Label>
            </div>
            <Badge variant="secondary" className="text-xs min-w-[40px] justify-center">
              {maxReviews}
            </Badge>
          </div>
          <Slider
            value={[maxReviews]}
            onValueChange={handleMaxReviewsChange}
            min={10}
            max={100}
            step={10}
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            More reviews = Better insights
          </p>
        </div>

        <Separator />

        {/* Region Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Label className="text-sm font-medium">Region</Label>
          </div>
          <Select value={country} onValueChange={handleCountryChange} disabled={isLoading}>
            <SelectTrigger className="h-10 text-sm">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US">🇺🇸 United States</SelectItem>
              <SelectItem value="UK">🇬🇧 United Kingdom</SelectItem>
              <SelectItem value="IN">🇮🇳 India</SelectItem>
              <SelectItem value="CA">🇨🇦 Canada</SelectItem>
              <SelectItem value="DE">🇩🇪 Germany</SelectItem>
              <SelectItem value="FR">🇫🇷 France</SelectItem>
              <SelectItem value="JP">🇯🇵 Japan</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Updates analysis automatically
          </p>
        </div>

        <Separator />

        {/* Current Settings Summary */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3 border">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-primary flex-shrink-0" />
            Current Settings
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Max Reviews</p>
              <p className="font-medium">{maxReviews}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Region</p>
              <p className="font-medium">
                {country === 'US' ? '🇺🇸 US' :
                 country === 'UK' ? '🇬🇧 UK' :
                 country === 'IN' ? '🇮🇳 IN' :
                 country === 'CA' ? '🇨🇦 CA' :
                 country === 'DE' ? '🇩🇪 DE' :
                 country === 'FR' ? '🇫🇷 FR' : '🇯🇵 JP'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/30 space-y-2">
        <Button
          variant="outline"
          className="w-full h-10 text-sm"
          onClick={onReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          v1.0.0 • Real-time Updates
        </p>
      </div>
    </>
  );

  // Mobile: Full-screen overlay
  if (mobileOpen) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
        
        {/* Mobile Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-50 w-full max-w-sm bg-background border-r flex flex-col lg:hidden transition-transform duration-300">
          <SidebarContent />
        </aside>
      </>
    );
  }

  // Desktop: Normal sidebar
  return (
    <aside className="hidden lg:flex w-80 border-r bg-background flex-col h-[calc(100vh-3.5rem)] transition-all duration-300">
      <SidebarContent />
    </aside>
  );
}