'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  TrendingUp, 
  Globe, 
  Filter, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { amazonUrlParser } from '@/app/utils/amazon_url_parser';

interface SidebarFiltersProps {
  onAnalyze: (asin: string, maxReviews: number, enableAI: boolean, country: string) => void;
  onReset: () => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  isMobile?: boolean;
}

const EXAMPLE_ASINS = [
  { asin: 'B0CHX3TYK1', label: 'Popular Headphones' },
  { asin: 'B07ZPKN6Y9', label: 'Smart Watch' },
  { asin: 'B09G9BL5CP', label: 'Kitchen Appliance' },
];

const COUNTRIES = [
{ code: 'US', label: 'United States' },
{ code: 'UK', label: 'United Kingdom' },
{ code: 'DE', label: 'Germany' },
{ code: 'FR', label: 'France' },
{ code: 'JP', label: 'Japan' },
{ code: 'CA', label: 'Canada' },
{ code: 'IN', label: 'India' }, // NEW
];

export default function SidebarFilters({
  onAnalyze,
  onReset,
  isLoading = false,
  isCollapsed = false,
  onToggleCollapse,
  mobileOpen = false,
  isMobile = false,
}: SidebarFiltersProps) {
  const [asin, setAsin] = useState('');
  const [maxReviews, setMaxReviews] = useState(50);
  const [country, setCountry] = useState('US');
  const [enableAI, setEnableAI] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = asin.trim();

    // Try to extract ASIN from URL or validate as ASIN
    const extractedAsin = amazonUrlParser.extractAsin(input);

    if (extractedAsin) {
      onAnalyze(extractedAsin, maxReviews, enableAI, country);
      // Update input field with extracted ASIN
      setAsin(extractedAsin);
    }
  };

  const handleExampleClick = (exampleAsin: string) => {
    setAsin(exampleAsin);
    onAnalyze(exampleAsin, maxReviews, enableAI, country);
  };

  const handleMaxReviewsChange = (value: number[]) => {
    setMaxReviews(value[0]);
  };

  // Desktop collapsed state
  if (!isMobile && isCollapsed) {
    return (
      <aside className="h-full bg-background p-2 flex flex-col items-center gap-4 pt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="hover:bg-primary/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        <Separator className="w-full" />
        <Search className="h-5 w-5 text-muted-foreground" />
        <Filter className="h-5 w-5 text-muted-foreground" />
        <Globe className="h-5 w-5 text-muted-foreground" />
      </aside>
    );
  }

  return (
    <aside className={cn(
      "h-full bg-background overflow-y-auto",
      "p-4 sm:p-5 md:p-6 space-y-4 md:space-y-6"
    )}>
      {/* Mobile Header with Close Button */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Search & Filters</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Desktop Collapse Button */}
      {!isMobile && onToggleCollapse && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Filters</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="hover:bg-primary/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Search Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Label className="text-sm font-medium">Product Search</Label>
        </div>
        
        {/* ASIN Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter ASIN or Amazon URL"
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
              disabled={isLoading}
              className="font-mono text-xs h-10 md:h-9"
            />
            <p className="text-[10px] md:text-xs text-muted-foreground">
              ASIN (e.g., B0CHX3TYK1) or full Amazon product URL
            </p>
          </div>
          
          {/* AI Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium">AI Analysis</span>
            </div>
            <Switch
              checked={enableAI}
              onCheckedChange={setEnableAI}
              disabled={isLoading}
              aria-label="Toggle AI analysis"
            />
          </div>
          
          {/* Analyze Button */}
          <Button
            type="submit"
            className="w-full h-10 md:h-9 text-sm"
            disabled={isLoading || !asin.trim() || asin.trim().length < 10}
          >
            {isLoading ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                <span>Analyze Reviews</span>
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
          <Label className="text-sm font-medium">Quick Examples</Label>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {EXAMPLE_ASINS.map((example) => (
            <Button
              key={example.asin}
              variant="outline"
              size="sm"
              className="justify-start text-left h-auto py-2.5 px-3"
              onClick={() => handleExampleClick(example.asin)}
              disabled={isLoading}
            >
              <div className="flex flex-col items-start w-full gap-0.5">
                <span className="font-mono text-[10px] md:text-xs font-semibold">
                  {example.asin}
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground">
                  {example.label}
                </span>
              </div>
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
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
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
        <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">
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
        <Select value={country} onValueChange={setCountry} disabled={isLoading}>
          <SelectTrigger className="w-full h-10 md:h-9">
            <SelectValue placeholder="Select region" />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code} className="text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-lg">
                          {c.code === 'US' ? '🇺🇸'
                          : c.code === 'UK' ? '🇬🇧'
                          : c.code === 'DE' ? '🇩🇪'
                          : c.code === 'FR' ? '🇫🇷'
                          : c.code === 'JP' ? '🇯🇵'
                          : c.code === 'CA' ? '🇨🇦'
                          : c.code === 'IN' ? '🇮🇳'
                          : '🌍'}
                  </span>
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button - Mobile Optimized */}
      <div className="pt-4 border-t">
        <Button 
          variant="outline" 
          className="w-full h-10 md:h-9 text-sm"
          onClick={onReset}
          disabled={isLoading}
        >
          Reset All
        </Button>
      </div>
    </aside>
  );
}
