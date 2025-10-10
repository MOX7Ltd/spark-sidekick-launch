import { FLAGS } from './flags';
import { supabase } from '@/integrations/supabase/client';

export async function trackEvent(type: 'view' | 'message_click' | 'review_submit', metadata: { businessId: string; [key: string]: any }) {
  if (!FLAGS.ANALYTICS_V1) return;
  
  try {
    await supabase
      .from('analytics_events')
      .insert({
        business_id: metadata.businessId,
        type,
        metadata: metadata,
      });
  } catch (error) {
    // Silently fail - don't block user experience
    console.debug('Analytics tracking failed:', error);
  }
}
