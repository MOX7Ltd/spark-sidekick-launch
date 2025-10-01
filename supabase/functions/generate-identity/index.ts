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
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry, x-feature-flags',
};

const requestSchema = z.object({
  idea: z.string().min(10),
  audience: z.string().min(3),
  experience: z.string().optional(),
  motivation: z.string().optional(),
  namingPreference: z.enum(['with_personal_name', 'anonymous', 'custom']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  includeFirstName: z.boolean().optional(),
  includeLastName: z.boolean().optional(),
  tone: z.string().optional(),
  styleCategory: z.string().optional(),
  bannedWords: z.array(z.string()).optional(),
  rejectedNames: z.array(z.string()).optional(),
  regenerateNamesOnly: z.boolean().optional(),
  regenerateSingleName: z.boolean().optional(),
});

// Function to sanitize SVG code (very basic, consider a more robust solution)
function sanitizeSVG(svg: string): string {
  // Remove any script tags
  svg = svg.replace(/<script.*?>.*?<\/script>/gi, '');
  // Remove any onload attributes
  svg = svg.replace(/onload=".*?"/gi, '');
  return svg;
}

// Rate Limiting (Example - adapt as needed)
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

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || traceId;
  const featureFlags = parseFeatureFlags(req.headers);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Edge function called with headers:', req.headers.get('authorization') ? 'Authorization present' : 'No authorization');
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

    // Verify Authentication (Example - adapt as needed)
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.warn('Missing or invalid authorization header');
      // return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      //   status: 401,
      //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      // });
    }

    // Rate limiting
    if (rateLimit(sessionId)) {
      console.warn('Rate limit exceeded for session:', sessionId);
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the request body
    const requestBody = await req.json();

    // Validate the request body
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

    // Extract data from the request
    const {
      idea,
      audience,
      experience,
      motivation,
      namingPreference,
      firstName,
      lastName,
      includeFirstName,
      includeLastName,
      tone,
      styleCategory,
      bannedWords,
      rejectedNames,
      regenerateNamesOnly,
      regenerateSingleName,
    } = validationResult.data;

    // Normalize inputs with defaults
    const normalizedInput = normalizeOnboardingInput({
      idea,
      audience,
      experience,
      motivation,
      namingPreference,
      firstName,
      lastName,
      includeFirstName,
      includeLastName,
      tone,
      styleCategory,
      bannedWords,
      rejectedNames,
    });

    // Business description prompt
    let businessPrompt = `Generate a business description for a company with this concept: ${idea}.
      The target audience is: ${audience}.`;

    if (experience) {
      businessPrompt += `The user has this experience: ${experience}.`;
    }

    if (motivation) {
      businessPrompt += `The user's motivation is: ${motivation}.`;
    }

    if (tone) {
      businessPrompt += ` The tone of voice should be: ${tone}.`;
    }

    businessPrompt += ` The description should be 2-3 short sentences.`;

    // Name options prompt
    let namePrompt = `Generate 3 business names based on user inputs.`;

    if (firstName && lastName && (includeFirstName || includeLastName)) {
      namePrompt += ` The user's name is ${firstName} ${lastName}.`;
    }

    if (namingPreference === 'with_personal_name') {
      namePrompt += ` The business name should include the user's personal name.`;
    } else if (namingPreference === 'anonymous') {
      namePrompt += ` The business name should NOT include the user's personal name.`;
    } else if (namingPreference === 'custom') {
      namePrompt += ` The business name can include the user's personal name, if it makes sense.`;
    }

    if (styleCategory) {
      namePrompt += ` The style category is: ${styleCategory}.`;
    }

    if (bannedWords && bannedWords.length > 0) {
      namePrompt += ` Avoid these words: ${bannedWords.join(', ')}.`;
    }

    if (rejectedNames && rejectedNames.length > 0) {
      namePrompt += ` Do NOT use names similar to: ${rejectedNames.join(', ')}.`;
    }
    
    // Use feature flag for new name prompt
    const useNewPrompt = featureFlags.includes('new_name_prompt');
    console.log('[generate-identity] Using new name prompt:', useNewPrompt);
    
    const nameGuidance = useNewPrompt
      ? 'Generate memorable, unique names that are easy to spell and pronounce. Avoid generic terms. Focus on emotional resonance and brand differentiation.'
      : 'Generate business names based on user inputs.';
    
    namePrompt += ` ${nameGuidance}`;

    // Tagline prompt
    let taglinePrompt = `Generate a tagline for a business with this concept: ${idea}.
      The target audience is: ${audience}.`;

    if (tone) {
      taglinePrompt += ` The tone of voice should be: ${tone}.`;
    }

    taglinePrompt += ` The tagline should be short and memorable.`;

    // Product prompt
    let productPrompt = `Generate 3 example products for a business with this concept: ${idea}.
      The target audience is: ${audience}.`;

    if (tone) {
      productPrompt += ` The tone of voice should be: ${tone}.`;
    }

    productPrompt += ` The products should be relevant to the business concept.`;

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
          model: 'google/gemini-1.5-pro-latest',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    }

    async function generateLogo(businessName: string, style: string) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: `Generate a logo for ${businessName} in the style of ${style}. The logo should be simple and memorable.`,
          n: 1,
          size: '1024x1024',
        }),
      });

      if (!response.ok) {
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].url;
    }

    const [business, nameOptions, tagline, logoUrl, products] = await Promise.all([
      generateText(businessPrompt),
      generateText(namePrompt),
      generateText(taglinePrompt),
      generateLogo(idea, styleCategory || 'abstract'),
      generateText(productPrompt),
    ]);

    // Basic SVG sanitization
    const sanitizedLogoSVG = sanitizeSVG(await (await fetch(logoUrl)).text());

    // Format the response
    const result = {
      business,
      nameOptions: JSON.parse(nameOptions),
      tagline,
      bio: business,
      colors: ['#000000', '#FFFFFF'],
      logoSVG: sanitizedLogoSVG,
      products: JSON.parse(products),
    };
    
    const durationMs = Math.round(performance.now() - startTime);
    const response = {
      ...result,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      applied_defaults: normalizedInput.appliedDefaults || [],
      feature_flags: featureFlags,
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, 'business-identity', requestHash, response);

    // Log usage
    console.log('Successfully generated business identity');

    // Return the response
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
