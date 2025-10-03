import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, RefreshCw } from 'lucide-react';

interface ShopfrontAboutPreviewProps {
  aiBio?: string;
  fallbackMotivation?: string;
  fallbackExpertise?: string;
  vibes?: string[];
  audiences?: string[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onFeedback?: (feedback: 'up' | 'down') => void;
  feedback?: 'up' | 'down' | null;
}

export const ShopfrontAboutPreview = ({ 
  aiBio, 
  fallbackMotivation, 
  fallbackExpertise,
  vibes = [],
  audiences = [],
  isLoading = false,
  onRefresh,
  onFeedback,
  feedback 
}: ShopfrontAboutPreviewProps) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="mb-4 md:mb-6">
        <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase mb-2">About</h4>
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/5" />
        </div>
        <p className="text-xs text-muted-foreground italic">
          ✨ Generating your bio...
        </p>
      </div>
    );
  }

  // Build bio text
  let bioText = '';
  
  if (aiBio && aiBio.trim()) {
    // Use AI-generated bio if available
    bioText = aiBio;
  } else {
    // Create polished fallback from user inputs
    const parts: string[] = [];
    
    if (fallbackMotivation && fallbackMotivation.trim()) {
      const motivation = fallbackMotivation.trim();
      parts.push(motivation.charAt(0).toUpperCase() + motivation.slice(1));
    }
    
    if (fallbackExpertise && fallbackExpertise.trim()) {
      const expertise = fallbackExpertise.trim();
      const formattedExpertise = expertise.charAt(0).toUpperCase() + expertise.slice(1);
      
      // Add "I've" prefix if it doesn't already start with it
      if (formattedExpertise.toLowerCase().startsWith('i')) {
        parts.push(formattedExpertise);
      } else {
        parts.push(`I've ${formattedExpertise}`);
      }
    }
    
    bioText = parts.join('. ');
    
    // Ensure it ends with a period
    if (bioText && !bioText.endsWith('.')) {
      bioText += '.';
    }
  }

  // Don't render if no content
  if (!bioText.trim()) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs md:text-sm font-semibold text-muted-foreground uppercase">About</h4>
        {aiBio && onRefresh && (
          <div className="flex items-center gap-2">
            {onFeedback && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback('up')}
                  className={`h-7 w-7 p-0 ${feedback === 'up' ? 'bg-green-500/10 text-green-600' : ''}`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onFeedback('down')}
                  className={`h-7 w-7 p-0 ${feedback === 'down' ? 'bg-red-500/10 text-red-600' : ''}`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              className="h-7 px-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        )}
      </div>
      
      <p className="text-sm md:text-base leading-relaxed mb-3">{bioText}</p>
      
      {/* Show vibes & audiences as tags if available */}
      {(vibes.length > 0 || audiences.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {vibes.map(vibe => (
            <Badge key={vibe} variant="secondary" className="text-[10px] md:text-xs">
              {vibe}
            </Badge>
          ))}
          {audiences.map(audience => (
            <Badge key={audience} variant="outline" className="text-[10px] md:text-xs">
              {audience}
            </Badge>
          ))}
        </div>
      )}
      
      <p className="text-xs text-muted-foreground italic mt-3">
        {aiBio 
          ? "✨ This AI-generated bio will appear in your shopfront."
          : "This is how your About section will appear in your shopfront."}
      </p>
    </div>
  );
};
