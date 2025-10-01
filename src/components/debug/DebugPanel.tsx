import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getSessionId } from '@/lib/telemetry';
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
  
  // Only show in development
  if (import.meta.env.MODE === 'production') {
    return null;
  }
  
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
        <Card className="p-4 w-80 max-h-96 overflow-auto shadow-xl">
          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="font-bold text-muted-foreground">Session ID</div>
              <div className="break-all">{getSessionId()}</div>
            </div>
            
            {info.step && (
              <div>
                <div className="font-bold text-muted-foreground">Current Step</div>
                <div>{info.step}</div>
              </div>
            )}
            
            {info.lastTraceId && (
              <div>
                <div className="font-bold text-muted-foreground">Last Trace ID</div>
                <div className="break-all">{info.lastTraceId}</div>
              </div>
            )}
            
            {info.lastPayloadKeys && (
              <div>
                <div className="font-bold text-muted-foreground">Last Payload Keys</div>
                <div>{info.lastPayloadKeys.join(', ')}</div>
              </div>
            )}
            
            {info.lastDurationMs !== undefined && (
              <div>
                <div className="font-bold text-muted-foreground">Last Duration</div>
                <div>{info.lastDurationMs}ms</div>
              </div>
            )}
            
            {info.lastOk !== undefined && (
              <div>
                <div className="font-bold text-muted-foreground">Last Result</div>
                <div className={info.lastOk ? 'text-green-600' : 'text-red-600'}>
                  {info.lastOk ? '✓ Success' : '✗ Failed'}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
