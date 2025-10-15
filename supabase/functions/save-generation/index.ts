import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { generateHash } from '../_shared/hash.ts';

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

    const { stage, inputs, model = 'google/gemini-2.5-flash', session_id, user_id } = await req.json();

    if (!stage || !inputs || !session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: stage, inputs, session_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate prompt hash for deduplication
    const hashData = { stage, inputs, model, version: 1 };
    const prompt_hash = await generateHash(hashData);

    console.log('Checking for existing generation:', { session_id, stage, prompt_hash });

    // Check if generation already exists
    const { data: existing, error: checkError } = await supabase
      .from('ai_generations')
      .select('*, ai_generation_items(*)')
      .eq('session_id', session_id)
      .eq('stage', stage)
      .eq('prompt_hash', prompt_hash)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing generation:', checkError);
    }

    if (existing) {
      console.log('Found existing generation, returning cached result');
      return new Response(
        JSON.stringify({ cached: true, generation: existing }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No existing generation - call AI
    console.log('No cached generation found, calling AI...');
    
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant for SideHive onboarding.' },
          { role: 'user', content: JSON.stringify(inputs) }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI generation failed', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;
    const usage = aiData.usage;

    // Store generation
    const { data: generation, error: insertError } = await supabase
      .from('ai_generations')
      .insert({
        session_id,
        user_id: user_id || null,
        stage,
        prompt_hash,
        model,
        tokens_in: usage?.prompt_tokens || 0,
        tokens_out: usage?.completion_tokens || 0,
        cost_usd: ((usage?.prompt_tokens || 0) * 0.000001 + (usage?.completion_tokens || 0) * 0.000003).toFixed(4),
        payload: { inputs, response: content },
        primary_selection: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing generation:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store generation', details: insertError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and store generation items (if content is JSON array)
    let items = [];
    try {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent)) {
        for (let i = 0; i < parsedContent.length; i++) {
          const { data: item } = await supabase
            .from('ai_generation_items')
            .insert({
              generation_id: generation.id,
              rank: i,
              content: parsedContent[i],
              selected: false,
            })
            .select()
            .single();
          if (item) items.push(item);
        }
      }
    } catch (e) {
      console.log('Content is not JSON array, storing as single item');
      const { data: item } = await supabase
        .from('ai_generation_items')
        .insert({
          generation_id: generation.id,
          rank: 0,
          content: { text: content },
          selected: false,
        })
        .select()
        .single();
      if (item) items.push(item);
    }

    return new Response(
      JSON.stringify({
        cached: false,
        generation: {
          ...generation,
          ai_generation_items: items,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in save-generation:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
