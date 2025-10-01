import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getSessionId } from '@/lib/telemetry';
import { getRecentEvents } from '@/lib/frontendEventLogger';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface DebugInfo {
  step?: string;
  lastTraceId?: string;
  lastPayloadKeys?: string[];
  lastDurationMs?: number;
  lastOk?: boolean;
}

interface DebugPanelProps {
  info: DebugInfo;
}

export function DebugPanel({ info }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  
  // Only show in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }
  
  // Refresh events when panel opens
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        setEvents(getRecentEvents());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="mb-2 shadow-lg"
      >
        Debug {isOpen ? <ChevronDown className="ml-2 h-4 w-4" /> : <ChevronUp className="ml-2 h-4 w-4" />}
      </Button>
      
      {isOpen && (
        <Card className="p-4 w-96 max-h-96 overflow-auto shadow-xl">
          <div className="space-y-4 text-xs font-mono">
            <div>
              <div className="font-bold text-muted-foreground mb-1">Session ID</div>
              <div className="break-all text-[10px]">{getSessionId()}</div>
            </div>
            
            {info.step && (
              <div>
                <div className="font-bold text-muted-foreground mb-1">Current Step</div>
                <div>{info.step}</div>
              </div>
            )}
            
            {info.lastTraceId && (
              <div>
                <div className="font-bold text-muted-foreground mb-1">Last Trace ID</div>
                <div className="break-all text-[10px]">{info.lastTraceId}</div>
              </div>
            )}
            
            {info.lastDurationMs !== undefined && (
              <div>
                <div className="font-bold text-muted-foreground mb-1">Last Duration</div>
                <div>{info.lastDurationMs}ms</div>
              </div>
            )}
            
            {info.lastOk !== undefined && (
              <div>
                <div className="font-bold text-muted-foreground mb-1">Last Result</div>
                <div className={info.lastOk ? 'text-green-600' : 'text-red-600'}>
                  {info.lastOk ? '✓ Success' : '✗ Failed'}
                </div>
              </div>
            )}
            
            <div>
              <div className="font-bold text-muted-foreground mb-2">Recent Events (Last 5)</div>
              <div className="space-y-2">
                {events.slice(0, 5).map((event, index) => (
                  <div key={index} className="p-2 bg-muted/50 rounded text-[10px]">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold">{event.eventType}</span>
                      <span className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div>Step: {event.step}</div>
                    {event.payload && (
                      <div className="mt-1 text-muted-foreground">
                        {JSON.stringify(event.payload, null, 2).substring(0, 100)}
                        {JSON.stringify(event.payload).length > 100 && '...'}
                      </div>
                    )}
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-muted-foreground italic">No events yet</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
