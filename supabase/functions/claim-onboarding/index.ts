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
      .select('id');

    if (businessError) {
      console.error('Error claiming businesses:', businessError);
      throw businessError;
    }

    const businessIds = claimedBusinesses?.map(b => b.id) || [];
    console.log(`Claimed ${businessIds.length} businesses:`, businessIds);

    // Claim products
    const { data: claimedProducts, error: productsError } = await supabase
      .from('products')
      .update({ user_id: user.id, session_id: null })
      .eq('session_id', session_id)
      .is('user_id', null)
      .select('id');

    if (productsError) {
      console.error('Error claiming products:', productsError);
      throw productsError;
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
      console.error('Error claiming campaigns:', campaignsError);
      throw campaignsError;
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

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in claim-onboarding:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});