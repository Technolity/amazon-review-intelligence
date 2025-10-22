'use client';

import React, { useState } from 'react';
import { Search, Download, Moon, Sun, Menu, X, BarChart3 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onExport?: (format: 'csv' | 'pdf') => void;
  onSearch?: (query: string) => void;
  onToggleSidebar?: () => void;  // ✅ Added this prop
  sidebarCollapsed?: boolean;    // ✅ Added this prop
}

export default function Navbar({ 
  onExport, 
  onSearch, 
  onToggleSidebar,
  sidebarCollapsed 
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, setTheme } = useTheme();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim().length >= 10) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 md:h-16 items-center px-3 md:px-6 gap-2 md:gap-4">
        
        {/* Sidebar Toggle Button - Hidden on mobile */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden lg:flex shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Logo & Brand */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <div className="h-8 w-8 md:h-9 md:w-9 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm md:text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
              Review Intelligence
            </h1>
            <p className="text-[10px] md:text-xs text-muted-foreground hidden md:block">
              AI-Powered Analytics
            </p>
          </div>
        </div>

        {/* Search Bar - Responsive */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter Amazon ASIN (e.g., B08N5WRWNW)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 md:h-10 bg-muted/50 text-sm"
            />
          </div>
        </form>

        {/* Actions - Responsive */}
        <div className="flex items-center gap-1 md:gap-2 ml-auto shrink-0">
          
          {/* Export Dropdown - Hidden on small screens */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex h-9">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                📊 Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                📄 Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="relative h-9 w-9 shrink-0"
          >
            <Sun className="h-4 w-4 md:h-5 md:w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 md:h-5 md:w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Mobile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                📊 Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                📄 Export PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? '☀️' : '🌙'} {theme === 'dark' ? 'Light' : 'Dark'} Mode
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-3 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter ASIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-muted/50 text-sm"
            />
          </div>
        </form>
      </div>
    </nav>
  );
}