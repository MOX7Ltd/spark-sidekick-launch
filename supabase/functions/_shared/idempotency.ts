import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface IdempotencyResult {
  cached: boolean;
  response: any;
}

export function parseFeatureFlags(headers: Headers): string[] {
  const flagsHeader = headers.get('x-feature-flags') || '';
  return flagsHeader.split(',').filter(f => f.trim().length > 0);
}

export async function hashRequest(body: any): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(body));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkIdempotency(
  sessionId: string,
  idempotencyKey: string,
  fnName: string
): Promise<any | null> {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('idempotent_responses')
    .select('response')
    .eq('session_id', sessionId)
    .eq('idempotency_key', idempotencyKey)
    .eq('fn', fnName)
    .gte('created_at', fifteenMinutesAgo)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking idempotency:', error);
    return null;
  }
  
  return data?.response || null;
}

export async function storeIdempotentResponse(
  sessionId: string,
  idempotencyKey: string,
  fnName: string,
  requestHash: string,
  response: any
): Promise<void> {
  const { error } = await supabase
    .from('idempotent_responses')
    .insert({
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      fn: fnName,
      request_hash: requestHash,
      response: response
    });
  
  if (error) {
    console.error('Error storing idempotent response:', error);
  }
}
