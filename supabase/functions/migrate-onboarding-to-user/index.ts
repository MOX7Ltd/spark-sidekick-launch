import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MigrationRequest {
  user_id: string;
  session_id: string;
}

interface MigrationResponse {
  success: boolean;
  profile_id?: string;
  campaign_ids?: string[];
  shopfront_id?: string;
  error?: string;
}

// Robust extraction helpers
function dig<T = any>(obj: any, path: string): T | null {
  return path.split('.').reduce<any>((o, k) => (o == null ? null : o?.[k]), obj) ?? null;
}

function firstOf<T = any>(...vals: (T | null | undefined)[]): T | null {
  return vals.find(v => v != null) ?? null;
}

// Platform normalization and validation
const ALLOWED_PLATFORMS = new Set([
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest'
]);

function normalizePlatform(p?: string): string | null {
  const raw = (p || '').toString().trim().toLowerCase();
  const map: Record<string, string> = {
    instagram: 'instagram', ig: 'instagram',
    twitter: 'twitter', x: 'twitter',
    facebook: 'facebook', fb: 'facebook',
    linkedin: 'linkedin',
    youtube: 'youtube', yt: 'youtube',
    tiktok: 'tiktok',
    pinterest: 'pinterest',
    threads: 'instagram'
  };
  const norm = map[raw] ?? raw;
  return ALLOWED_PLATFORMS.has(norm) ? norm : null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, session_id }: MigrationRequest = await req.json();

    if (!user_id || !session_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing user_id or session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[migrate-onboarding] Migrating session ${session_id} to user ${user_id}`);

    // 1. Fetch the onboarding session and check idempotency
    const { data: sessionData, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !sessionData) {
      console.error('[migrate-onboarding] Session not found:', sessionError);
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Idempotency check: if already migrated, return success
    if (sessionData.migrated_at) {
      console.log('[migrate-onboarding] Session already migrated at:', sessionData.migrated_at);
      return new Response(
        JSON.stringify({ 
          success: true, 
          note: 'Already migrated',
          migrated_at: sessionData.migrated_at,
          migrated_to_user_id: sessionData.migrated_to_user_id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = sessionData.payload as any;
    console.log('[migrate-onboarding] Session payload keys:', Object.keys(payload));

    // 2. Update or create profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id,
          display_name: payload.formData?.name || payload.context?.user_first_name,
          email: payload.formData?.email || sessionData.user_hint_email,
        });

      if (profileError) {
        console.error('[migrate-onboarding] Profile creation failed:', profileError);
      }
    }

    // 3. Extract business identity with robust multi-path extraction
    let businessId: string | null = null;
    
    const bi = firstOf(
      dig(payload, 'formData.businessIdentity'),
      dig(payload, 'businessIdentity'),
      dig(payload, 'context')
    );

    const businessName = firstOf(
      dig<string>(bi, 'name'),
      dig<string>(bi, 'business_name'),
      dig<string>(payload, 'formData.businessIdentity.name')
    );
    
    const tagline = firstOf(
      dig<string>(bi, 'tagline'),
      dig<string>(payload, 'formData.tagline'),
      dig<string>(payload, 'context.tagline')
    );

    const bio = firstOf(
      dig<string>(bi, 'bio'),
      dig<string>(payload, 'formData.bio'),
      dig<string>(payload, 'context.bio')
    );

    const brandColors = firstOf(
      dig<string[]>(bi, 'colors'),
      dig<string[]>(payload, 'formData.businessIdentity.colors')
    );

    const toneAdj = firstOf(
      dig<string[]>(bi, 'tone_adjectives'),
      dig<string[]>(payload, 'formData.vibes'),
      dig<string[]>(payload, 'context.vibes')
    );

    const audience = firstOf(
      dig(payload, 'formData.audiences'),
      dig(payload, 'context.audiences'),
      dig(payload, 'context.audience')
    );

    // Handle logo: data URL → upload to Storage
    const rawLogoSvg = firstOf(dig<string>(bi, 'logoSVG'), dig<string>(bi, 'logo_svg'));
    const rawLogoUrl = firstOf(dig<string>(bi, 'logoUrl'), dig<string>(bi, 'logo_url'));

    let logo_url: string | null = rawLogoUrl ?? null;
    let logo_svg: string | null = null;

    if (rawLogoSvg?.startsWith('data:')) {
      const m = rawLogoSvg.match(/^data:(.+);base64,(.*)$/);
      if (m) {
        const contentType = m[1] || 'image/png';
        const ext = contentType.split('/')[1] || 'png';
        const base64 = m[2];
        const decoder = new TextDecoder();
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const path = `logos/${user_id}/${crypto.randomUUID()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(path, bytes, { contentType, upsert: true });
        
        if (uploadError) {
          console.error('[migrate-onboarding] Logo upload failed:', uploadError);
        } else {
          const { data: publicData } = supabase.storage.from('brand-assets').getPublicUrl(path);
          logo_url = publicData.publicUrl;
          // Only keep SVG markup if content type is SVG
          logo_svg = contentType.includes('svg') ? rawLogoSvg : null;
        }
      }
    } else if (rawLogoSvg?.trim()?.startsWith('<svg')) {
      logo_svg = rawLogoSvg;
    }

    console.log('[migrate-onboarding] Extracted data:', {
      user_id,
      session_id,
      businessName,
      tagline_present: !!tagline,
      logo_url_present: !!logo_url,
      logo_svg_is_inline: !!logo_svg,
      colors_count: brandColors?.length ?? 0,
      posts_count: dig<any[]>(payload, 'generatedPosts')?.length ?? 0
    });
    
    if (businessName) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user_id,
          business_name: businessName,
          bio: bio,
          tagline: tagline,
          logo_url: logo_url,
          logo_svg: logo_svg,
          tone_tags: toneAdj,
          audience: audience,
          brand_colors: (Array.isArray(brandColors) && brandColors.length > 0) 
            ? { colors: brandColors } 
            : null,
          status: 'draft',
          session_id: session_id,
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('[migrate-onboarding] Business creation failed:', businessError);
        throw new Error(`Business creation failed: ${businessError.message}`);
      } else {
        businessId = business.id;
        console.log('[migrate-onboarding] Business created:', businessId);
      }
    }

    // 4. Migrate products FIRST (before campaigns, so they always appear)
    const productsRaw = firstOf<any[]>(
      dig(payload, 'formData.products'),
      dig(payload, 'products')
    );

    if (Array.isArray(productsRaw) && productsRaw.length > 0 && businessId) {
      // Canonical family normalization from productCatalog
      const ALLOWED_FAMILIES = new Set([
        'template', 'ebook', 'session', 'course', 'email-pack', 'video', 'bundle'
      ]);

      const FAMILY_MAP: Record<string, string> = {
        // generic onboarding buckets
        'digital': 'ebook',
        'services': 'session',
        'teach': 'course',
        'physical': 'bundle',
        // specific synonyms
        'checklist': 'template',
        'checklist / template': 'template',
        'template': 'template',
        'notion template': 'template',
        'canva template': 'template',
        'digital guide': 'ebook',
        'guide': 'ebook',
        'ebook': 'ebook',
        '1:1 session': 'session',
        'coaching': 'session',
        'consulting': 'session',
        'workshop': 'session',
        'cohort': 'course',
        'mini-course': 'course',
        'course': 'course',
        'email sequence': 'email-pack',
        'email pack': 'email-pack',
        'video pack': 'video',
        'video': 'video',
        'bundle': 'bundle',
        'starter kit': 'bundle',
      };

      const FORMAT_FALLBACK: Record<string, string> = {
        'template': 'download',
        'ebook': 'download',
        'session': 'session',
        'course': 'course',
        'email-pack': 'download',
        'video': 'video',
        'bundle': 'bundle',
      };

      const normalizeFamily = (input?: string): string | null => {
        if (!input) return null;
        const k = input.toLowerCase().trim();
        const mapped = FAMILY_MAP[k] ?? k;
        return ALLOWED_FAMILIES.has(mapped) ? mapped : null;
      };

      const titleOf = (p: any) => p?.title ?? p?.name ?? '';
      const descOf = (p: any) => p?.description ?? p?.summary ?? p?.notes ?? '';

      const toInsert: any[] = [];
      for (const p of productsRaw) {
        const title = (titleOf(p) || '').trim();
        if (!title) continue;

        const rawFamily = p.family ?? p.category ?? p.type;
        const family = normalizeFamily(rawFamily);
        const format = p.format ?? (family ? FORMAT_FALLBACK[family] : null) ?? 'download';

        const price_low = p.priceLow ?? null;
        const price_high = p.priceHigh ?? null;
        const price_model = p.priceModel ?? 'one-off';

        toInsert.push({
          user_id,
          business_id: businessId,
          title,
          description: descOf(p),
          type: family,  // null if normalization failed
          format,
          price: price_low,
          status: 'draft',
          session_id: session_id,
          fulfillment: {
            source: 'onboarding',
            source_session_id: session_id,
            imported_at: new Date().toISOString(),
            price_low,
            price_high,
            price_model,
            raw_onboarding_type: rawFamily,
            raw_onboarding: p,
          }
        });
      }

      // Idempotency: skip any title already imported for this session
      if (toInsert.length) {
        const titles = toInsert.map((r: any) => r.title);
        const { data: existing } = await supabase
          .from('products')
          .select('id,title,fulfillment')
          .eq('user_id', user_id)
          .in('title', titles);

        const existingSet = new Set(
          (existing ?? [])
            .filter((r: any) => r?.fulfillment?.source_session_id === session_id)
            .map((r: any) => (r.title || '').toLowerCase())
        );

        const finalInsert = toInsert.filter((r: any) => !existingSet.has(r.title.toLowerCase()));
        
        if (finalInsert.length) {
          const { error: productsError } = await supabase
            .from('products')
            .insert(finalInsert);

          if (productsError) {
            console.error('[migrate-onboarding] Products migration failed:', productsError);
          } else {
            console.log('[migrate-onboarding:products]', {
              user_id,
              session_id,
              products_in_payload: productsRaw.length,
              inserted_count: finalInsert.length
            });
          }
        } else {
          console.log('[migrate-onboarding:products] All products already migrated');
        }
      }
    }

    // 5. Migrate campaigns and posts (best-effort, non-blocking)
    const campaignIds: string[] = [];
    const posts = firstOf(dig<any[]>(payload, 'generatedPosts'), []);
    
    if (Array.isArray(posts) && posts.length > 0 && businessId) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          business_id: businessId,
          name: 'Intro Campaign',
          type: 'intro',
          objective: 'Migrated from onboarding',
          status: 'draft',
          session_id: session_id,
        })
        .select('id')
        .single();

      if (campaignError) {
        console.error('[migrate-onboarding] Campaign creation failed (continuing):', campaignError);
      } else {
        campaignIds.push(campaign.id);

        // Create campaign items with normalized platforms
        const items = posts
          .map((post: any, i: number) => {
            const platform = normalizePlatform(post.platform);
            if (!platform) {
              console.log('[migrate-onboarding] Skipping invalid platform:', post.platform);
              return null;
            }
            return {
              campaign_id: campaign.id,
              platform,
              hook: post.hook ?? `Post ${i + 1}`,
              caption: post.caption ?? '',
              hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
            };
          })
          .filter(Boolean);

        if (items.length) {
          const { error: itemsError } = await supabase
            .from('campaign_items')
            .insert(items as any[]);

          if (itemsError) {
            console.error('[migrate-onboarding] campaign_items insert failed (continuing):', itemsError);
          } else {
            console.log('[migrate-onboarding] campaign_items inserted:', items.length);
          }
        } else {
          console.log('[migrate-onboarding] no valid campaign_items after normalization');
        }

        console.log('[migrate-onboarding:campaign]', { 
          campaign_id: campaign.id, 
          posts_count: posts?.length ?? 0,
          valid_items: items.length 
        });
      }
    }

    // 6. Mark session as migrated
    await supabase
      .from('onboarding_sessions')
      .update({
        migrated_at: new Date().toISOString(),
        migrated_to_user_id: user_id,
      })
      .eq('session_id', session_id);

    console.log('[migrate-onboarding] Migration completed successfully');

    const response: MigrationResponse = {
      success: true,
      profile_id: user_id,
      campaign_ids: campaignIds,
      shopfront_id: businessId || undefined,
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[migrate-onboarding] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
