import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';

// Domain keyword extraction helper
function extractDomainTokens(input: string | undefined): string[] {
  if (!input) return [];
  const text = input.toLowerCase();
  const stop = new Set(['the','and','for','with','your','of','to','in','on','at','by','from','a','an','&','co','academy','institute','company','studio','llc','inc','ltd']);
  return Array.from(
    new Set(
      text
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w && w.length > 2 && !stop.has(w))
    )
  ).slice(0, 12); // cap for prompt brevity
}

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
    
    const { businessName, brand_context } = requestBody;
    
    // Sanitize brand_context
    const toHexArray = (v: any) =>
      Array.isArray(v) 
        ? v.filter((x: any) => typeof x === 'string')
        : v && typeof v === 'object' 
          ? Object.values(v).filter((x: any) => typeof x === 'string')
          : undefined;
    
    const brandCtx = brand_context ? {
      idea_text: brand_context.idea_text || undefined,
      bio: brand_context.bio || undefined,
      audience: (typeof brand_context.audience === 'string' && brand_context.audience.trim()) || undefined,
      tone_tags: Array.isArray(brand_context.tone_tags) ? brand_context.tone_tags : undefined,
      brand_colors: toHexArray(brand_context.brand_colors),
      tagline: brand_context.tagline || undefined
    } : undefined;
    
    console.log('[generate-logos] Feature flags:', featureFlags);
    
    // Create enhanced idempotency key that includes brand context
    const contextHash = await hashRequest({ brand_context: brandCtx, style: primaryStyle });
    const enhancedIdempotencyKey = `${idempotencyKey}-${contextHash}`;
    
    // Check for cached response
    const cachedResponse = await checkIdempotency(sessionId, enhancedIdempotencyKey, 'logos');
    if (cachedResponse) {
      console.log('Returning cached logos for idempotency key:', enhancedIdempotencyKey);
      return new Response(JSON.stringify({
        ...cachedResponse,
        deduped: true,
        idempotency_key: enhancedIdempotencyKey,
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
        idempotency_key: enhancedIdempotencyKey,
        duration_ms: durationMs,
        ok: false,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract domain tokens from context
    const domainTokens = extractDomainTokens(
      [brandCtx?.idea_text, brandCtx?.bio].filter(Boolean).join(' ')
    );

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
    
    // Use vibes and brand context for tone hints
    const toneHint = (brandCtx?.tone_tags || vibes || []).join(', ') || 'professional';
    
    // Use brand colors if available
    const palette = (brandCtx?.brand_colors || []).length > 0 
      ? (brandCtx?.brand_colors || []).join(', ')
      : 'navy #0A2342 and teal #2EC4B6';
    
    console.log('Generating logos for:', businessName, 'with style:', primaryStyle, 'and vibes:', vibes);
    console.log('[logos] style=', primaryStyle, 'initials=', initials);
    console.log('[logos] context=', { 
      idea: brandCtx?.idea_text, 
      audience: brandCtx?.audience, 
      tone: toneHint, 
      colors: palette, 
      tokens: domainTokens 
    });
    
    // Build context lines for the prompt
    const contextLines = [
      brandCtx?.idea_text ? `- idea: ${brandCtx.idea_text}` : null,
      brandCtx?.bio ? `- bio/positioning: ${brandCtx.bio}` : null,
      brandCtx?.audience ? `- audience: ${brandCtx.audience}` : null,
      domainTokens.length ? `- domain tokens: ${domainTokens.join(', ')}` : null,
      `- tone: ${toneHint}`,
      `- palette: ${palette}`
    ].filter(Boolean).join('\n');
    
    // Name handling policy based on style
    function nameInstructionFor(style: string, businessName: string, initials: string): string {
      switch (style.toLowerCase()) {
        case "typography":
        case "typography-first":
        case "bold":
        case "retro":
          return `Wordmark can be primary, but create a companion icon rooted in the domain cues.`;
        case "icon-based":
        case "icon":
        case "minimalist":
        case "playful":
        case "gradient":
        case "modern-gradient":
        case "handdrawn":
        case "modern":
          return `Icon-first. NO full business name in the icon-only variants; a small monogram ("${initials}") is optional and must be secondary.`;
        default:
          return `Icon-first. Wordmark optional and secondary.`;
      }
    }
    
    const nameInstruction = nameInstructionFor(primaryStyle, businessName, initials);

    // Variation plans - domain-driven concepts
    const variationPlans = [
      `Icon-only derived from domain tokens (no text).`,
      `Icon-only negative-space/geometry concept from domain tokens (no text).`,
      `Monogram: subtle initials integrated into a domain motif (no full name).`,
      `Icon + micro-lockup: compact icon plus a very small wordmark; icon dominates.`
    ];

    // Enhanced prompt template for each variation
    const prompts = variationPlans.map((variationPlan, i) => {
      const domainGuidance = domainTokens.length 
        ? `Derive the icon's motif from these domain cues: ${domainTokens.join(', ')}`
        : `If domain cues are unclear, favor abstract geometric forms suggesting the domain broadly; do not invent generic business icons.`;
      
      return `Design a professional logo for "${businessName}".

BRAND CONTEXT (use all signals)
${contextLines}
- Treat suffix words (e.g., Academy/Co/Studio) as labels only. Do NOT let them drive the visual concept.

STYLE
- ${styleDescriptor}
- Keep the chosen style consistent across all variants.

NAME POLICY
- ${nameInstruction}

PRIMARY DIRECTION — DOMAIN FIRST
- ${domainGuidance}

COLOR & OUTPUT
- Flat vector; 1–2 colors; high contrast.
- No shadows, bevels, 3D, textures, or mockups.
- Centered on a square canvas; transparent or white background.
- Icon must be legible at 16–24 px.

COMPOSITION
- Crisp, simple geometry; balanced symmetry; avoid clutter.

VARIATION PLAN
- ${variationPlan}

Return only the image.`;
    });

    // Icon-led styles that must not have full business name
    const iconFirstStyles = new Set(['icon-based', 'icon', 'minimalist', 'playful', 'gradient', 'modern-gradient', 'handdrawn', 'modern']);
    const isIconFirst = iconFirstStyles.has(primaryStyle.toLowerCase());
    
    // Generate 4 logos with retry logic for text violations
    const logoPromises = prompts.map(async (prompt, index) => {
      const generateLogo = async (promptText: string, attempt: number = 1): Promise<string> => {
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
                content: promptText
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
          const imageUrl = data.choices[0].message.images[0].image_url.url;
          
          // For icon-first styles on first 2 variants, retry once if we detect issues
          // (This is a heuristic; actual text detection would require image analysis)
          if (isIconFirst && index < 2 && attempt === 1) {
            // Retry with stronger prompt
            const retryPrompt = `${promptText}\n\nHARD REQUIREMENT: This variant must be icon-only (no full business name).`;
            console.log(`[logos] Re-prompting variant ${index + 1} for text violation`);
            return generateLogo(retryPrompt, 2);
          }
          
          return imageUrl;
        }
        
        throw new Error('Invalid response format from Lovable AI');
      };
      
      return generateLogo(prompt);
    });

    const logos = await Promise.all(logoPromises);

    console.log('Generated', logos.length, 'logos');

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      logos,
      styleUsed: primaryStyle,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: enhancedIdempotencyKey,
      duration_ms: durationMs,
      feature_flags: featureFlags,
      payload_keys: ['businessName', 'style', 'vibes', 'brand_context'],
      vibes_used: vibes,
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, enhancedIdempotencyKey, 'logos', requestHash, responseData);
    
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
