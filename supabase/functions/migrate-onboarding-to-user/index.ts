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

// Safe extraction helpers
function dig<T = any>(obj: any, path: string): T | null {
  return path.split('.').reduce<any>((o, k) => (o == null ? null : o?.[k]), obj) ?? null;
}

function firstOf<T = any>(...vals: (T | null | undefined)[]): T | null {
  return vals.find(v => v != null) ?? null;
}

// === Product family/type normalization (must match DB CHECK) ===
// DB-allowed values per products_type_check
const ALLOWED_TYPES = new Set(['digital', 'course', 'service', 'physical']);

const TYPE_MAP: Record<string, string> = {
  // generic onboarding buckets → canonical DB types
  'digital': 'digital',
  'services': 'service',
  'service': 'service',
  'teach': 'course',
  'physical': 'physical',

  // detailed families → DB types (preserve the detail in meta)
  'ebook': 'digital',
  'guide': 'digital',
  'digital guide': 'digital',
  'template': 'digital',
  'checklist': 'digital',
  'checklist / template': 'digital',
  'notion template': 'digital',
  'canva template': 'digital',
  'email pack': 'digital',
  'email sequence': 'digital',
  'video': 'digital',
  'video pack': 'digital',
  'bundle': 'physical',
  'starter kit': 'physical',
  'session': 'service',
  '1:1 session': 'service',
  'coaching': 'service',
  'consulting': 'service',
  'workshop': 'service',
  'course': 'course',
  'cohort': 'course',
  'mini-course': 'course',
};

function normalizeDbType(input?: string | null): string | null {
  if (!input) return null;
  const k = input.toString().trim().toLowerCase();
  const mapped = TYPE_MAP[k] ?? k;
  return ALLOWED_TYPES.has(mapped) ? mapped : null; // null passes CHECK if column is nullable
}

// === Campaign platform normalization (must match campaign_items CHECK) ===
const ALLOWED_PLATFORMS = new Set([
  'instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok', 'pinterest'
]);

