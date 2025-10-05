import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the authenticated user from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user's token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { session_id } = await req.json();
    
    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[claim-onboarding] Claiming data for session ${session_id} to user ${user.id}`);

    // Ensure profile exists before claiming (defense-in-depth)
    const ensureProfile = async (uid: string) => {
      const { data: existing, error: selErr } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', uid)
        .maybeSingle();

      if (selErr) {
        console.error('[claim-onboarding] Error checking profile:', selErr);
        throw selErr;
      }

      if (!existing) {
        console.log('[claim-onboarding] Creating missing profile for user:', uid);
        const { error: insErr } = await supabase
          .from('profiles')
          .insert({ user_id: uid });
        
        // Ignore conflict errors (23505) in case of race condition
        if (insErr && insErr.code !== '23505') {
          console.error('[claim-onboarding] Error creating profile:', insErr);
          throw insErr;
        }
      }
    };

    await ensureProfile(user.id);

    // Idempotency pre-check: if nothing to claim, return early
    const [bizCountRes, prodCountRes, campCountRes] = await Promise.all([
      supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session_id)
        .is('owner_id', null),
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session_id)
        .is('user_id', null),
      supabase
        .from('campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', session_id),
    ]);

    const preBiz = bizCountRes.count || 0;
    const preProd = prodCountRes.count || 0;
    const preCamp = campCountRes.count || 0;

    if (preBiz === 0 && preProd === 0 && preCamp === 0) {
      console.log('[claim-onboarding] Nothing to claim for session', session_id);
      return new Response(
        JSON.stringify({
          success: true,
          claimed: { businesses: 0, products: 0, campaigns: 0 },
          ids: { businessIds: [], productIds: [], campaignIds: [] }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this session has already been claimed by a different user
    const { data: existingBusiness } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('session_id', session_id)
      .not('owner_id', 'is', null)
      .single();

    if (existingBusiness && existingBusiness.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'This session has already been claimed by another user' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Claim businesses
    const { data: claimedBusinesses, error: businessError } = await supabase
      .from('businesses')
      .update({ owner_id: user.id, session_id: null })
      .eq('session_id', session_id)
      .is('owner_id', null)
      .select('id, logo_url');

    if (businessError) {
      console.error('[claim-onboarding] Error claiming businesses:', businessError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: 'CLAIM_BUSINESSES_FAILED', 
          error: businessError.message,
          details: businessError.details || businessError.hint 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const businessIds = claimedBusinesses?.map(b => b.id) || [];
    console.log(`Claimed ${businessIds.length} businesses:`, businessIds);

    // Move logo files from session folder to user folder
    for (const business of claimedBusinesses || []) {
      if (business.logo_url && business.logo_url.includes('onboarding/')) {
        try {
          console.log(`Moving logo for business ${business.id}...`);
          
          // List files in the onboarding session folder
          const { data: files, error: listError } = await supabase.storage
            .from('brand-assets')
            .list(`onboarding/${session_id}/logos`);

          if (listError || !files || files.length === 0) {
            console.warn('No logos to move for session:', session_id);
            continue;
          }

          // Move the first logo file
          const file = files[0];
          const fromPath = `onboarding/${session_id}/logos/${file.name}`;
          const toPath = `users/${user.id}/logos/${file.name}`;

          // Copy file to new location
          const { error: copyError } = await supabase.storage
            .from('brand-assets')
            .copy(fromPath, toPath);

          if (copyError) {
            console.error('Logo copy error:', copyError);
            continue;
          }

          // Delete old file
          const { error: deleteError } = await supabase.storage
            .from('brand-assets')
            .remove([fromPath]);

          if (deleteError) {
            console.warn('Logo delete error (non-critical):', deleteError);
          }

          // Get new public URL
          const { data: urlData } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(toPath);

          // Update business with new URL
          const { error: updateError } = await supabase
            .from('businesses')
            .update({ logo_url: urlData.publicUrl })
            .eq('id', business.id);

          if (updateError) {
            console.error('Logo URL update error:', updateError);
          } else {
            console.log('✓ Moved logo for business:', business.id);
          }
        } catch (error) {
          console.error('Error moving logo for business:', business.id, error);
        }
      }
    }

    // Claim products
    const { data: claimedProducts, error: productsError } = await supabase
      .from('products')
      .update({ user_id: user.id, session_id: null })
      .eq('session_id', session_id)
      .is('user_id', null)
      .select('id');

    if (productsError) {
      console.error('[claim-onboarding] Error claiming products:', productsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: 'CLAIM_PRODUCTS_FAILED', 
          error: productsError.message,
          details: productsError.details || productsError.hint 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productIds = claimedProducts?.map(p => p.id) || [];
    console.log(`Claimed ${productIds.length} products:`, productIds);

    // Claim campaigns
    const { data: claimedCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .update({ session_id: null })
      .eq('session_id', session_id)
      .in('business_id', businessIds.length > 0 ? businessIds : ['00000000-0000-0000-0000-000000000000'])
      .select('id');

    if (campaignsError) {
      console.error('[claim-onboarding] Error claiming campaigns:', campaignsError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          code: 'CLAIM_CAMPAIGNS_FAILED', 
          error: campaignsError.message,
          details: campaignsError.details || campaignsError.hint 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const campaignIds = claimedCampaigns?.map(c => c.id) || [];
    console.log(`Claimed ${campaignIds.length} campaigns:`, campaignIds);

    const result = {
      claimed: {
        businesses: businessIds.length,
        products: productIds.length,
        campaigns: campaignIds.length
      },
      ids: {
        businessIds,
        productIds,
        campaignIds
      }
    };

    console.log('[claim-onboarding] Claim complete:', result);

    // Log telemetry event for onboarding completion
    await supabase.from('events').insert({
      session_id: session_id,
      trace_id: `claim-${session_id}-${Date.now()}`,
      action: 'onboarding_completed',
      step: 'claim-data',
      ok: true,
      payload_keys: ['businesses', 'products', 'campaigns'],
    });

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[claim-onboarding] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        code: 'CLAIM_FATAL_ERROR', 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});