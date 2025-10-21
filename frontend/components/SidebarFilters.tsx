'use client';

import React, { useState } from 'react';
import { Upload, RotateCcw, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { amazonUrlParser } from '@/app/utils/amazon_url_parser';
import { cn } from '@/lib/utils';

interface SidebarFiltersProps {
  onAnalyze: (input: string, country: string) => void;
  onReset: () => void;
  isLoading?: boolean;
}

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

export default function SidebarFilters({ onAnalyze, onReset, isLoading }: SidebarFiltersProps) {
  const [input, setInput] = useState('');
  const [country, setCountry] = useState('US');
  const [error, setError] = useState('');

  const handleAnalyze = () => {
    const trimmedInput = input.trim();
    
    // Validate input
    if (!trimmedInput) {
      setError('Please enter an ASIN or URL');
      return;
    }
    
    // Check if it's a URL or ASIN
    const asin = amazonUrlParser.extractAsin(trimmedInput);
    if (!asin) {
      setError('Invalid ASIN or URL format');
      return;
    }
    
    setError('');
    onAnalyze(trimmedInput, country);
  };

  return (
    <aside className={cn(
      "w-full lg:w-64 border-r bg-card p-4 space-y-4",
      "lg:h-full overflow-y-auto",
      "lg:block"
    )}>
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pt-0 pb-3">
          <CardTitle className="text-sm font-medium">Product Analysis</CardTitle>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          {/* Country Selection */}
          <div className="space-y-2">
            <Label htmlFor="country" className="text-xs">
              <Globe className="inline h-3 w-3 mr-1" />
              Region
            </Label>
            <Select value={country} onValueChange={setCountry} disabled={isLoading}>
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input */}
          <div className="space-y-2">
            <Label htmlFor="input" className="text-xs">
              ASIN or Product URL
            </Label>
            <Input
              id="input"
              type="text"
              placeholder="B08N5WRWNW"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
              className={cn(
                "h-9 text-sm font-mono",
                error && "border-destructive"
              )}
              disabled={isLoading}
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !input}
            className="w-full h-9"
            size="sm"
          >
            {isLoading ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-3 w-3 mr-2" />
                Analyze
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="w-full h-9"
            onClick={onReset}
            disabled={isLoading}
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}