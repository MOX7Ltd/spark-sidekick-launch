import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';
import { normalizeOnboardingInput } from '../_shared/normalize.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry, x-idempotency-key, x-feature-flags',
};

const requestSchema = z.object({
  idea_text: z.string().min(10),
  audience_tags: z.array(z.string()).min(1).default(['General']),
  tone_tags: z.array(z.string()).min(1).default(['Friendly']),
  max_ideas: z.number().min(1).max(10).default(5),
  exclude_ids: z.array(z.string()).optional(),
  smart_family_gen: z.boolean().optional().default(true),
});

console.log('[generate-product-ideas] Function started and deployed successfully');

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || traceId;
  const featureFlags = parseFeatureFlags(req.headers);
  
  console.log(`[generate-product-ideas] ${req.method} request - Session: ${sessionId}, Trace: ${traceId}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Check for cached response
    const cachedResponse = await checkIdempotency(sessionId, idempotencyKey, 'product-ideas');
    if (cachedResponse) {
      console.log('Returning cached response for idempotency key:', idempotencyKey);
      return new Response(JSON.stringify({
        ...cachedResponse,
        deduped: true,
        idempotency_key: idempotencyKey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Validate input
    const validationResult = requestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const durationMs = Math.round(performance.now() - startTime);
      return new Response(JSON.stringify({
        error: 'Invalid input',
        field_errors: validationResult.error.flatten().fieldErrors,
        trace_id: traceId,
        session_id: sessionId,
        idempotency_key: idempotencyKey,
        duration_ms: durationMs,
        ok: false,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { idea_text, audience_tags, tone_tags, max_ideas, exclude_ids = [], smart_family_gen } = validationResult.data;
    
    // Normalize inputs with defaults
    const normalized = normalizeOnboardingInput({
      audiences: audience_tags,
      vibes: tone_tags,
      products: []
    });
    
    console.log('Generating product ideas for:', idea_text);

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Legacy system prompt for backward compatibility
    const legacySystemPrompt = `You are generating preview product ideas for a storefront. The user already has a monetizable idea.
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

    // Smart family-aware system prompt
    const smartFamilySystemPrompt = `You are an expert product strategist helping new entrepreneurs turn their idea into sellable products.

The user will provide a short business concept.  
Analyze the description carefully and infer what kinds of products best fit that concept.

You can generate ideas from any of these four product families:
1. Digital — downloadable files, templates, toolkits, eBooks, planners, guides, workbooks, checklists
2. Teach — courses, coaching programs, workshops, memberships, challenges, masterclasses, bootcamps
3. Services — done-for-you or 1:1 offerings, consulting, creative services, audits, strategy sessions
4. Physical — tangible products, kits, merchandise, bundles, supplies, materials

Rules:
- Generate exactly ${max_ideas} unique, revenue-ready products the user could sell
- You may choose any mix of families (e.g. all digital, 2 digital + 2 teach, etc.) depending on what fits best
- Each idea must be achievable by an individual or small business
- Avoid repetition and generic "bundle" filler ideas
- Be concise: no emojis, no hashtags, no prices
- Descriptions: first sentence = outcome/result, second = what's inside/how it works
- Names must sound real and brand-neutral
${exclude_ids.length > 0 ? `- Do NOT generate ideas similar to previously rejected ones` : ''}

Return a JSON object with this exact structure:
{
  "products": [
    {
      "id": "unique-identifier",
      "category": "Digital | Teach | Services | Physical",
      "format": "Specific format from that category",
      "title": "Clear, specific product name (≤60 chars)",
      "description": "1-2 sentences: outcome-focused, then what's included"
    }
  ]
}

Critical Rules:
- Each product MUST include an id field (use short unique strings)
- Each product MUST include a category field
- Choose formats that make sense for the category
- Focus on practical, monetizable offerings
- Ensure diversity across the ${max_ideas} products`;

    const finalSystemPrompt = smart_family_gen ? smartFamilySystemPrompt : legacySystemPrompt;
    
    console.log('[generate-product-ideas] Feature flags:', featureFlags);
    console.log('[generate-product-ideas] Using smart family generation:', smart_family_gen);

    const userPrompt = smart_family_gen
      ? `Generate ${max_ideas} monetizable product ideas for this business concept:
"${idea_text}"

${normalized.audiences && normalized.audiences.length > 0 ? `Target audience: ${normalized.audiences.join(', ')}` : ''}
${normalized.vibes && normalized.vibes.length > 0 ? `Desired tone/style: ${normalized.vibes.join(', ')}` : ''}

Infer which product families (Digital, Teach, Services, Physical) best fit this concept.
If unsure, choose the most likely families based on common-sense reasoning.

Return a JSON object matching the schema with category field included.`
      : `Generate ${max_ideas} revenue-ready product ideas for this business concept: "${idea_text}"

${normalized.audiences && normalized.audiences.length > 0 ? `Target audience: ${normalized.audiences.join(', ')}` : ''}
${normalized.vibes && normalized.vibes.length > 0 ? `Tone preferences: ${normalized.vibes.join(', ')}` : ''}

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
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: finalSystemPrompt },
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

    // Ensure all products have IDs (fallback if AI doesn't generate them)
    if (productIdeas.products && Array.isArray(productIdeas.products)) {
      productIdeas.products = productIdeas.products.map((product: any, index: number) => ({
        ...product,
        id: product.id || `product-${Date.now()}-${index}`
      }));
    }

    console.log('Generated product ideas:', productIdeas);

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      ...productIdeas,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      applied_defaults: normalized.appliedDefaults.length > 0 ? normalized.appliedDefaults : undefined,
      feature_flags: featureFlags,
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, 'product-ideas', requestHash, responseData);
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('Error in generate-product-ideas:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate product ideas',
        trace_id: traceId,
        session_id: sessionId,
        idempotency_key: idempotencyKey,
        duration_ms: durationMs,
        ok: false,
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});