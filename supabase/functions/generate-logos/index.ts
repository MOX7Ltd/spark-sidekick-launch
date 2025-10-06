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

    // Expanded style descriptions map (must match frontend IDs)
    const styleDescriptions: Record<string, string> = {
      minimalist: "minimalist, lots of negative space, clean geometric forms, simple iconography, limited color palette",
      playful: "playful, rounded forms, bubbly shapes, friendly iconography, lively motion cues, vibrant color accents",
      bold: "bold, heavy weight shapes, strong contrast, assertive composition, high legibility, punchy silhouettes",
      "icon-based": "icon-led, memorable symbol first, scalable mark, simplified contours, balanced with subtle wordmark",
      icon: "icon-led, memorable symbol first, scalable mark, simplified contours, balanced with subtle wordmark",
      handdrawn: "hand-drawn, sketch texture, organic lines, human warmth, imperfect strokes, approachable feel",
      retro: "retro, vintage motifs, classic typography, nostalgic colorways, subtle grain",
      "modern-gradient": "modern with gradient accents, soft blends, contemporary color transitions, smooth shapes",
      gradient: "modern with gradient accents, soft blends, contemporary color transitions, smooth shapes",
      "typography-first": "wordmark-first, custom letterforms, kerning care, smart ligatures, subtle typographic flair",
      typography: "wordmark-first, custom letterforms, kerning care, smart ligatures, subtle typographic flair",
      modern: "modern, clean, versatile"
    };

    const styleDescriptor = styleDescriptions[primaryStyle.toLowerCase()] || styleDescriptions.modern;
    
    // Use vibes as tone hints only (do not override style)
    const toneHint = vibes.length
      ? `Tone hint: ${vibes.join(", ")} (influence color/emotion only; do not change the ${primaryStyle} style).`
      : "Tone hint: neutral, versatile.";
    
    // Conditional business name handling based on style
    let nameInstruction = "";
    const normalizedStyle = primaryStyle.toLowerCase();
    
    switch (normalizedStyle) {
      case "typography-first":
      case "typography":
      case "bold":
      case "retro":
        nameInstruction = `The logo must prominently feature the brand name "${businessName}" as a wordmark.`;
        break;
      case "icon-based":
      case "icon":
      case "playful":
      case "minimalist":
      case "modern-gradient":
      case "gradient":
      case "handdrawn":
        nameInstruction = `The logo should include at least one variant as a standalone icon (no text), and one variant where the icon is paired with the brand name "${businessName}" in a balanced lockup.`;
        break;
      default:
        nameInstruction = `The logo may use the brand name "${businessName}" in some variants, but should also support a standalone mark.`;
    }

    // Generate exactly 4 style-consistent variations with structured axes
    const variationPlans = [
      "Lockup: icon above wordmark; Color: primary palette; Motif: literal/obvious",
      "Lockup: icon left of wordmark; Color: secondary palette; Motif: abstract symbol",
      "Lockup: standalone icon (no wordmark); Color: monochrome; Motif: monogram/initial",
      "Lockup: integrated wordmark (typography-first emphasis); Color: accent highlight; Motif: negative space trick"
    ];

    const basePrompt = `Design a logo concept for the business "${businessName}".
Style: ${styleDescriptor}.
${toneHint}
${nameInstruction}
Constraints: Keep all 4 variants within the same ${primaryStyle} style. Logos must be vector-friendly, scalable, and professional.`;

    const prompts = variationPlans.map((plan, i) => `${basePrompt}
Variation plan ${i + 1}: ${plan}`);

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
