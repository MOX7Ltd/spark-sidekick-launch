import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea_text, idea_source, audience_tags, tone_tags, max_ideas = 4, exclude_ids = [] } = await req.json();
    
    console.log('Generating product ideas for:', idea_text);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are generating preview product ideas for a storefront. The user already has a monetizable idea.
Return concise, revenue-ready ideas that map directly to the user's description.

Rules:
- Do NOT include prices, emojis, or hashtags.
- Each idea must feel like a thing someone can purchase or book.
- Prefer workshops, memberships, services, cohorts, challenges, templates, and toolkits when appropriate.
- Description must be 1–2 sentences, outcomes-first, then what's inside/how it works.
- Match the audience and context implied by the idea_text.
- Names should be specific and brand-neutral (avoid puns and hype).
- Generate exactly ${max_ideas} unique product ideas.
${exclude_ids.length > 0 ? `- Do NOT generate ideas similar to these IDs: ${exclude_ids.join(', ')}` : ''}`;

    const userPrompt = `Generate ${max_ideas} revenue-ready product ideas for this business concept: "${idea_text}"

${audience_tags && audience_tags.length > 0 ? `Target audience: ${audience_tags.join(', ')}` : ''}
${tone_tags && tone_tags.length > 0 ? `Tone preferences: ${tone_tags.join(', ')}` : ''}

Return a JSON object with this exact structure:
{
  "products": [
    {
      "id": "<generate a unique identifier>",
      "title": "<specific, clear product name 60 chars max>",
      "format": "<one of: Digital Guide, Template Pack, Workshop, Membership, 1:1 Service, Group Program, Challenge, Coaching Pack, Course, Toolkit>",
      "description": "<1-2 sentences: first sentence is outcome-focused (Help [who] achieve [result]), second sentence explains what's inside/how it works>"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    const productIdeas = JSON.parse(content);

    console.log('Generated product ideas:', productIdeas);

    return new Response(
      JSON.stringify(productIdeas),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-product-ideas:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate product ideas'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});