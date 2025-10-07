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
    
    const styleFromClient = requestBody.style;
    const vibes: string[] = Array.isArray(requestBody.vibes) ? requestBody.vibes : [];
    const primaryStyle = styleFromClient || 'modern';
    const { businessName, ideaText } = requestBody;
    
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

    console.log('Generating logos for:', businessName, 'with style:', primaryStyle, 'vibes:', vibes);

    // Explicit style descriptions map
    const styleDescriptions: Record<string, string> = {
      minimalist: "minimalist, lots of negative space, clean geometric forms, simple iconography, limited color palette",
      playful: "playful, rounded forms, friendly shapes, lively motion cues, vibrant accents",
      bold: "bold, heavy weight shapes, strong contrast, assertive composition, punchy silhouettes",
      "icon-based": "icon-led, memorable symbol first, scalable mark, simplified contours, subtle wordmark",
      icon: "icon-led, memorable symbol first, scalable mark, simplified contours, subtle wordmark",
      handdrawn: "hand-drawn, organic lines, human warmth, imperfect strokes",
      retro: "retro, vintage motifs, classic forms, nostalgic colorways",
      "modern-gradient": "modern with soft gradient accents, smooth shapes",
      gradient: "modern with soft gradient accents, smooth shapes",
      "typography-first": "wordmark-first, custom letterforms, good kerning, subtle typographic flair",
      typography: "wordmark-first, custom letterforms, good kerning, subtle typographic flair",
      modern: "modern, clean, versatile"
    };
    
    const styleKey = (primaryStyle || 'modern').toLowerCase();
    const styleDescriptor = styleDescriptions[styleKey] || styleDescriptions.modern;
    
    // Tone hint (vibes influence color/emotion only)
    const toneHint = vibes.length
      ? `Tone hint: ${vibes.join(", ")} (influence color/emotion only; do not change the ${primaryStyle} style).`
      : "Tone hint: neutral, versatile.";
    
    // Business-name usage rules (only render name for typography-led styles)
    const nameStyles = new Set(["typography-first", "typography", "bold", "retro"]);
    const includeNameText = nameStyles.has(styleKey);
    
    let nameInstruction = "";
    if (includeNameText) {
      nameInstruction = `The logo must prominently feature the brand name "${businessName}" as a wordmark.`;
    } else {
      nameInstruction = `The logo can be symbol-first; include standalone icon options. If a lockup is shown, use "${businessName}" minimally.`;
    }
    
    const designTarget = includeNameText
      ? `Design a logo concept for the business "${businessName}".`
      : `Design a logo concept for "${businessName}" that visually represents its essence without necessarily rendering the name text.`;

    // Style-specific variation plans
    let variationPlans: string[] = [];
    switch (styleKey) {
      // WORDMARK-LED families → all show the name in various treatments
      case "typography-first":
      case "typography":
      case "bold":
      case "retro":
        variationPlans = [
          "Wordmark-first layout; explore strong letterforms and spacing",
          "Wordmark with subtle monogram/initial accent (small symbol)",
          "Stacked wordmark (two-line) exploring weight contrast",
          "Integrated wordmark with a minimal geometric/negative-space device"
        ];
        break;

      // SYMBOL-LED families → mix of symbol-only and simple lockups
      case "icon-based":
      case "icon":
      case "playful":
      case "minimalist":
      case "modern-gradient":
      case "gradient":
      case "handdrawn":
        variationPlans = [
          "Standalone symbol (no text) using abstract geometric motifs",
          "Symbol above small wordmark lockup (balanced proportions)",
          "Symbol left of wordmark (horizontal lockup)",
          "Symbol-only monogram or negative-space exploration"
        ];
        break;

      // Fallback (modern)
      default:
        variationPlans = [
          "Icon above wordmark (primary composition)",
          "Icon left of wordmark (secondary composition)",
          "Standalone icon (no wordmark)",
          "Integrated icon + wordmark with minimal overlap"
        ];
    }

    const basePrompt = `
${designTarget}
Style: ${styleDescriptor}.
${ideaText ? `Business focus (consider this more than the name): ${ideaText}` : ''}
${toneHint}
${nameInstruction}
Constraints: Keep all 4 variants within the same ${primaryStyle} style. Logos must be vector-friendly, scalable, and professional.
`.trim();

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
