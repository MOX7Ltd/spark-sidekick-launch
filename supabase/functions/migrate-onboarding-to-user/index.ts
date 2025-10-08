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

    // 1. Fetch the onboarding session
    const { data: sessionData, error: sessionError } = await supabase
      .from('onboarding_sessions')
      .select('*')
      .eq('session_id', session_id)
      .is('migrated_at', null)
      .single();

    if (sessionError || !sessionData) {
      console.error('[migrate-onboarding] Session not found or already migrated');
      return new Response(
        JSON.stringify({ success: false, error: 'Session not found or already migrated' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    // 3. Create or update business
    let businessId: string | null = null;
    
    if (payload.context?.business_name) {
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: user_id,
          business_name: payload.context.business_name,
          bio: payload.context.bio,
          tagline: payload.context.tagline,
          tone_tags: payload.context.tone_adjectives || payload.context.vibes,
          audience: payload.context.audiences || payload.context.audience,
          brand_colors: payload.context.palette ? { colors: payload.context.palette } : null,
          status: 'draft',
          session_id: session_id,
        })
        .select('id')
        .single();

      if (businessError) {
        console.error('[migrate-onboarding] Business creation failed:', businessError);
      } else {
        businessId = business.id;
        console.log('[migrate-onboarding] Business created:', businessId);
      }
    }

    // 4. Migrate campaigns and posts
    const campaignIds: string[] = [];
    
    if (payload.generatedPosts && businessId) {
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
        console.error('[migrate-onboarding] Campaign creation failed:', campaignError);
      } else {
        campaignIds.push(campaign.id);

        // Create campaign items
        const items = payload.generatedPosts.map((post: any) => ({
          campaign_id: campaign.id,
          platform: post.platform || 'Instagram',
          hook: post.hook,
          caption: post.caption,
          hashtags: post.hashtags,
        }));

        const { error: itemsError } = await supabase
          .from('campaign_items')
          .insert(items);

        if (itemsError) {
          console.error('[migrate-onboarding] Campaign items creation failed:', itemsError);
        } else {
          console.log('[migrate-onboarding] Created campaign items:', items.length);
        }
      }
    }

    // 5. Migrate products if any
    if (payload.products && businessId) {
      const products = payload.products.map((product: any) => ({
        user_id,
        business_id: businessId,
        title: product.title,
        description: product.description,
        type: product.category || 'digital',
        format: product.format,
        status: 'draft',
        session_id: session_id,
      }));

      const { error: productsError } = await supabase
        .from('products')
        .insert(products);

      if (productsError) {
        console.error('[migrate-onboarding] Products migration failed:', productsError);
      } else {
        console.log('[migrate-onboarding] Migrated products:', products.length);
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
