import { supabase } from '@/integrations/supabase/client';
import { getSessionId, generateTraceId } from './telemetry';

export interface LogFrontendEventParams {
  eventType: 'step_transition' | 'user_action' | 'error';
  step: string;
  payload?: Record<string, any>;
}

// In-memory store for recent events (for debug panel)
const recentEvents: Array<LogFrontendEventParams & { traceId: string; timestamp: number }> = [];
const MAX_RECENT_EVENTS = 10;

export async function logFrontendEvent(params: LogFrontendEventParams): Promise<string> {
  const traceId = generateTraceId();
  const sessionId = getSessionId();
  const timestamp = Date.now();

  // Store in memory for debug panel
  recentEvents.unshift({ ...params, traceId, timestamp });
  if (recentEvents.length > MAX_RECENT_EVENTS) {
    recentEvents.pop();
  }

  // Log to Supabase events table
  try {
    const { error } = await supabase.from('events').insert({
      session_id: sessionId,
      trace_id: traceId,
      step: params.step,
      action: params.eventType,
      ok: params.eventType !== 'error',
      payload_keys: params.payload ? Object.keys(params.payload) : [],
      error_message: params.eventType === 'error' ? params.payload?.message : null,
      error_code: params.eventType === 'error' ? params.payload?.errorCode : null,
    });

    if (error) {
      console.error('Failed to log frontend event:', error);
    }
  } catch (error) {
    console.error('Failed to log frontend event:', error);
  }

  return traceId;
}

export function getRecentEvents() {
  return [...recentEvents];
}
