import { supabaseShopfront } from '@/lib/supabaseClientShopfront';

export interface UpdatableSettings {
  theme?: { primary?: string; accent?: string; radius?: 'sm'|'md'|'xl'; density?: 'cozy'|'comfy'|'spacious' };
  layout?: { columns?: number };
  show_announcement?: boolean;
  announcement_text?: string | null;
}

export async function getSettings(businessId: string): Promise<{
  draft: any | null; published: any | null;
  theme: any | null; layout: any | null;
  show_announcement: boolean; announcement_text: string | null;
}> {
  try {
    const { data, error } = await supabaseShopfront
      .from('shopfront_settings')
      .select('*')
      .eq('business_id', businessId)
      .maybeSingle();
    if (error) throw error;
    return data ?? { draft: null, published: null, theme: null, layout: null, show_announcement: false, announcement_text: null };
  } catch {
    return { draft: null, published: null, theme: null, layout: null, show_announcement: false, announcement_text: null };
  }
}

export async function ensureRow(businessId: string): Promise<void> {
  try {
    const { data } = await supabaseShopfront
      .from('shopfront_settings')
      .select('business_id')
      .eq('business_id', businessId)
      .maybeSingle();
    if (!data) {
      await supabaseShopfront.from('shopfront_settings').insert({ business_id: businessId });
    }
  } catch {}
}

export async function saveDraft(businessId: string, draft: any): Promise<boolean> {
  try {
    await ensureRow(businessId);
    const { error } = await supabaseShopfront
      .from('shopfront_settings')
      .update({ draft })
      .eq('business_id', businessId);
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function publishDraft(businessId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseShopfront
      .from('shopfront_settings')
      .select('draft')
      .eq('business_id', businessId)
      .maybeSingle();
    if (error) throw error;
    const published = data?.draft ?? null;
    const { error: upErr } = await supabaseShopfront
      .from('shopfront_settings')
      .update({ published, published_at: new Date().toISOString() })
      .eq('business_id', businessId);
    if (upErr) throw upErr;
    return true;
  } catch {
    return false;
  }
}
