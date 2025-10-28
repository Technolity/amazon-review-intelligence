'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  Star, 
  Globe, 
  RotateCcw, 
  Sparkles,
  Package,
  Brain,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SidebarFiltersProps {
  onAnalyze: (asin: string, maxReviews: number, enableAI: boolean, country: string) => void;
  onReset: () => void;
  isLoading?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

// Example ASINs for quick testing
const EXAMPLE_ASINS = [
  { asin: 'B08N5WRWNW', label: '📱 Echo Dot (4th Gen)' },
  { asin: 'B07ZPKN6YR', label: '🎮 Ring Video Doorbell' },
  { asin: 'B0CX59LNB5', label: '💻 Laptop Stand' },
];

export default function SidebarFilters({
  onAnalyze,
  onReset,
  isLoading = false,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarFiltersProps) {
  const [asin, setAsin] = useState('');
  const [maxReviews, setMaxReviews] = useState(50);
  const [country, setCountry] = useState('US');
  const [enableAI, setEnableAI] = useState(true); // ✅ NEW: AI Toggle State

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (asin.trim()) {
      onAnalyze(asin.trim(), maxReviews, enableAI, country);
    }
  };

  // Handle example ASIN clicks
  const handleExampleClick = (exampleAsin: string) => {
    setAsin(exampleAsin);
    onAnalyze(exampleAsin, maxReviews, enableAI, country);
  };

  // Handle max reviews change with auto-trigger
  const handleMaxReviewsChange = (value: number[]) => {
    const newValue = value[0];
    setMaxReviews(newValue);
    if (asin.trim()) {
      onAnalyze(asin, newValue, enableAI, country);
    }
  };

  // Handle country change with auto-trigger
  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    if (asin.trim()) {
      onAnalyze(asin, maxReviews, enableAI, newCountry);
    }
  };

  // Handle AI toggle with auto-trigger
  const handleAIToggle = (checked: boolean) => {
    setEnableAI(checked);
    if (asin.trim()) {
      onAnalyze(asin, maxReviews, checked, country);
    }
  };

  // Collapsed Icon-Only View (shown when sidebar is collapsed)
  if (isCollapsed) {
    return (
      <aside className="w-16 h-full border-r bg-background/95 backdrop-blur flex flex-col items-center py-4 gap-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Search className="h-5 w-5 text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Search - Click to expand</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Filter className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Filters - Click to expand</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  enableAI 
                    ? "bg-primary/10 hover:bg-primary/20 text-primary" 
                    : "hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <Brain className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>{enableAI ? 'AI Enabled' : 'AI Disabled'} - Click to expand</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                className="mt-auto hover:bg-destructive/10"
                disabled={isLoading}
              >
                <RotateCcw className="h-5 w-5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Reset Filters</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </aside>
    );
  }

  // Full Expanded View
  return (
    <aside className="w-80 h-full border-r bg-background/95 backdrop-blur flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-base">Filters & Settings</h2>
          </div>
          <Badge variant="secondary" className="text-xs">
            {enableAI ? '🧠 AI Mode' : '📋 Raw Mode'}
          </Badge>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 🆕 AI/NLP TOGGLE SECTION */}
        <div className="space-y-3 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-4 border-2 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className={cn(
                "h-5 w-5 transition-colors",
                enableAI ? "text-primary animate-pulse" : "text-muted-foreground"
              )} />
              <div>
                <Label className="text-sm font-semibold">Enable AI/NLP Analysis</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {enableAI ? 'Get AI-powered insights' : 'View raw reviews only'}
                </p>
              </div>
            </div>
            <Switch
              checked={enableAI}
              onCheckedChange={handleAIToggle}
              disabled={isLoading}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* AI Features Badge */}
          {enableAI && (
            <div className="flex flex-wrap gap-1.5 mt-2 animate-in fade-in duration-300">
              <Badge variant="secondary" className="text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Sentiment
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <Zap className="h-3 w-3" />
                Keywords
              </Badge>
              <Badge variant="secondary" className="text-xs gap-1">
                <TrendingUp className="h-3 w-3" />
                Trends
              </Badge>
            </div>
          )}
        </div>

        <Separator />

        {/* ASIN Search */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Amazon ASIN</Label>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              placeholder="Enter ASIN (e.g., B08N5WRWNW)"
              value={asin}
              onChange={(e) => setAsin(e.target.value)}
              disabled={isLoading}
              className="h-10 text-sm font-mono"
            />
            <Button
              type="submit"
              className="w-full h-10"
              disabled={isLoading || !asin.trim()}
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  <span className="text-sm">Analyze Reviews</span>
                </>
              )}
            </Button>
          </form>
        </div>

        <Separator />

        {/* Example ASINs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Try Examples</Label>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {EXAMPLE_ASINS.map((example) => (
              <Button
                key={example.asin}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2"
                onClick={() => handleExampleClick(example.asin)}
                disabled={isLoading}
              >
                <div className="flex flex-col items-start w-full">
                  <span className="font-mono text-xs font-semibold">
                    {example.asin}
                  </span>
                  <span className="text-xs text-muted-foreground">
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
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Max Reviews</Label>
            </div>
            <Badge variant="secondary" className="text-xs">
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
            More reviews = Better insights (Updates automatically)
          </p>
        </div>

        <Separator />

        {/* Region Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm">Region</Label>
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
            Changes update analysis automatically
          </p>
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-3 border">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            Current Settings
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Analysis Mode</p>
              <p className="font-medium">{enableAI ? '🧠 AI Powered' : '📋 Raw Data'}</p>
            </div>
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
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium flex items-center gap-1">
                <span className={cn(
                  "inline-block w-2 h-2 rounded-full",
                  isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                )} />
                {isLoading ? 'Loading' : 'Ready'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t bg-muted/30 space-y-2">
        <Button
          variant="outline"
          className="w-full h-10 text-sm"
          onClick={onReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All Filters
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          v1.0.0 • {enableAI ? 'AI Mode Active' : 'Raw Mode Active'} • Real-time Updates
        </p>
      </div>
    </aside>
  );
}