function normalizePlatform(p?: string): string | null {
  const raw = (p || '').toString().trim().toLowerCase();
  const map: Record<string, string> = {
    'instagram': 'instagram', 'ig': 'instagram',
    'twitter': 'twitter', 'x': 'twitter',
    'facebook': 'facebook', 'fb': 'facebook',
    'linkedin': 'linkedin',
    'youtube': 'youtube', 'yt': 'youtube',
    'tiktok': 'tiktok',
    'pinterest': 'pinterest',
    'threads': 'instagram' // map to allowed set
  };
  const norm = map[raw] ?? raw;
  return ALLOWED_PLATFORMS.has(norm) ? norm : null; // null = skip
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
    
    // Find or create business (enforce one business per user)
    if (businessName) {
      const { data: existing } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user_id)
        .neq('status', 'deleted')
        .maybeSingle();

      if (existing) {
        // Update existing business with onboarding data
        const { error: updateError } = await supabase
          .from('businesses')
          .update({
            business_name: businessName,
            bio: bio || existing.bio,
            tagline: tagline || existing.tagline,
            logo_url: logo_url || existing.logo_url,
            logo_svg: logo_svg || existing.logo_svg,
            tone_tags: toneAdj || existing.tone_tags,
            audience: audience || existing.audience,
            brand_colors: (Array.isArray(brandColors) && brandColors.length > 0) 
              ? { colors: brandColors } 
              : existing.brand_colors,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('[migrate-onboarding] Business update failed:', updateError);
        } else {
          businessId = existing.id;
          console.log('[migrate-onboarding] Business updated:', businessId);
        }
      } else {
        // Create new business
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
    }

    // 4. Migrate products FIRST (before campaigns, so they always appear)
    const productsRaw = firstOf<any[]>(
      dig(payload, 'formData.products'),
      dig(payload, 'products')
    );

    let insertedProductCount = 0;

    if (Array.isArray(productsRaw) && productsRaw.length) {
      // Map to rows; validate title; normalize type
      const rows = productsRaw.map((p: any) => {
        const title = (p?.title || p?.name || '').trim();
        if (!title) return null;

        const rawType = p?.family ?? p?.category ?? p?.type ?? null;
        const dbType = normalizeDbType(rawType); // → 'digital' | 'course' | 'service' | 'physical' | null

        const description = p?.description ?? p?.summary ?? p?.notes ?? '';
        const price_low = p?.priceLow ?? null;
        const price_high = p?.priceHigh ?? null;
        const price_model = p?.priceModel ?? 'one-off';

        return {
          user_id,
          business_id: businessId,
          title,
          description,
          type: dbType,          // must satisfy DB CHECK (or be null)
          format: p?.format ?? null,
          price: price_low,
          status: 'draft',
          fulfillment: {
            source: 'onboarding',
            source_session_id: session_id,
            imported_at: new Date().toISOString(),
            price_low,
            price_high,
            price_model,
            raw_onboarding_type: rawType,     // e.g., 'ebook', 'session', 'template'
            detailed_family: p?.family ?? null, // keep richer/canonical family here
            raw_onboarding: p
          }
        };
      }).filter(Boolean) as any[];

      // Idempotency: skip titles already imported for this session
      const titles = rows.map(r => r.title);
      const { data: existing } = await supabase
        .from('products')
        .select('title, fulfillment')
        .eq('user_id', user_id)
        .in('title', titles);

      const existingSet = new Set(
        (existing ?? [])
          .filter((r: any) => r?.fulfillment?.source_session_id === session_id)
          .map((r: any) => (r.title || '').toLowerCase())
      );
      const toInsert = rows.filter(r => !existingSet.has(r.title.toLowerCase()));

      if (toInsert.length) {
        const { error } = await supabase.from('products').insert(toInsert);
        if (error) {
          console.error('[migrate-onboarding:products] batch insert failed, falling back per-row', error);
          // Per-row fallback so one bad row doesn't kill the set
          for (const r of toInsert) {
            const { error: rowErr } = await supabase.from('products').insert(r);
            if (rowErr) {
              console.error('[migrate-onboarding:products] row failed', r.title, rowErr);
            } else {
              insertedProductCount++;
            }
          }
        } else {
          insertedProductCount = toInsert.length;
        }
      }

      console.log('[migrate-onboarding:products]', {
        session_id,
        raw_count: productsRaw.length,
        inserted_count: insertedProductCount
      });
    } else {
      console.log('[migrate-onboarding:products] no products in payload');
    }

    // 5. Migrate campaigns and posts (best-effort, non-blocking)
    const posts = firstOf<any[]>(dig(payload, 'generatedPosts'), []);
    
    if (Array.isArray(posts) && posts.length && businessId) {
      const { data: campaign, error: campErr } = await supabase
        .from('campaigns')
        .insert({
          business_id: businessId,
          name: 'Imported from onboarding',
          type: 'intro',
          objective: 'Migrated from onboarding',
          status: 'draft',
          session_id: session_id,
        })
        .select('id')
        .single();

      if (campErr) {
        console.error('[migrate-onboarding:campaign] insert failed (continuing):', campErr);
      } else {
        const items = posts.map((p: any, i: number) => {
          const platform = normalizePlatform(p?.platform);
          if (!platform) return null; // skip to avoid CHECK failures
          return {
            campaign_id: campaign.id,
            platform,
            hook: p?.hook ?? `Post ${i + 1}`,
            caption: p?.caption ?? '',
            hashtags: Array.isArray(p?.hashtags) ? p.hashtags : [],
          };
        }).filter(Boolean) as any[];

        if (items.length) {
          const { error: itemsErr } = await supabase.from('campaign_items').insert(items);
          if (itemsErr) {
            console.error('[migrate-onboarding] campaign_items insert failed (continuing):', itemsErr);
          } else {
            console.log('[migrate-onboarding] campaign_items inserted:', items.length);
          }
        } else {
          console.log('[migrate-onboarding] no valid campaign_items after normalization');
        }

        console.log('[migrate-onboarding:campaign]', { 
          campaign_id: campaign.id, 
          posts_count: posts.length,
          valid_items: items.length 
        });
      }
    }

    // 6. Migrate AI generations to user
    const { error: genError } = await supabase
      .from('ai_generations')
      .update({ user_id })
      .eq('session_id', session_id)
      .is('user_id', null);

    if (genError) {
      console.error('[migrate-onboarding] AI generations migration failed:', genError);
    } else {
      console.log('[migrate-onboarding] AI generations migrated to user');
    }

    // 7. Mark onboarding profile as migrated
    const { error: profileMigError } = await supabase
      .from('onboarding_profiles')
      .update({ 
        migrated_to_user: user_id,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', session_id);

    if (profileMigError) {
      console.error('[migrate-onboarding] Onboarding profile migration failed:', profileMigError);
    }

    // 8. Update onboarding state
    const { error: stateError } = await supabase
      .from('onboarding_state')
      .update({ updated_at: new Date().toISOString() })
      .eq('session_id', session_id);

    if (stateError) {
      console.error('[migrate-onboarding] Onboarding state update failed:', stateError);
    }

    // 9. Mark session as migrated (existing table)
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
