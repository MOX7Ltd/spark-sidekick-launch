import { Cloud, CloudOff, Loader2 } from 'lucide-react';

interface SyncIndicatorProps {
  isSyncing: boolean;
  lastSyncTime?: Date;
}

export function SyncIndicator({ isSyncing, lastSyncTime }: SyncIndicatorProps) {
  if (isSyncing) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSyncTime) {
    const timeSince = Date.now() - lastSyncTime.getTime();
    const secondsAgo = Math.floor(timeSince / 1000);
    
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Cloud className="w-3 h-3" />
        <span>Saved {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <CloudOff className="w-3 h-3" />
      <span>Not synced</span>
    </div>
  );
}
