import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { ProductIdea } from '@/lib/api';

export type SlotStatus = 'new' | 'kept' | 'rejected' | 'refreshed';

export interface IdeaSlot {
  id: string;
  idea?: ProductIdea;
  status: SlotStatus;
  hasRefreshed: boolean;
  originalIdea?: ProductIdea;
  hasUndone?: boolean;
}

interface ProductIdeaSlotProps {
  slot: IdeaSlot;
  onThumbUp: (slotId: string) => void;
  onThumbDown: (slotId: string) => void;
  onUndoSwap?: (slotId: string) => void;
  isRegenerating?: boolean;
  fadingOut?: boolean;
}

export function ProductIdeaSlot({ 
  slot, 
  onThumbUp, 
  onThumbDown,
  onUndoSwap,
  isRegenerating = false,
  fadingOut = false,
}: ProductIdeaSlotProps) {
  const { id, idea, status, hasRefreshed, hasUndone } = slot;
  
  if (!idea) {
    return (
      <Card className="border-2 border-dashed border-muted animate-pulse">
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="h-5 w-3/4 bg-muted rounded" />
          <div className="h-4 w-1/4 bg-muted rounded" />
          <div className="h-16 w-full bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const isKept = status === 'kept';
  const isRejected = status === 'rejected';
  
  return (
    <Card 
      className={`border-2 transition-all duration-300 hover:shadow-lg ${
        isKept 
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
          : isRejected
          ? 'border-muted bg-muted/30 opacity-60'
          : 'border-primary/20 hover:border-primary/40'
      } ${fadingOut ? 'animate-fade-out' : 'animate-fade-in-up'}`}
    >
      <CardContent className="p-4 sm:p-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-base sm:text-lg break-words">{idea.title}</h4>
            <Badge variant="secondary" className="mt-1 text-xs">
              {idea.format || 'Product'}
            </Badge>
          </div>
          {isKept && (
            <CheckCircle className="w-5 h-5 text-primary shrink-0" />
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-3 break-words">
          {idea.description}
        </p>
        
        {!isRejected ? (
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant={isKept ? "default" : "outline"}
              size="sm"
              onClick={() => onThumbUp(id)}
              className="flex-1"
              title="Keep this idea"
            >
              <ThumbsUp className="w-4 h-4 mr-1" />
              {isKept ? 'Kept' : 'Keep'}
            </Button>
            {hasRefreshed && onUndoSwap && !hasUndone ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onUndoSwap(id)}
                className="flex-1"
                title="Bring back the original"
              >
                Undo
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onThumbDown(id)}
              disabled={isRegenerating}
              className="flex-1"
              title={hasUndone ? "Reject this idea" : (hasRefreshed ? "Reject this idea" : "Try a different one")}
            >
              <ThumbsDown className="w-4 h-4 mr-1" />
              {hasUndone || hasRefreshed ? 'Reject' : 'Swap'}
            </Button>
          </div>
        ) : (
          <div className="pt-2">
            <p className="text-xs text-center text-muted-foreground py-2">
              Rejected. You'll see fewer like this later.
            </p>
          </div>
        )}
        
        {isRegenerating && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
            <div className="animate-pulse text-sm font-medium">Generating...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
