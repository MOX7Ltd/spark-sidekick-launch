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
    const primaryStyle = (styleFromClient || 'modern').toLowerCase();
    const { businessName, ideaText, context } = requestBody;
    
    // Extract context information if provided
    const brandContext = context || {};
    const dominantFamily = brandContext.dominant_family;
    const palette = brandContext.palette || [];
    
    // Build brand context card
    const brandCard = `
Brand Context
=============
Business: ${businessName}
Idea: ${ideaText || '(not provided)'}
Audience: ${brandContext.audience?.join(', ') || 'General'}
Tone: ${brandContext.tone_adjectives?.join(', ') || vibes.join(', ') || 'Neutral'}
Values: ${brandContext.bio ? brandContext.bio.substring(0, 150) : 'Professional, trustworthy'}
`.trim();
    
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
    
    const styleDescriptor = styleDescriptions[primaryStyle] || styleDescriptions.modern;
    
    // Tone hint (vibes influence color/emotion only)
    const toneHint = vibes.length
      ? `Tone hint: ${vibes.join(", ")} (influence color/emotion only; do not change the ${primaryStyle} style).`
      : "Tone hint: neutral, versatile.";
    
    // When to show the business name
    const nameStyles = new Set(["typography-first", "typography", "bold", "retro"]);
    const includeNameText = nameStyles.has(primaryStyle);
    
    let nameInstruction = "";
    if (includeNameText) {
      nameInstruction = `The logo must prominently feature the brand name "${businessName}" as a wordmark.`;
    } else {
      nameInstruction = `The logo should be symbol-first; include at least two symbol-only options. If a lockup is shown, use "${businessName}" minimally.`;
    }
    
    // Family-based motif bias
    const familyMotifs: Record<string, string> = {
      'Teach': 'progress indicators, learning paths, growth arcs, upward motion',
      'Digital': 'modular nodes, tech geometry, abstract connectivity, clean pixels',
      'Services': 'balanced forms, professional clarity, trust symbols, precision',
      'Physical': 'solid geometry, tangible shapes, material forms, crafted minimalism'
    };
    
    const motifHint = dominantFamily && familyMotifs[dominantFamily]
      ? `Consider these metaphorical forms: ${familyMotifs[dominantFamily]}.`
      : '';
    
    // Derive palette & tone guidance
    let paletteGuidance = '';
    if (palette.length > 0) {
      paletteGuidance = `Use these brand colors: ${palette.join(', ')}.`;
    } else {
      // Derive from tone
      const toneColors: Record<string, string> = {
        'visionary': 'modern blues or gradients',
        'educational': 'teal/yellow warmth',
        'friendly': 'warm neutrals',
        'bold': 'strong contrasts (black, orange, red)',
      };
      
      for (const vibe of vibes) {
        const vibeLower = vibe.toLowerCase();
        if (toneColors[vibeLower]) {
          paletteGuidance = `Palette & Tone: Suggest ${toneColors[vibeLower]}. Designers may tint/shade but stay within these tones.`;
          break;
        }
      }
      
      if (!paletteGuidance) {
        paletteGuidance = 'Palette & Tone: Use versatile, professional colors.';
      }
    }
    
    const designTarget = includeNameText
      ? `Design a logo for the business "${businessName}" focusing on the wordmark and lettering.`
      : `Design a single logo symbol that represents the essence of "${businessName}" without necessarily showing the name text.`;

    // Simplified variation plans based on style with symbol-first enforcement
    let variationPlans: string[];

    if (includeNameText) {
      // Typography-focused styles - MUST include business name
      variationPlans = [
        "Primary wordmark with strong letterforms",
        "Wordmark with minimal symbol accent",
        "Alternative weight/spacing exploration",
        "Integrated wordmark + icon device"
      ];
    } else {
      // Symbol-focused styles - at least 2 symbol-only variants
      variationPlans = [
        "Primary standalone symbol (no text)",
        "Symbol with minimal wordmark lockup",
        "Alternative symbol interpretation (no text)",
        "Symbol in badge or contained form"
      ];
    }

    // Create the primary prompt for all 4 variations with brand context
    const primaryPrompt = `${brandCard}

${designTarget}

Style: ${styleDescriptor}
${toneHint}
${nameInstruction}
${motifHint}
${paletteGuidance}
${ideaText ? `Business context: ${ideaText}` : ''}

Design Goals:
- Each image should depict a single logo concept (no collages or multiple marks)
- Vector-friendly, scalable, clean composition
- ${includeNameText ? 'Focus on lettering and wordmark' : 'Focus on symbolic mark first'}
- Avoid: photorealism, 3D effects, clip-art, busy compositions
- Ensure contrast and clarity at any size

Generate ONE logo concept per image (4 variations total).

Variation instructions:
${variationPlans.map((v, i) => `${i + 1}. ${v}`).join('\n')}

Remember: Generate 4 separate logo concepts, one per image. Each should be production-ready.`;

    console.log('Generating logos for:', businessName, 'with style:', primaryStyle, 'vibes:', vibes);
    if (dominantFamily) console.log('Dominant family:', dominantFamily);
    if (palette.length > 0) console.log('Brand palette:', palette);

    const basePrompt = `
${primaryPrompt}
Constraints:
- Clean vector-friendly form with flat color or simple gradient
- No photorealism, no 3D, no stock-icon look
- Only ONE logo per image (no multiple thumbnails, no collage)
- Each variation must be a single standalone logo, not multiple mock-ups or a grid in one image
`.trim();

    const prompts = variationPlans.map((plan, i) => `${basePrompt}
Variation ${i + 1}: ${plan}`);

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

    // Optional: Basic quality check
    const validLogos = logos.filter(logo => {
      // Check that base64 is reasonable size (not broken)
      return logo && logo.length > 1000 && logo.startsWith('data:image');
    });

    if (validLogos.length < 3) {
      console.warn(`[generate-logos] Only ${validLogos.length}/4 logos valid, may need retry`);
    }

    // Return valid logos (or all if most are valid)
    const finalLogos = validLogos.length >= 3 ? validLogos : logos;

    console.log('Generated', finalLogos.length, 'logos');

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      logos: finalLogos,
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
