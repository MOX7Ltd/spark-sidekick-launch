import { supabase } from "@/integrations/supabase/client";

export interface GenerateIdentityRequest {
  idea: string;
  audience: string;
  experience?: string;
  motivation?: string;
  namingPreference?: 'with_personal_name' | 'anonymous' | 'custom';
  firstName?: string;
  lastName?: string;
  tone?: string;
  styleCategory?: string;
  bannedWords?: string[];
  rejectedNames?: string[];
  regenerateNamesOnly?: boolean;
  regenerateSingleName?: boolean;
}

export interface NameSuggestion {
  name: string;
  style: string;
  tagline: string;
}

export interface Product {
  title: string;
  type: string;
  price: string;
  description: string;
}

export interface GenerateIdentityResponse {
  business: any;
  nameOptions: NameSuggestion[];
  tagline: string;
  bio: string;
  colors: string[];
  logoSVG: string;
  products: Product[];
}

export interface GenerateCampaignRequest {
  businessId: string;
  type: 'intro' | 'quick_win' | 'conversion' | 'custom';
  platforms: string[];
}

export interface GenerateCampaignResponse {
  campaign: any;
  items: any[];
}

export async function generateBusinessIdentity(request: GenerateIdentityRequest): Promise<GenerateIdentityResponse> {
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: request
  });

  if (error) {
    console.error('Error generating business identity:', error);
    throw new Error(error.message || 'Failed to generate business identity');
  }

  return data;
}

export async function generateCampaign(request: GenerateCampaignRequest): Promise<GenerateCampaignResponse> {
  const { data, error } = await supabase.functions.invoke('generate-campaign', {
    body: request
  });

  if (error) {
    console.error('Error generating campaign:', error);
    throw new Error(error.message || 'Failed to generate campaign');
  }

  return data;
}

export async function regenerateBusinessNames(request: GenerateIdentityRequest): Promise<NameSuggestion[]> {
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: { ...request, regenerateNamesOnly: true }
  });

  if (error) {
    console.error('Error regenerating business names:', error);
    throw new Error(error.message || 'Failed to regenerate business names');
  }

  return data.nameOptions;
}

export async function regenerateSingleName(request: GenerateIdentityRequest): Promise<NameSuggestion> {
  const { data, error } = await supabase.functions.invoke('generate-identity', {
    body: { ...request, regenerateSingleName: true }
  });

  if (error) {
    console.error('Error regenerating single name:', error);
    throw new Error(error.message || 'Failed to regenerate name');
  }

  return data.nameOption;
}

export async function generateLogos(businessName: string, style: string): Promise<string[]> {
  const { data, error } = await supabase.functions.invoke('generate-logos', {
    body: { businessName, style }
  });

  if (error) {
    console.error('Error generating logos:', error);
    throw new Error(error.message || 'Failed to generate logos');
  }

  return data.logos;
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