import { supabase } from '@/integrations/supabase/client';
import { getSessionId, getFormState, getStepState } from './telemetry';

export type RecoveryTier = 'email' | 'session' | 'none';

export interface ProgressInfo {
  tier: RecoveryTier;
  lastStep?: number;
  ideaSummary?: string;
  email?: string;
  hasProducts?: boolean;
}

export async function detectSavedProgress(): Promise<ProgressInfo> {
  const sessionId = getSessionId();
  
  // Tier 1: Check for email-saved progress
  const { data: preauth } = await supabase
    .from('preauth_profiles')
    .select('email')
    .eq('session_id', sessionId)
    .maybeSingle();
  
  if (preauth?.email) {
    // User saved with email - strongest tier
    const savedStep = getStepState();
    return {
      tier: 'email',
      lastStep: savedStep ? parseInt(savedStep) : 1,
      email: preauth.email,
    };
  }
  
  // Tier 2: Check for session-based progress
  const savedFormData = getFormState();
  const savedStep = getStepState();
  const { data: session } = await supabase
    .from('onboarding_sessions')
    .select('payload')
    .eq('session_id', sessionId)
    .maybeSingle();
  
  const hasLocalProgress = savedFormData?.idea || savedStep;
  const payload = session?.payload as any;
  const hasServerProgress = payload?.idea || payload?.products;
  
  if (hasLocalProgress || hasServerProgress) {
    return {
      tier: 'session',
      lastStep: savedStep ? parseInt(savedStep) : 1,
      ideaSummary: savedFormData?.idea || payload?.idea,
      hasProducts: !!payload?.products,
    };
  }
  
  // Tier 3: No progress found
  return { tier: 'none' };
}
