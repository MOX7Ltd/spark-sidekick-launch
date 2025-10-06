import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';
import { normalizeOnboardingInput, shouldIncludeName } from '../_shared/normalize.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry, x-idempotency-key, x-feature-flags',
};

// Canonical schema with backwards compatibility
const requestSchema = z.object({
  idea: z.string().min(10),
  audiences: z.array(z.string()).min(1),
  vibes: z.array(z.string()).min(1),
  aboutYou: z.object({
    firstName: z.string(),
    lastName: z.string(),
    expertise: z.string(),
    motivation: z.string().optional(),
    includeFirstName: z.boolean(),
    includeLastName: z.boolean(),
  }),
  products: z.array(z.object({
    id: z.string(),
    title: z.string(),
    format: z.string(),
    description: z.string(),
  })).optional(),
  bannedWords: z.array(z.string()).default([]),
  rejectedNames: z.array(z.string()).default([]),
  regenerateNamesOnly: z.boolean().default(false),
  regenerateSingleName: z.boolean().default(false),
}).or(
  // Backwards compatibility for old payloads
  z.object({
    idea: z.string().min(10),
    audience: z.string().optional(), // old single string
    tone: z.string().optional(), // old single tone
    experience: z.string().optional(),
    motivation: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    includeFirstName: z.boolean().optional(),
    includeLastName: z.boolean().optional(),
    styleCategory: z.string().optional(),
    bannedWords: z.array(z.string()).optional(),
    rejectedNames: z.array(z.string()).optional(),
    regenerateNamesOnly: z.boolean().optional(),
    regenerateSingleName: z.boolean().optional(),
  }).passthrough()
);

// Rate Limiting
const requestCounts: { [key: string]: number } = {};
const RATE_LIMIT_WINDOW = 60000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 20;

function rateLimit(sessionId: string): boolean {
  if (!requestCounts[sessionId]) {
    requestCounts[sessionId] = 0;
    setTimeout(() => {
      delete requestCounts[sessionId];
    }, RATE_LIMIT_WINDOW);
  }

  requestCounts[sessionId]++;
  return requestCounts[sessionId] > RATE_LIMIT_MAX_REQUESTS;
}

