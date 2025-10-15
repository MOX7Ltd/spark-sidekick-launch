import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { session_id, user_id } = await req.json();

    if (!session_id && !user_id) {
      return new Response(
        JSON.stringify({ error: 'Either session_id or user_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting onboarding state for:', { session_id, user_id });

    const result: any = {
      profile: null,
      state: null,
      business: null,
      generations: [],
      products: [],
      campaigns: [],
    };

    // Get onboarding profile
    if (session_id) {
      const { data: profile } = await supabase
        .from('onboarding_profiles')
        .select('*')
        .eq('session_id', session_id)
        .maybeSingle();
      result.profile = profile;
    }

    // Get onboarding state
    if (session_id) {
      const { data: state } = await supabase
        .from('onboarding_state')
        .select('*')
        .eq('session_id', session_id)
        .maybeSingle();
      result.state = state;
    }

    // Get business draft
    const businessQuery = supabase
      .from('businesses')
      .select('*');
    
    if (user_id) {
      businessQuery.eq('owner_id', user_id);
    } else if (session_id) {
      businessQuery.eq('session_id', session_id);
    }

    const { data: business } = await businessQuery.maybeSingle();
    result.business = business;

    // Get AI generations with items
    const generationsQuery = supabase
      .from('ai_generations')
      .select('*, ai_generation_items(*)')
      .order('created_at', { ascending: false });

    if (user_id) {
      generationsQuery.eq('user_id', user_id);
    } else if (session_id) {
      generationsQuery.eq('session_id', session_id);
    }

    const { data: generations } = await generationsQuery;
    result.generations = generations || [];

    // Get products
    const productsQuery = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (user_id) {
      productsQuery.eq('user_id', user_id);
    } else if (session_id) {
      productsQuery.eq('session_id', session_id);
    }

    const { data: products } = await productsQuery;
    result.products = products || [];

    // Get campaigns
    const campaignsQuery = supabase
      .from('campaigns')
      .select('*, campaign_items(*)')
      .order('created_at', { ascending: false });

    if (business?.id) {
      campaignsQuery.eq('business_id', business.id);
    } else if (session_id) {
      campaignsQuery.eq('session_id', session_id);
    }

    const { data: campaigns } = await campaignsQuery;
    result.campaigns = campaigns || [];

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-onboarding-state:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
