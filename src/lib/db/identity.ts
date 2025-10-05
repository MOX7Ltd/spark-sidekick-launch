import { supabase } from '@/integrations/supabase/client';

export interface BusinessIdentity {
  id: string;
  owner_id: string;
  business_name: string;
  tagline?: string;
  bio?: string;
  brand_colors?: string[];
  logo_svg?: string;
  idea?: string;
  audience?: string;
  experience?: string;
  naming_preference?: string;
  updated_at?: string;
}

export async function getBusinessIdentity(userId: string): Promise<BusinessIdentity | null> {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching business identity:', error);
    throw new Error('Failed to fetch business identity');
  }

  if (!data) return null;

  return {
    id: data.id,
    owner_id: data.owner_id,
    business_name: data.business_name || '',
    tagline: data.tagline || undefined,
    bio: data.bio || undefined,
    brand_colors: data.brand_colors as string[] || [],
    logo_svg: data.logo_svg || undefined,
    idea: data.idea || undefined,
    audience: data.audience || undefined,
    experience: data.experience || undefined,
    naming_preference: data.naming_preference || undefined,
    updated_at: data.updated_at || undefined,
  };
}

export async function updateBusinessIdentity(
  businessId: string,
  patch: Partial<Omit<BusinessIdentity, 'id' | 'owner_id'>>
): Promise<BusinessIdentity> {
  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...patch,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business identity:', error);
    throw new Error('Failed to update business identity');
  }

  return {
    id: data.id,
    owner_id: data.owner_id,
    business_name: data.business_name || '',
    tagline: data.tagline || undefined,
    bio: data.bio || undefined,
    brand_colors: data.brand_colors as string[] || [],
    logo_svg: data.logo_svg || undefined,
    idea: data.idea || undefined,
    audience: data.audience || undefined,
    experience: data.experience || undefined,
    naming_preference: data.naming_preference || undefined,
    updated_at: data.updated_at || undefined,
  };
}
