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

    const { generation_id, item_id, session_id, user_id, business_id } = await req.json();

    if (!generation_id || !session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: generation_id, session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Selecting generation:', { generation_id, item_id, session_id });

    // Get the generation to find its stage
    const { data: generation, error: genError } = await supabase
      .from('ai_generations')
      .select('stage')
      .eq('id', generation_id)
      .single();

    if (genError || !generation) {
      return new Response(
        JSON.stringify({ error: 'Generation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark all generations in this stage as not primary
    const { error: resetError } = await supabase
      .from('ai_generations')
      .update({ primary_selection: false })
      .or(`session_id.eq.${session_id},user_id.eq.${user_id}`)
      .eq('stage', generation.stage);

    if (resetError) {
      console.error('Error resetting primary selections:', resetError);
    }

    // Mark this generation as primary
    const { error: updateError } = await supabase
      .from('ai_generations')
      .update({ primary_selection: true })
      .eq('id', generation_id);

    if (updateError) {
      console.error('Error updating generation:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update generation', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If item_id provided, mark all items as not selected, then mark this one as selected
    if (item_id) {
      await supabase
        .from('ai_generation_items')
        .update({ selected: false })
        .eq('generation_id', generation_id);

      await supabase
        .from('ai_generation_items')
        .update({ selected: true })
        .eq('id', item_id);
    }

    // If business_id provided, get the selected item content and update business
    if (business_id && item_id) {
      const { data: item } = await supabase
        .from('ai_generation_items')
        .select('content')
        .eq('id', item_id)
        .single();

      if (item?.content) {
        const updateData: any = {};
        
        // Map content to business fields based on stage
        if (generation.stage === 'business_name') {
          updateData.business_name = item.content.name || item.content.text;
        } else if (generation.stage === 'tagline') {
          updateData.tagline = item.content.tagline || item.content.text;
        } else if (generation.stage === 'logo') {
          updateData.logo_url = item.content.url;
          updateData.logo_svg = item.content.svg;
        } else if (generation.stage === 'bio') {
          updateData.bio = item.content.bio || item.content.text;
        }

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('businesses')
            .update(updateData)
            .eq('id', business_id);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, generation_id, item_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in select-generation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
