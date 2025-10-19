/**
 * Sidebar filters component.
 */

'use client';

import React from 'react';
import { Upload, RotateCcw, Filter, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { amazonUrlParser } from '@/app/utils/amazon_url_parser';

interface SidebarFiltersProps {
  onAnalyze: (asin: string, country?: string, multiCountry?: boolean) => void;
  onReset: () => void;
  isLoading?: boolean;
  selectedCountry?: string;
  onCountryChange?: (country: string) => void;
  useMultiCountry?: boolean;
  onMultiCountryToggle?: (enabled: boolean) => void;
  availableCountries?: Array<{code: string; name: string; flag: string}>;
}

const DEFAULT_COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
];

export default function SidebarFilters({ 
  onAnalyze, 
  onReset, 
  isLoading,
  selectedCountry = 'IN',
  onCountryChange,
  useMultiCountry = true,
  onMultiCountryToggle,
  availableCountries = DEFAULT_COUNTRIES
}: SidebarFiltersProps) {
  const [input, setInput] = React.useState('');
  const [error, setError] = React.useState('');

  const validateInput = (value: string): boolean => {
    const asin = amazonUrlParser.extractAsin(value);
    if (!asin) {
      setError('Please enter a valid Amazon ASIN or product URL');
      return false;
    }
    setError('');
    return true;
  };

  const handleAnalyze = () => {
    const trimmedInput = input.trim();
    if (validateInput(trimmedInput)) {
      const asin = amazonUrlParser.extractAsin(trimmedInput);
      if (asin) {
        onAnalyze(asin, selectedCountry, useMultiCountry);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <aside className="w-64 border-r bg-gray-50 p-4 space-y-4 overflow-y-auto">
      {/* Input Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Product Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="asin" className="text-xs font-medium">
              Amazon ASIN or URL
            </Label>
            <Input
              id="asin"
              type="text"
              placeholder="B08N5WRWNW or https://amazon.in/dp/B08N5WRWNW"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              className="text-sm"
              disabled={isLoading}
            />
            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* Country Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-2">
              <Globe className="h-3 w-3" />
              Amazon Region
            </Label>
            <select
              value={selectedCountry}
              onChange={(e) => onCountryChange?.(e.target.value)}
              disabled={isLoading}
              className="w-full p-2 text-xs border rounded-md bg-white"
            >
              {availableCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* Multi-Country Search */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              Multi-Region Search
            </Label>
            <Switch
              checked={useMultiCountry}
              onCheckedChange={onMultiCountryToggle}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-500">
            {useMultiCountry 
              ? 'Will search multiple regions if needed' 
              : 'Search only selected region'
            }
          </p>

          <Button
            onClick={handleAnalyze}
            disabled={isLoading || !input}
            className="w-full"
            size="sm"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Analyze Reviews
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium">Sentiment</Label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="text-xs h-7">
                Positive
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                Neutral
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7">
                Negative
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Rating</Label>
            <div className="grid grid-cols-2 gap-2">
              {[5, 4, 3, 2, 1].map((star) => (
                <Button
                  key={star}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                >
                  {star} ⭐
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onReset}
          disabled={isLoading}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Filters
        </Button>
      </div>

      {/* Info Card */}
      <Card className="shadow-sm bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <p className="text-xs text-blue-900">
            <strong>Tip:</strong> Enter Amazon ASIN (10 characters starting with 'B') or full product URL to analyze reviews.
          </p>
        </CardContent>
      </Card>
    </aside>
  );
}