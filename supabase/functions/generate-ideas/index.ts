import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id',
};

const requestSchema = z.object({
  input_text: z.string().min(10),
  brand_context: z.object({
    business_name: z.string().optional(),
    tagline: z.string().optional(),
    bio: z.string().optional(),
    brand_colors: z.array(z.string()).optional(),
    audience: z.string().optional(),
    tone_tags: z.array(z.string()).optional(),
  }).optional(),
  max_ideas: z.number().min(8).max(12).default(12),
});

const ideaCardSchema = z.object({
  title: z.string(),
  type: z.enum(['digital', 'course', 'service', 'physical']),
  promise: z.string(),
  who: z.string(),
  what_to_upload: z.array(z.string()),
  listing_copy: z.object({
    subtitle: z.string(),
    benefits: z.array(z.string()).max(5),
    faq: z.array(z.string()).max(3),
    seo_keywords: z.array(z.string()).max(6),
  }),
  price_band: z.object({
    low: z.number(),
    mid: z.number(),
    high: z.number(),
  }),
  fulfillment_notes: z.string(),
  risk_flags: z.array(z.enum(['claims', 'regulated', 'shipping', 'returns'])),
  next_step_checklist: z.array(z.string()),
  score: z.object({
    effort: z.number().min(1).max(5),
    value: z.number().min(1).max(5),
    fit: z.number().min(1).max(5),
  }),
});

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  
  console.log(`[generate-ideas] ${req.method} request - Session: ${sessionId}, Trace: ${traceId}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    const validationResult = requestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      return new Response(JSON.stringify({
        error: 'Invalid input',
        field_errors: validationResult.error.flatten().fieldErrors,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { input_text, brand_context, max_ideas } = validationResult.data;
    
    console.log('[generate-ideas] Generating ideas for:', input_text.substring(0, 100));

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const brandTokens = brand_context ? JSON.stringify({
      business_name: brand_context.business_name || 'Your Business',
      tagline: brand_context.tagline || '',
      bio: brand_context.bio || '',
      brand_colors: brand_context.brand_colors || [],
      audience: brand_context.audience || '',
      tone: (brand_context.tone_tags || []).join(', ') || 'Professional, Helpful'
    }) : '{}';

    const constraints = JSON.stringify({
      exclude_categories: ['medical', 'weapons', 'gambling', 'adult'],
      shipping_region_default: 'NZ'
    });

    const systemPrompt = `You generate an array of Idea Cards for a creator. Return ONLY JSON (no prose).

INPUTS
- Niche & context: <<<${input_text}>>>
- Brand tokens: ${brandTokens}
- Constraints: ${constraints}

RULES
- ${max_ideas} ideas total, max 3 per type: digital|course|service|physical.
- Each idea MUST match the IdeaCard schema exactly.
- benefits ≤5, faq ≤3, seo_keywords ≤6.
- price_band is a suggestion; no earnings promises.
- Add risk_flags where applicable (claims/regulated/shipping/returns).
- Return strictly valid JSON array of IdeaCard objects and nothing else.

IdeaCard Schema:
{
  "title": "string (clear product name, 60 chars max)",
  "type": "digital|course|service|physical",
  "promise": "string (outcome-focused value prop)",
  "who": "string (target audience)",
  "what_to_upload": ["string (items creator needs to provide)"],
  "listing_copy": {
    "subtitle": "string",
    "benefits": ["string (max 5)"],
    "faq": ["string (max 3)"],
    "seo_keywords": ["string (max 6)"]
  },
  "price_band": {"low": number, "mid": number, "high": number},
  "fulfillment_notes": "string (how product is delivered)",
  "risk_flags": ["claims|regulated|shipping|returns"],
  "next_step_checklist": ["string (action items)"],
  "score": {"effort": 1-5, "value": 1-5, "fit": 1-5}
}`;

    const userPrompt = `Generate ${max_ideas} revenue-ready product ideas based on the context provided. Return a JSON array of IdeaCard objects.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
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
      console.error('[generate-ideas] AI error:', response.status, errorText);
      
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
    let parsed = JSON.parse(content);
    
    // Handle both { ideas: [...] } and direct array formats
    const ideasArray = Array.isArray(parsed) ? parsed : (parsed.ideas || []);

    // Validate each idea card
    const validatedIdeas = ideasArray
      .map((idea: any) => {
        const result = ideaCardSchema.safeParse(idea);
        if (!result.success) {
          console.warn('[generate-ideas] Invalid idea card:', result.error);
          return null;
        }
        return result.data;
      })
      .filter(Boolean);

    console.log('[generate-ideas] Generated', validatedIdeas.length, 'valid ideas');

    const durationMs = Math.round(performance.now() - startTime);
    return new Response(
      JSON.stringify({
        ideas: validatedIdeas,
        trace_id: traceId,
        session_id: sessionId,
        duration_ms: durationMs,
        ok: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('[generate-ideas] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate ideas',
        trace_id: traceId,
        session_id: sessionId,
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
