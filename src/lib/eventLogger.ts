import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './telemetry';

export interface LogEventParams {
  traceId: string;
  step: string;
  action: string;
  ok: boolean;
  durationMs?: number;
  provider?: string;
  payloadKeys?: string[];
  errorCode?: string;
  errorMessage?: string;
  featureFlags?: string[];
}

export async function logEvent(params: LogEventParams): Promise<void> {
  try {
    const { error } = await supabase.from('events').insert({
      session_id: getSessionId(),
      trace_id: params.traceId,
      step: params.step,
      action: params.action,
      ok: params.ok,
      duration_ms: params.durationMs,
      provider: params.provider,
      payload_keys: params.payloadKeys,
      error_code: params.errorCode,
      error_message: params.errorMessage ? params.errorMessage.substring(0, 500) : null,
    });

    if (error) {
      console.error('Failed to log event:', error);
    }
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}
