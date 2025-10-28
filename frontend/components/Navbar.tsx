'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Moon, 
  Sun, 
  Menu, 
  X, 
  BarChart3, 
  ChevronRight, 
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        
        {/* ✅ NEW: Hamburger Menu for Sidebar Toggle */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className={cn(
              "mr-3 transition-all duration-300 hover:bg-primary/10",
              sidebarCollapsed && "hover:bg-green-500/10"
            )}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <PanelLeftClose className="h-5 w-5 text-primary" />
            )}
          </Button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="relative">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm md:text-base bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Review Intelligence
            </span>
            <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">
              AI-Powered Analytics Dashboard
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 hover:bg-primary/10 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem 
                onClick={() => onExport?.('csv')}
                className="cursor-pointer"
              >
                <span className="mr-2">📊</span> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onExport?.('pdf')}
                className="cursor-pointer"
              >
                <span className="mr-2">📄</span> Export as PDF
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                More formats coming soon
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
              className="hover:bg-primary/10 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-yellow-500" />
              ) : (
                <Moon className="h-4 w-4 text-blue-600" />
              )}
            </Button>
          )}

          {/* Sidebar Status Indicator */}
          {onToggleSidebar && (
            <div className="flex items-center gap-2 ml-2 px-3 py-1.5 rounded-md bg-muted/50 border">
              <span className={cn(
                "inline-block w-2 h-2 rounded-full transition-colors",
                sidebarCollapsed ? "bg-orange-500" : "bg-green-500"
              )} />
              <span className="text-xs text-muted-foreground font-medium">
                {sidebarCollapsed ? 'Collapsed' : 'Expanded'}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              
              {/* Mobile Sidebar Toggle */}
              {onToggleSidebar && (
                <>
                  <DropdownMenuItem 
                    onClick={onToggleSidebar}
                    className="cursor-pointer"
                  >
                    {sidebarCollapsed ? (
                      <><PanelLeftOpen className="mr-2 h-4 w-4" /> Expand Sidebar</>
                    ) : (
                      <><PanelLeftClose className="mr-2 h-4 w-4" /> Collapse Sidebar</>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {/* Export Options */}
              <DropdownMenuItem 
                onClick={() => {
                  onExport?.('csv');
                  setMobileMenuOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="mr-2">📊</span> Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  onExport?.('pdf');
                  setMobileMenuOpen(false);
                }}
                className="cursor-pointer"
              >
                <span className="mr-2">📄</span> Export PDF
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {/* Theme Toggle */}
              {mounted && (
                <DropdownMenuItem 
                  onClick={() => {
                    toggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="cursor-pointer"
                >
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
      </div>
    </nav>
  );
}
