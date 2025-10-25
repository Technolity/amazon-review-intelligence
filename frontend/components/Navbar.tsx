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
}

export default function Navbar({
  onExport,
  onToggleSidebar,
  sidebarCollapsed
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
      <div className="container flex h-14 items-center px-4">
        {/* Sidebar Toggle */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="mr-2 hidden md:flex"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm md:text-base">Review Intelligence</span>
            <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
              AI-Powered Analytics
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onExport?.('csv')}>
                <span className="mr-2">📊</span> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport?.('pdf')}>
                <span className="mr-2">📄</span> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onExport?.('csv')}>
              <span className="mr-2">📊</span> Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport?.('pdf')}>
              <span className="mr-2">📄</span> Export PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {mounted && (
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'dark' ? (
                  <><span className="mr-2">☀️</span> Light Mode</>
                ) : (
                  <><span className="mr-2">🌙</span> Dark Mode</>
                )}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}