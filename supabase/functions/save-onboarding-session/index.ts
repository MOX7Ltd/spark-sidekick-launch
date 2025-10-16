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

    const { session_id, step, context, email, display_name, business_draft_id } = await req.json();

    if (!session_id || !step) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, step' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Saving onboarding session:', { session_id, step });

    // Upsert onboarding profile if email/display_name provided
    if (email || display_name) {
      const { error: profileError } = await supabase
        .from('onboarding_profiles')
        .upsert({
          session_id,
          email: email || undefined,
          display_name: display_name || undefined,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'session_id'
        });

      if (profileError) {
        console.error('Error upserting profile:', profileError);
      }
    }

    // Upsert onboarding state
    const { error: stateError } = await supabase
      .from('onboarding_state')
      .upsert({
        session_id,
        step,
        context: context || {},
        business_draft_id: business_draft_id || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'session_id'
      });

    if (stateError) {
      console.error('Error upserting state:', stateError);
      return new Response(
        JSON.stringify({ error: 'Failed to save state', details: stateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert onboarding_sessions with full payload snapshot
    const { error: sessionsError } = await supabase
      .from('onboarding_sessions')
      .upsert({
        session_id,
        payload: context || {},
        user_hint_email: email ? email.toLowerCase() : null,
      }, {
        onConflict: 'session_id'
      });

    if (sessionsError) {
      console.error('Error upserting onboarding_sessions:', sessionsError);
      // Don't fail the whole request - this is a nice-to-have backup
    }

    return new Response(
      JSON.stringify({ success: true, session_id, step }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-onboarding-session:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
