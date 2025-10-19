/**
 * Error display component with retry option.
 */

'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  suggestion?: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ 
  title = 'Error Occurred',
  message, 
  suggestion,
  onRetry 
}: ErrorDisplayProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-red-600">{message}</p>
        
        {suggestion && (
          <p className="text-sm text-gray-600 italic">
            💡 {suggestion}
          </p>
        )}
        
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}