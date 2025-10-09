import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/telemetry';

interface HubBranding {
  name: string;
  tagline?: string;
  logoUrl?: string;
  isLoading: boolean;
}

/**
 * Generate initials from business name (max 2 chars)
 */
export function getInitials(name: string): string {
  if (!name) return 'YB';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generate deterministic gradient colors from business name
 */
export function getDeterministicGradient(name: string): { from: string; to: string } {
  if (!name) return { from: '185 85% 45%', to: '35 95% 55%' };
  
  // Simple hash from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  
  const gradients = [
    { from: '185 85% 45%', to: '35 95% 55%' }, // Teal to Orange (default)
    { from: '210 85% 45%', to: '185 70% 55%' }, // Navy to Teal
    { from: '35 95% 55%', to: '185 85% 45%' },  // Orange to Teal
    { from: '270 70% 50%', to: '185 85% 45%' }, // Purple to Teal
    { from: '185 85% 45%', to: '210 85% 45%' }, // Teal to Navy
  ];
  
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Hook to fetch Hub branding data
 * Priority: auth profile/business → onboarding session → fallback
 */
export function useHubBranding(): HubBranding & { refetch: () => void } {
  const [branding, setBranding] = useState<HubBranding>({
    name: 'Your Business',
    tagline: undefined,
    logoUrl: undefined,
    isLoading: true,
  });

  const fetchBranding = async () => {
    try {
      // 1. Try to get from authenticated user's business
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data: business, error } = await supabase
          .from('businesses')
          .select('business_name, tagline, logo_url, logo_svg')
          .eq('owner_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && business) {
          setBranding({
            name: business.business_name || 'Your Business',
            tagline: business.tagline || undefined,
            logoUrl: business.logo_url || business.logo_svg || undefined,
            isLoading: false,
          });
          return;
        }
      }

      // 2. Try to get from onboarding session
      const sessionId = getSessionId();
      if (sessionId) {
        const { data: sessionData, error: sessionError } = await supabase
          .from('onboarding_sessions')
          .select('payload')
          .eq('session_id', sessionId)
          .is('migrated_at', null)
          .maybeSingle();

        if (!sessionError && sessionData?.payload) {
          const payload = sessionData.payload as any;
          const businessIdentity = payload.formData?.businessIdentity || payload.businessIdentity;
          
          if (businessIdentity) {
            setBranding({
              name: businessIdentity.name || businessIdentity.workingName || 'Your Business',
              tagline: businessIdentity.tagline || undefined,
              logoUrl: businessIdentity.logoUrl || businessIdentity.logoSVG || undefined,
              isLoading: false,
            });
            return;
          }
        }
      }

      // 3. Fallback
      setBranding({
        name: 'Your Business',
        tagline: undefined,
        logoUrl: undefined,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch Hub branding:', error);
      setBranding({
        name: 'Your Business',
        tagline: undefined,
        logoUrl: undefined,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return { ...branding, refetch: fetchBranding };
}
