/**
 * Top navigation bar component.
 */

'use client';

import React from 'react';
import { Search, Download, Settings, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { amazonUrlParser } from '@/app/utils/amazon_url_parser';

interface NavbarProps {
  onExport?: (format: 'csv' | 'pdf') => void;
  onSearch?: (query: string) => void;
  currentCountry?: string | null;
  isMultiCountry?: boolean;
  onMultiCountryToggle?: (enabled: boolean) => void;
}

export default function Navbar({ 
  onExport, 
  onSearch, 
  currentCountry,
  isMultiCountry = true,
  onMultiCountryToggle 
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      const asin = amazonUrlParser.extractAsin(searchQuery.trim());
      if (asin) {
        onSearch(asin);
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
            <span className="text-sm font-bold text-white">AI</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Review Intelligence</h1>
            <p className="text-xs text-gray-500">Scalez Media Dashboard</p>
          </div>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by ASIN or Amazon URL..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </form>

        {/* Region Info */}
        {currentCountry && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="h-4 w-4" />
            <span>{currentCountry}</span>
          </div>
        )}

        {/* Multi-Country Toggle */}
        {onMultiCountryToggle && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Multi-Region</span>
            <Switch
              checked={isMultiCountry}
              onCheckedChange={onMultiCountryToggle}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Help</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}