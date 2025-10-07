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
import type { BrandContext } from '@/types/brand';
import { contextHash } from '@/types/brand';

// For backwards compatibility during migration
export type NameSuggestion = NameOption;
export type Product = ProductIdea;
export type { ProductIdea } from '@/types/onboarding';
export type { BrandContext } from '@/types/brand';

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

export async function generateCampaign(context: BrandContext, products: any[]): Promise<GenerateCampaignResponseInternal> {
  const traceId = generateTraceId();
  bumpVersion('campaign');
  
  const flags = await getAllFeatureFlags();
  
  const headers: Record<string, string> = {
    ...getTelemetryHeaders(),
    'X-Idempotency-Key': traceId,
    'X-Feature-Flags': getFeatureFlagsHeader(flags),
    'X-Context-Hash': contextHash(context),
  };
  
  const { data, error } = await supabase.functions.invoke('generate-campaign', {
    body: { context, products },
    headers,
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

export async function generateLogos(
  businessName: string,
  style: string,
  vibes: string[] = [],
  ideaText?: string,
  context?: Partial<BrandContext>
): Promise<string[]> {
  const minimalContext: Partial<BrandContext> = context ? {
    idea_text: context.idea_text,
    tone_adjectives: context.tone_adjectives,
    audience: context.audience,
    palette: context.palette,
    bio: context.bio ? context.bio.substring(0, 200) : undefined
  } : undefined;

  return callWithRetry(
    async (signal) => {
      const traceId = generateTraceId();
      bumpVersion('logos');
      
      const flags = await getAllFeatureFlags();
      
      const headers: Record<string, string> = {
        ...getTelemetryHeaders(),
        'X-Idempotency-Key': traceId,
        'X-Feature-Flags': getFeatureFlagsHeader(flags),
      };
      
      if (minimalContext) {
        const hash = contextHash(minimalContext as BrandContext);
        headers['X-Context-Hash'] = hash;
      }
      
      const { data, error } = await supabase.functions.invoke('generate-logos', {
        body: {
          businessName,
          style,
          vibes,
          ideaText,
          context: minimalContext
        },
        headers,
      });

      if (error) {
        console.error('Error generating logos:', error);
        throw new Error(error.message || 'Failed to generate logos');
      }

      return data.logos;
    },
    {
      step: 'logo-generation',
      action: 'generate',
      payloadKeys: ['businessName', 'style', 'vibes'],
      provider: 'lovable-ai',
      timeoutMs: 30000,
      maxRetries: 2
    }
  ).then(response => response.data);
}

export interface GenerateProductIdeasRequest {
  idea_text: string;
  idea_source?: 'typed' | 'chip';
  audience_tags?: string[];
  tone_tags?: string[];
  max_ideas?: number;
  exclude_ids?: string[];
  smart_family_gen?: boolean;
  context?: Partial<BrandContext>;
}

export async function generateProductIdeas(request: GenerateProductIdeasRequest): Promise<ProductIdea[]> {
  const traceId = generateTraceId();
  bumpVersion('products');
  
  const flags = await getAllFeatureFlags();
  
  const headers: Record<string, string> = {
    ...getTelemetryHeaders(),
    'X-Idempotency-Key': traceId,
    'X-Feature-Flags': getFeatureFlagsHeader(flags),
  };
  
  // Add context hash if context is provided
  if (request.context) {
    const hash = contextHash(request.context as BrandContext);
    headers['X-Context-Hash'] = hash;
  }
  
  const { data, error } = await supabase.functions.invoke('generate-product-ideas', {
    body: request,
    headers,
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