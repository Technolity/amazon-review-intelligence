'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
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
  onAnalyze: (asin: string) => void;  // ✅ FIXED: Only takes ASIN
  onReset: () => void;
  isLoading?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
}: SidebarFiltersProps) {
  const [asin, setAsin] = useState('');
  const [maxReviews, setMaxReviews] = useState(50);
  const [enableAI, setEnableAI] = useState(true);
  const [country, setCountry] = useState('IN');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (asin.length === 10) {
      onAnalyze(asin.toUpperCase());  // ✅ Only pass ASIN
    }
  };

  const handleExampleClick = (exampleAsin: string) => {
    setAsin(exampleAsin);
    onAnalyze(exampleAsin);  // ✅ Only pass ASIN
  };

  // Collapsed view - Hide on mobile
  if (collapsed) {
    return (
      <aside className="hidden lg:flex w-16 border-r bg-background flex-col items-center py-4 gap-4 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-2 hover:bg-primary/10"
          title="Expand sidebar"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col gap-3 items-center">
          <div className="p-2 rounded-lg bg-primary/10" title="Search">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div className="p-2 rounded-lg hover:bg-muted transition-colors" title="Filters">
            <Filter className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="p-2 rounded-lg hover:bg-muted transition-colors" title="Trends">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="p-2 rounded-lg hover:bg-muted transition-colors" title="Ratings">
            <Star className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="p-2 rounded-lg hover:bg-muted transition-colors" title="Region">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          className="mt-auto hover:bg-destructive/10"
          title="Reset"
          disabled={isLoading}
        >
          <RotateCcw className="h-5 w-5 text-muted-foreground" />
        </Button>
      </aside>
    );
  }

  // Expanded view - Responsive
  return (
    <aside className={cn(
      "w-full lg:w-80 border-r bg-background flex flex-col h-full transition-all duration-300",
      "lg:max-w-[320px]"
    )}>
      {/* Header - Responsive */}
      <div className="p-3 md:p-4 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 md:h-5 md:w-5 text-primary" />
          <h2 className="text-sm md:text-base font-semibold">Filters</h2>
        </div>
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
      </div>

      {/* Scrollable Content - Responsive */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4 md:space-y-6">
        
        {/* ASIN Input */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            <Label className="text-xs md:text-sm">Amazon ASIN</Label>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <Input
              placeholder="B08N5WRWNW"
              value={asin}
              onChange={(e) => setAsin(e.target.value.toUpperCase())}
              maxLength={10}
              className="font-mono text-sm h-9 md:h-10"
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="w-full h-9 md:h-10 text-sm"
              disabled={isLoading || asin.length !== 10}
            >
              {isLoading ? (
                <>
                  <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-2 animate-spin" />
                  <span className="text-xs md:text-sm">Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  <span className="text-xs md:text-sm">Analyze Reviews</span>
                </>
              )}
            </Button>
          </form>
        </div>

        <Separator />

        {/* Example ASINs */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            <Label className="text-xs md:text-sm">Try Examples</Label>
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

        {/* Review Count */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
              <Label className="text-xs md:text-sm">Reviews</Label>
            </div>
            <Badge variant="secondary" className="text-[10px] md:text-xs">
              {maxReviews}
            </Badge>
          </div>
          <Slider
            value={[maxReviews]}
            onValueChange={(value) => setMaxReviews(value[0])}
            min={10}
            max={100}
            step={10}
            className="w-full"
            disabled={isLoading}
          />
          <p className="text-[10px] md:text-xs text-muted-foreground">
            More reviews = Better insights
          </p>
        </div>

        <Separator />

        {/* AI Features */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            <Label className="text-xs md:text-sm">AI Analysis</Label>
          </div>
          <div className="flex items-center justify-between p-2 md:p-3 rounded-lg border bg-muted/30">
            <div className="flex-1">
              <p className="text-xs md:text-sm font-medium">Enable AI/NLP</p>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                Free VADER & TextBlob
              </p>
            </div>
            <Switch
              checked={enableAI}
              onCheckedChange={setEnableAI}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator />

        {/* Region Selection */}
        <div className="space-y-2 md:space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            <Label className="text-xs md:text-sm">Region</Label>
          </div>
          <Select value={country} onValueChange={setCountry} disabled={isLoading}>
            <SelectTrigger className="h-9 md:h-10 text-xs md:text-sm">
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
        </div>

        <Separator />

        {/* Quick Stats */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-2 md:p-3 border">
          <h3 className="text-xs md:text-sm font-medium flex items-center gap-2">
            <Star className="h-3 w-3 md:h-4 md:w-4 text-primary" />
            Session Info
          </h3>
          <div className="grid grid-cols-2 gap-2 text-[10px] md:text-xs">
            <div>
              <p className="text-muted-foreground">Data Source</p>
              <p className="font-medium">Mock Data</p>
            </div>
            <div>
              <p className="text-muted-foreground">AI Model</p>
              <p className="font-medium">Free NLP</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions - Responsive */}
      <div className="p-3 md:p-4 border-t bg-muted/30 space-y-2">
        <Button
          variant="outline"
          className="w-full h-9 md:h-10 text-xs md:text-sm"
          onClick={onReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-3 w-3 md:h-4 md:w-4 mr-2" />
          Reset Filters
        </Button>
        <p className="text-[10px] md:text-xs text-center text-muted-foreground">
          v1.0.0 • Mock Data • Free AI
        </p>
      </div>
    </aside>
  );
}