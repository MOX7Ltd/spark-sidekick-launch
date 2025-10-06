import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry, x-idempotency-key, x-feature-flags',
};

console.log('[generate-logos] Function started and deployed successfully');

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || traceId;
  const featureFlags = parseFeatureFlags(req.headers);
  
  console.log(`[generate-logos] ${req.method} request - Session: ${sessionId}, Trace: ${traceId}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    
    // Use style from client as primary source of truth
    const styleFromClient = requestBody.style; // e.g., "playful"
    const vibes: string[] = Array.isArray(requestBody.vibes) ? requestBody.vibes : [];
    const primaryStyle = styleFromClient || 'modern';
    
    const { businessName } = requestBody;
    
    console.log('[generate-logos] Feature flags:', featureFlags);
    
    // Check for cached response
    const cachedResponse = await checkIdempotency(sessionId, idempotencyKey, 'logos');
    if (cachedResponse) {
      console.log('Returning cached logos for idempotency key:', idempotencyKey);
      return new Response(JSON.stringify({
        ...cachedResponse,
        deduped: true,
        idempotency_key: idempotencyKey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!businessName || typeof businessName !== 'string') {
      const durationMs = Math.round(performance.now() - startTime);
      return new Response(JSON.stringify({
        error: 'Business name is required',
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

    console.log('Generating logos for:', businessName, 'with style:', primaryStyle, 'and vibes:', vibes);

    // Strengthened style descriptions
    const styleDescriptions: Record<string, string> = {
      minimalist: "ultra-minimal, generous negative space, flat vector, crisp geometric shapes, 1–2 colors max, no gradients, no shadows, no 3D, no bevels, no mockups, high contrast, balanced symmetry, grid-aligned, scalable at 16px",
      playful: "friendly rounded shapes, simple mascot/icon hints, limited bright accents, flat vector, legible at small sizes",
      bold: "heavy shapes, strong contrast, simple silhouettes, flat vector, minimal details",
      "icon-based": "memorable symbol-first mark, simplified contours, flat vector, works at favicon size",
      icon: "memorable symbol-first mark, simplified contours, flat vector, works at favicon size",
      handdrawn: "clean hand-drawn lines, controlled irregularity, flat fills, limited palette",
      retro: "vintage motifs, simplified forms, subtle grain allowed, flat colors (no heavy textures)",
      "modern-gradient": "modern with *subtle* gradient accents only, otherwise flat, clean edges",
      gradient: "modern with *subtle* gradient accents only, otherwise flat, clean edges",
      "typography-first": "wordmark-first, custom letterforms, careful kerning, smart ligatures, strong spacing discipline",
      typography: "wordmark-first, custom letterforms, careful kerning, smart ligatures, strong spacing discipline",
      modern: "modern, clean, versatile"
    };

    const styleDescriptor = styleDescriptions[primaryStyle.toLowerCase()] || styleDescriptions.modern;
    
    // Derive initials from business name
    const words = businessName.trim().split(/\s+/);
    const initials = words.slice(0, 3).map(w => w[0]?.toUpperCase() || '').join('');
    
    // Use vibes as tone hints only
    const toneHint = vibes.length ? vibes.join(', ') : 'professional';
    
    // Default brand palette
    const palette = 'navy #0A2342 and teal #2EC4B6';
    
    // Name handling policy based on style
    function nameInstructionFor(style: string, businessName: string, initials: string): string {
      switch (style.toLowerCase()) {
        case "typography":
        case "typography-first":
        case "bold":
        case "retro":
          return `Primary focus is a refined wordmark of "${businessName}". Keep it clean and professional. No decorative effects. Icon optional and must be subordinate.`;
        case "icon-based":
        case "icon":
        case "minimalist":
        case "playful":
        case "gradient":
        case "modern-gradient":
          return `Design the logo to work as a standalone icon with NO full business name. If you include letters, restrict to an optional small monogram ("${initials}") that is secondary. Do not typeset "${businessName}" as large text.`;
        default:
          return `Logo must support a standalone icon. If text appears, it must be subtle and never dominate.`;
      }
    }
    
    const nameInstruction = nameInstructionFor(primaryStyle, businessName, initials);

    // Clearer creative variation axes
    const variationPlans = [
      `Icon-only, centered, simple abstract symbol related to the domain. Flat 1–2 colors. No text.`,
      `Icon-only, negative-space trick. Monochrome. No text.`,
      `Monogram variant using initials only (e.g., "${initials}") inside a simple geometric container. No full name.`,
      `Compact icon with subtle motion cue. Flat vector. Optional tiny monogram only if it enhances balance. No full name.`
    ];

    // New prompt template for each variation
    const prompts = variationPlans.map((variationPlan, i) => `Design a professional logo for the business "${businessName}".

STYLE
- ${styleDescriptor}
- Tone hint: ${toneHint} (influence mood only; do not override the style)

NAME POLICY
- ${nameInstruction}

COLOR & OUTPUT
- Use this palette or close relatives: ${palette}. Prefer 1–2 colors; ensure high contrast.
- Flat vector look. No gradients for minimalist. No shadows, bevels, 3D, textures, or mockups.
- Deliver a clean, centered logo on a square canvas, generous padding, transparent or white background.

COMPOSITION & QUALITY
- Crisp edges, balanced symmetry, simple geometry. Legible at favicon size.
- Avoid dense details, tiny text, photo elements, clip-art, badges, ribbons, crests, watermarks, stock icons.

VARIATION PLAN
- ${variationPlan}

Return only the image.`);

    // Generate 4 logos only
    const logoPromises = prompts.map(async (prompt) => {

      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          modalities: ['image', 'text']
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Lovable AI API error:', error);
        throw new Error(`Lovable AI API error: ${error}`);
      }

      const data = await response.json();
      
      // Gemini returns base64 in images array
      if (data.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
        return data.choices[0].message.images[0].image_url.url;
      }
      
      throw new Error('Invalid response format from Lovable AI');
    });

    const logos = await Promise.all(logoPromises);

    console.log('Generated', logos.length, 'logos');

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      logos,
      styleUsed: primaryStyle,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      feature_flags: featureFlags,
      payload_keys: ['businessName', 'style', 'vibes'],
      vibes_used: vibes,
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, 'logos', requestHash, responseData);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('Error in generate-logos function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate logos';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      feature_flags: featureFlags,
      ok: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