console.log('[generate-identity] Function started and deployed successfully');

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || traceId;
  const featureFlags = parseFeatureFlags(req.headers);
  
  console.log(`[generate-identity] ${req.method} request - Session: ${sessionId}, Trace: ${traceId}`);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-identity] Feature flags:', featureFlags);
    
    // Check for cached response
    const cachedResponse = await checkIdempotency(sessionId, idempotencyKey, 'business-identity');
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

    // Rate limiting
    if (rateLimit(sessionId)) {
      console.warn('Rate limit exceeded for session:', sessionId);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = requestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      console.warn('Invalid input:', validationResult.error);
      return new Response(JSON.stringify({
        error: 'Invalid input',
        field_errors: validationResult.error.flatten().fieldErrors,
        trace_id: traceId,
        session_id: sessionId,
        idempotency_key: idempotencyKey,
        ok: false,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Normalize inputs with defaults and backwards compat
    const normalized = normalizeOnboardingInput(validationResult.data);
    const {
      idea,
      audiences,
      vibes,
      aboutYou,
      products,
      bannedWords,
      rejectedNames,
      regenerateNamesOnly,
      appliedDefaults,
    } = normalized;
    
    // Extract regenerateSingleName flag
    const regenerateSingleName = validationResult.data.regenerateSingleName ?? false;

    // Extract tone for prompts
    const primaryTone = vibes[0] ?? 'friendly';
    const toneHints = vibes.slice(1);
    const audienceStr = audiences.join(', ');

    console.log('[generate-identity] Normalized input:', { 
      audiences, 
      vibes, 
      primaryTone, 
      toneHints,
      bannedWords: bannedWords.length,
      rejectedNames: rejectedNames.length,
    });

    // Build name prompt with constraints
    const nameInfo = shouldIncludeName(aboutYou);
    const nameCount = regenerateSingleName ? 2 : 6; // Generate fewer for single regeneration
    let namePrompt = `Generate ${nameCount} business names for: ${idea}.\nTarget audience: ${audienceStr}.\nTone: ${primaryTone}`;
    
    if (toneHints.length > 0) {
      namePrompt += ` with hints of ${toneHints.join(', ')}`;
    }

    if (nameInfo.includeFirst || nameInfo.includeLast) {
      const nameParts = [];
      if (nameInfo.includeFirst) nameParts.push(nameInfo.firstName);
      if (nameInfo.includeLast) nameParts.push(nameInfo.lastName);
      namePrompt += `\nInclude the name: ${nameParts.join(' ')}`;
    }

    if (bannedWords.length > 0) {
      namePrompt += `\nAvoid these words: ${bannedWords.join(', ')}`;
    }

    if (rejectedNames.length > 0) {
      namePrompt += `\nDo NOT use names similar to: ${rejectedNames.join(', ')}`;
    }

    const useNewPrompt = featureFlags.includes('new_name_prompt');
    const nameGuidance = useNewPrompt
      ? 'Generate memorable, unique names that are easy to spell and pronounce. Avoid generic terms. Focus on emotional resonance and brand differentiation.'
      : 'Generate business names based on user inputs.';
    
    namePrompt += `\n${nameGuidance}\nReturn ONLY a JSON array with exactly ${nameCount} objects, each with "name", "tagline", and "style" properties. Example: [{"name":"CompanyName","tagline":"A tagline","style":"modern"}]`;

    // Tagline prompt
    const taglinePrompt = `Generate a short, memorable tagline for a business about: ${idea}.\nTarget audience: ${audienceStr}.\nTone: ${primaryTone}.\nMax 8 words.`;

    // Bio prompt - transform expertise into customer-facing text
    const bioPrompt = `Transform this expertise into a concise, customer-facing bio (3-4 sentences, first-person only if name is included):\n"${aboutYou.expertise}"${aboutYou.motivation ? `\nMotivation: "${aboutYou.motivation}"` : ''}\nTarget audience: ${audienceStr}\nTone: ${primaryTone}\n\nIMPORTANT: Rewrite into natural, flowing prose. Do NOT copy the input verbatim.`;

    // Colors prompt
    const colorsPrompt = `Generate 4-5 accessible brand colors (hex codes) for a business with tone: ${primaryTone}${toneHints.length ? ` and hints of ${toneHints.join(', ')}` : ''}. Return ONLY a JSON array of hex codes: ["#hex1","#hex2",...]`;

    // AI Generation
    const aiGatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';

    async function generateText(prompt: string) {
      const response = await fetch(aiGatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`[generate-identity] AI gateway error ${response.status}:`, errorBody);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }
    
    function safeParseJSON(text: string, fallback: any) {
      try {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[1]);
        }
        return JSON.parse(text);
      } catch (error) {
        console.error('[generate-identity] JSON parse error:', error);
        return fallback;
      }
    }

    const [nameOptions, tagline, bio, colors] = await Promise.all([
      generateText(namePrompt),
      generateText(taglinePrompt),
      generateText(bioPrompt),
      generateText(colorsPrompt),
    ]);

    // Filter out banned names
    let parsedNames = safeParseJSON(nameOptions, [
      { name: "BusinessName", tagline: "A great business", style: primaryTone },
    ]);

    // Apply bannedWords filter
    if (bannedWords.length > 0) {
      parsedNames = parsedNames.filter((opt: any) => {
        const nameLower = opt.name.toLowerCase();
        return !bannedWords.some(word => nameLower.includes(word.toLowerCase()));
      });
    }

    // Safety check: ensure we have at least one name after filtering
    if (!parsedNames || parsedNames.length === 0) {
      console.warn('[generate-identity] All names filtered out, using fallback name');
      parsedNames = [{ name: "BusinessName", tagline: "A great business", style: primaryTone }];
    }

    const parsedColors = safeParseJSON(colors, ['#2563eb', '#1d4ed8', '#1e40af']);

    // Build response based on regenerateSingleName flag
    let result;
    if (regenerateSingleName) {
      // For single name regeneration, return just one name option (guaranteed to exist)
      result = {
        nameOption: parsedNames[0],
        tagline,
        bio,
        colors: parsedColors.slice(0, 5),
        products: products ?? [],
      };
    } else {
      // For batch generation, return array of names
      result = {
        nameOptions: parsedNames.slice(0, 6),
        tagline,
        bio,
        colors: parsedColors.slice(0, 5),
        products: products ?? [],
      };
    }
    
    const durationMs = Math.round(performance.now() - startTime);
    const response = {
      ...result,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      applied_defaults: appliedDefaults,
      feature_flags: featureFlags,
      payload_keys: Object.keys(normalized),
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, 'business-identity', requestHash, response);

    console.log('Successfully generated business identity');

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('Error in generate-identity function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate business identity';
    const errorDetails = error instanceof Error ? error.toString() : String(error);

    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      ok: false,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
