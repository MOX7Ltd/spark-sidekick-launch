import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

interface AIUsageLog {
  sessionId?: string;
  userId?: string;
  businessId?: string;
  functionName: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  durationMs?: number;
  requestType?: string;
  metadata?: any;
}

// Lovable AI pricing per 1M tokens
// Source: https://docs.lovable.dev/features/ai
const PRICING_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  'google/gemini-2.5-pro': { input: 1.25, output: 5.00 },
  'google/gemini-2.5-flash': { input: 0.075, output: 0.30 },
  'google/gemini-2.5-flash-lite': { input: 0.0375, output: 0.15 },
  'google/gemini-2.5-flash-image-preview': { input: 0.075, output: 0.30 },
  'openai/gpt-5': { input: 2.50, output: 10.00 },
  'openai/gpt-5-mini': { input: 0.15, output: 0.60 },
  'openai/gpt-5-nano': { input: 0.10, output: 0.40 },
};

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const pricing = PRICING_PER_1M_TOKENS[model] || PRICING_PER_1M_TOKENS['google/gemini-2.5-flash'];
  const inputCost = (tokensIn / 1_000_000) * pricing.input;
  const outputCost = (tokensOut / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export async function logAIUsage(
  supabaseUrl: string,
  supabaseKey: string,
  usage: AIUsageLog
): Promise<void> {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { error } = await supabase
      .from('ai_cost_tracking')
      .insert({
        session_id: usage.sessionId || null,
        user_id: usage.userId || null,
        business_id: usage.businessId || null,
        function_name: usage.functionName,
        model: usage.model,
        tokens_in: usage.tokensIn,
        tokens_out: usage.tokensOut,
        cost_usd: usage.costUsd,
        duration_ms: usage.durationMs || null,
        request_type: usage.requestType || null,
        metadata: usage.metadata || {},
      });

    if (error) {
      console.error('[ai-tracking] Failed to log usage:', error);
    } else {
      console.log(`[ai-tracking] ✓ ${usage.functionName}: $${usage.costUsd.toFixed(4)} (${usage.tokensIn + usage.tokensOut} tokens)`);
    }
  } catch (err) {
    console.error('[ai-tracking] Exception logging usage:', err);
  }
}
