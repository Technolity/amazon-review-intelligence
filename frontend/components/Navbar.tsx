'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, Moon, Sun, Menu, X, BarChart3, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
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
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export default function Navbar({
  onExport,
  onToggleSidebar,
  sidebarCollapsed,
  onMobileMenuToggle,
  mobileMenuOpen = false
}: NavbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Fix hydration error by only rendering theme content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 md:h-16 items-center px-3 sm:px-4 md:px-6 gap-2 md:gap-4">
        
        {/* Mobile Hamburger Menu - Visible only on mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMobileMenuToggle}
          className="md:hidden flex-shrink-0 h-9 w-9"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>

        {/* Desktop Sidebar Toggle - Visible only on desktop */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="hidden md:flex flex-shrink-0 h-9 w-9"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink">
          <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-xs sm:text-sm md:text-base truncate">
              Review Intelligence
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">
              AI-Powered Analytics
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0" />

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Download className="h-4 w-4" />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                <span className="mr-2">📊</span> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                <span className="mr-2">📄</span> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <span className="mr-2">📧</span> Email Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>

        {/* Mobile Actions - Condensed */}
        <div className="flex md:hidden items-center gap-1">
          {/* Theme Toggle - Always visible on mobile */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 flex-shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Mobile Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onExport?.('csv')} className="text-sm">
                <span className="mr-2">📊</span> CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')} className="text-sm">
                <span className="mr-2">📄</span> PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}