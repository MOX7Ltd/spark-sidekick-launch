import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { calculateCost, logAIUsage } from '../_shared/ai-tracking.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { idea, family, audienceHints = [], business_context = {} } = await req.json();

    if (!idea || !family) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: idea, family' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Price bands by family
    const priceBands: Record<string, { low: number; high: number }> = {
      checklist: { low: 5, high: 29 },
      guide: { low: 9, high: 49 },
      session: { low: 40, high: 200 },
      course: { low: 25, high: 149 },
      template: { low: 7, high: 39 },
      email: { low: 15, high: 99 },
      video: { low: 9, high: 59 },
      bundle: { low: 19, high: 99 },
    };

    const band = priceBands[family] || { low: 10, high: 50 };

    const systemPrompt = `You are a product strategist helping coaches and consultants turn ideas into sellable digital products.

CRITICAL RULES:
- Generate 3-5 distinct product concepts
- Focus on outcomes, not features
- Price confidently in the £${band.low}-£${band.high} range for ${family} products
- Each concept must be viable to ship in 1-2 weeks
- Be specific about deliverables
- Think about effort realistically (low/medium/high)

Return ONLY valid JSON with this structure:
{
  "concepts": [
    {
      "title": "Clear, benefit-focused product name",
      "summary": "One compelling sentence about the outcome",
      "deliverables": ["Specific item 1", "Specific item 2", "Specific item 3"],
      "format": "download|video|session|course|template|bundle",
      "effort_estimate": "low|medium|high",
      "price_model": "one-off|subscription|tiered",
      "price_rec_low": ${band.low},
      "price_rec_high": ${band.high},
      "upsells": ["Optional: related product ideas"],
      "cross_sells": ["Optional: complementary offers"],
      "risks": ["Optional: common pitfalls to avoid"]
    }
  ]
}`;

    const userPrompt = `Product idea: "${idea}"
Product family: ${family}
${audienceHints.length > 0 ? `Audience hints: ${audienceHints.join(', ')}` : ''}
${business_context.name ? `Business: ${business_context.name}` : ''}

Generate 3-5 product concepts that are:
- Outcomes-focused (what the customer achieves)
- Specific and actionable
- Realistic to create in 1-2 weeks
- Priced for value (premium positioning)`;

    console.log('Calling Lovable AI for product concepts...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
        temperature: 0.9,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limits exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service payment required. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content);
      throw new Error('Invalid AI response format');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and ensure price bands
    if (result.concepts) {
      result.concepts = result.concepts.map((concept: any) => ({
        ...concept,
        price_rec_low: concept.price_rec_low || band.low,
        price_rec_high: concept.price_rec_high || band.high,
        format: concept.format || family,
        effort_estimate: concept.effort_estimate || 'medium',
        price_model: concept.price_model || 'one-off'
      }));
    }

    console.log('Successfully generated', result.concepts?.length || 0, 'concepts');

    // Log AI cost tracking
    if (aiData.usage) {
      const tokensIn = aiData.usage.prompt_tokens || 0;
      const tokensOut = aiData.usage.completion_tokens || 0;
      const costUsd = calculateCost('google/gemini-2.5-flash', tokensIn, tokensOut);
      const durationMs = Math.round(performance.now() - startTime);
      await logAIUsage(supabaseUrl, supabaseServiceKey, {
        sessionId,
        functionName: 'generate-product-concepts',
        model: 'google/gemini-2.5-flash',
        tokensIn,
        tokensOut,
        costUsd,
        durationMs,
        requestType: 'product_concepts',
        metadata: { idea, family },
      });
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-product-concepts:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check function logs for more information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
