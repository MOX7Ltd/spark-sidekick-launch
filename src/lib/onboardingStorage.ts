import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from './telemetry';
import type { BusinessIdentity, ProductIdea, IntroCampaign } from '@/types/onboarding';

/**
 * Save business identity data during onboarding (before signup)
 */
export async function saveBusinessIdentity(identity: BusinessIdentity): Promise<string | null> {
  const sessionId = getSessionId();
  
  try {
    // Check if business already exists for this session
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      // Update existing
      const updatePayload = {
        business_name: identity.name,
        tagline: identity.tagline,
        bio: identity.bio,
        brand_colors: identity.colors,
        logo_url: identity.logoUrl || null,
        logo_svg: identity.logoSVG || null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('businesses')
        .update(updatePayload)
        .eq('id', existing.id);

      if (error) {
        console.error('[saveBusinessIdentity] UPDATE failed', { 
          businessId: existing.id,
          session_id: sessionId, 
          payload: updatePayload, 
          error 
        });
        throw error;
      }
      return existing.id;
    } else {
      // Insert new business for anonymous onboarding
      const insertPayload = {
        session_id: sessionId,
        owner_id: null, // Explicitly null for anonymous users
        business_name: identity.name,
        tagline: identity.tagline,
        bio: identity.bio,
        brand_colors: identity.colors,
        logo_url: identity.logoUrl || null,
        logo_svg: identity.logoSVG || null,
        status: 'draft'
      };

      const { data, error } = await supabase
        .from('businesses')
        .insert(insertPayload)
        .select('id')
        .single();

      if (error) {
        console.error('[saveBusinessIdentity] INSERT failed', { 
          session_id: sessionId, 
          payload: insertPayload, 
          error,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details
        });
        throw error;
      }
      
      console.log('[saveBusinessIdentity] INSERT succeeded', { 
        businessId: data.id, 
        session_id: sessionId 
      });
      
      return data?.id || null;
    }
  } catch (error) {
    console.error('[saveBusinessIdentity] Exception caught:', error);
    return null;
  }
}

/**
 * Save product ideas during onboarding
 */
export async function saveProducts(products: ProductIdea[], businessId?: string): Promise<boolean> {
  const sessionId = getSessionId();
  
  try {
    // Delete existing products for this session to avoid duplicates
    await supabase
      .from('products')
      .delete()
      .eq('session_id', sessionId);

    // Insert new products
    const productsToInsert = products.map(product => ({
      session_id: sessionId,
      user_id: null,
      business_id: businessId || null,
      title: product.title,
      description: product.description,
      format: product.format,
      visible: false
    }));

    const { error } = await supabase
      .from('products')
      .insert(productsToInsert);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving products:', error);
    return false;
  }
}

/**
 * Save intro campaign during onboarding
 */
export async function saveIntroCampaign(
  campaign: IntroCampaign,
  businessId: string
): Promise<boolean> {
  const sessionId = getSessionId();
  
  try {
    // Check if intro campaign already exists
    const { data: existing } = await supabase
      .from('campaigns')
      .select('id')
      .eq('session_id', sessionId)
      .eq('type', 'intro')
      .single();

    const campaignData = {
      session_id: sessionId,
      business_id: businessId,
      type: 'intro',
      name: 'Intro Campaign',
      objective: 'Introduce business to audience',
      status: 'draft'
    };

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('campaigns')
        .update(campaignData)
        .eq('id', existing.id);

      if (error) throw error;

      // Delete and recreate campaign items
      await supabase
        .from('campaign_items')
        .delete()
        .eq('campaign_id', existing.id);

      const items = [
        {
          campaign_id: existing.id,
          platform: 'instagram',
          caption: campaign.shortPost.caption,
          hashtags: campaign.shortPost.hashtags
        },
        {
          campaign_id: existing.id,
          platform: 'linkedin',
          caption: campaign.longPost.caption,
          hashtags: []
        }
      ];

      await supabase
        .from('campaign_items')
        .insert(items);

    } else {
      // Insert new campaign
      const { data: newCampaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      // Insert campaign items
      const items = [
        {
          campaign_id: newCampaign.id,
          platform: 'instagram',
          caption: campaign.shortPost.caption,
          hashtags: campaign.shortPost.hashtags
        },
        {
          campaign_id: newCampaign.id,
          platform: 'linkedin',
          caption: campaign.longPost.caption,
          hashtags: []
        }
      ];

      const { error: itemsError } = await supabase
        .from('campaign_items')
        .insert(items);

      if (itemsError) throw itemsError;
    }

    return true;
  } catch (error) {
    console.error('Error saving intro campaign:', error);
    return false;
  }
}

/**
 * Claim all onboarding data for the authenticated user
 */
export async function claimOnboardingData(userId: string): Promise<{
  success: boolean;
  claimed?: {
    businesses: number;
    products: number;
    campaigns: number;
  };
  error?: string;
}> {
  const sessionId = getSessionId();
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const response = await supabase.functions.invoke('claim-onboarding', {
      body: { session_id: sessionId }
    });

    if (response.error) {
      console.error('Error claiming onboarding data:', response.error);
      return { success: false, error: response.error.message };
    }

    return {
      success: true,
      claimed: response.data.claimed
    };
  } catch (error: any) {
    console.error('Exception in claimOnboardingData:', error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}