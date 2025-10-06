import { supabase } from "@/integrations/supabase/client";
import { getTelemetryHeaders, generateTraceId } from './telemetry';
import { logEvent } from './eventLogger';
import { callWithRetry } from './apiClient';
import { createAbortable, cleanupAbortable } from './abortManager';
import { bumpVersion } from './versionManager';
import { getAllFeatureFlags, getFeatureFlagsHeader } from './featureFlags';
import type { 
  GenerateIdentityRequest,
  GenerateLogosRequest,
  GenerateCampaignRequest,
  NameOption,
  ProductIdea
} from '@/types/onboarding';

// For backwards compatibility during migration
export type NameSuggestion = NameOption;
export type Product = ProductIdea;
export type { ProductIdea } from '@/types/onboarding';

interface GenerateIdentityResponseInternal {
  business: any;
  nameOptions: NameOption[];
  tagline: string;
  bio: string;
  colors: string[];
  logoSVG: string;
  products: ProductIdea[];
}

export async function generateBusinessIdentity(request: GenerateIdentityRequest): Promise<GenerateIdentityResponseInternal> {
  const traceId = generateTraceId();
  bumpVersion('business-identity');
  
  const flags = await getAllFeatureFlags();
  
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: request,
    headers: {
      ...getTelemetryHeaders(),
      'X-Idempotency-Key': traceId,
      'X-Feature-Flags': getFeatureFlagsHeader(flags),
    },
  });

  if (error) {
    console.error('Error generating business identity:', error);
    throw new Error(error.message || 'Failed to generate business identity');
  }

  return data;
}

export interface GenerateCampaignResponseInternal {
  campaign: any;
  items: any[];
}

export async function generateCampaign(request: GenerateCampaignRequest): Promise<GenerateCampaignResponseInternal> {
  const traceId = generateTraceId();
  bumpVersion('campaign');
  
  const flags = await getAllFeatureFlags();
  
  const { data, error } = await supabase.functions.invoke('generate-campaign', {
    body: request,
    headers: {
      ...getTelemetryHeaders(),
      'X-Idempotency-Key': traceId,
      'X-Feature-Flags': getFeatureFlagsHeader(flags),
    },
  });

  if (error) {
    console.error('Error generating campaign:', error);
    throw new Error(error.message || 'Failed to generate campaign');
  }

  return data;
}

export async function regenerateBusinessNames(request: GenerateIdentityRequest): Promise<NameOption[]> {
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: { ...request, regenerateNamesOnly: true }
  });

  if (error) {
    console.error('Error regenerating business names:', error);
    throw new Error(error.message || 'Failed to regenerate business names');
  }

  return data.nameOptions;
}

export async function regenerateSingleName(request: GenerateIdentityRequest): Promise<NameOption> {
  const traceId = generateTraceId();
  const flags = await getAllFeatureFlags();
  
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: { ...request, regenerateSingleName: true },
    headers: {
      ...getTelemetryHeaders(),
      'X-Idempotency-Key': traceId,
      'X-Feature-Flags': getFeatureFlagsHeader(flags),
    },
  });

  if (error) {
    console.error('Error regenerating single name:', error);
    throw new Error(error.message || 'Failed to regenerate name');
  }

  return data.nameOption;
}

export async function generateLogos(businessName: string, style: string, vibes: string[] = []): Promise<string[]> {
  const traceId = generateTraceId();
  bumpVersion('logos');
  
  const flags = await getAllFeatureFlags();
  
  const { data, error } = await supabase.functions.invoke('generate-logos', {
    body: { businessName, style, vibes },
    headers: {
      ...getTelemetryHeaders(),
      'X-Idempotency-Key': traceId,
      'X-Feature-Flags': getFeatureFlagsHeader(flags),
    },
  });

  if (error) {
    console.error('Error generating logos:', error);
    throw new Error(error.message || 'Failed to generate logos');
  }

  return data.logos;
}

export interface GenerateProductIdeasRequest {
  idea_text: string;
  idea_source?: 'typed' | 'chip';
  audience_tags?: string[];
  tone_tags?: string[];
  max_ideas?: number;
  exclude_ids?: string[];
  smart_family_gen?: boolean;
}

export async function generateProductIdeas(request: GenerateProductIdeasRequest): Promise<ProductIdea[]> {
  const traceId = generateTraceId();
  bumpVersion('products');
  
  const flags = await getAllFeatureFlags();
  
  const { data, error } = await supabase.functions.invoke('generate-product-ideas', {
    body: request,
    headers: {
      ...getTelemetryHeaders(),
      'X-Idempotency-Key': traceId,
      'X-Feature-Flags': getFeatureFlagsHeader(flags),
    },
  });

  if (error) {
    console.error('Error generating product ideas:', error);
    throw new Error(error.message || 'Failed to generate product ideas');
  }

  return data.products || data.ideas || [];
}

export async function updateBusinessName(businessId: string, businessName: string) {
  const { data, error } = await supabase
    .from('businesses')
    .update({ business_name: businessName, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business name:', error);
    throw new Error('Failed to update business name');
  }

  return data;
}

export async function getUserBusiness(userId: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
    console.error('Error fetching user business:', error);
    throw new Error('Failed to fetch business data');
  }

  return data;
}

export async function getFeatureFlag(key: string): Promise<boolean> {
  const flags = await getAllFeatureFlags();
  return flags[key] ?? false;
}