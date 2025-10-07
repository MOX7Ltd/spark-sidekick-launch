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
    
    // Extract service phrase for naming
    function servicePhrase(idea: string): string {
      const t = (idea || '').toLowerCase();
      if (/soccer|football/.test(t)) return 'soccer coaching';
      if (/guitar|music/.test(t)) return 'guitar lessons';
      if (/tutor|math|algebra|study/.test(t)) return 'math tutoring';
      if (/fitness|yoga|training/.test(t)) return 'fitness coaching';
      return 'coaching';
    }

    console.log('[generate-identity] Normalized input:', { 
      audiences, 
      vibes, 
      primaryTone, 
      toneHints,
      bannedWords: bannedWords.length,
      rejectedNames: rejectedNames.length,
    });

    // Determine if this is a personal brand
    const nameInfo = shouldIncludeName(aboutYou);
    const isPersonalBrand = nameInfo.includeFirst || nameInfo.includeLast;
    const personalName = isPersonalBrand 
      ? `${nameInfo.firstName || ''} ${nameInfo.lastName || ''}`.trim()
      : '';
    
    // Build name prompt with constraints
    const wantCount = regenerateSingleName ? 2 : 6;
    const namingMode = normalized.naming_mode || 'descriptive';
    const s = servicePhrase(idea);
    
    // Mode-aware naming prompt
    const namingPrompt = `
You are a practical brand namer for solo/side-hustle businesses.
Mode: ${namingMode}

Business idea: "${idea}"
Audience: ${audienceStr}
Tone: ${vibes.join(', ')}
Service phrase: ${s}
Personal brand: ${isPersonalBrand ? 'on' : 'off'}${isPersonalBrand ? ` (name: ${personalName})` : ''}

Generate ${wantCount} business names with short taglines (<= 12 words).

If Mode = "descriptive" (default):
- Favour clear, human, service-first names (2–3 words).
- At least:
  • 2 personal-brand options when personal_brand=on (e.g., "Paul Morris Soccer Coaching").
  • 2 descriptive options that include the service phrase (e.g., "Pitch Skills Coaching", "Youth Soccer Coaching").
  • 1 outcome-based option (e.g., "First Touch Coaching", "Better Ball Skills").
  • 1 localizable pattern using "{City}" placeholder (e.g., "{City} Youth Soccer Coaching").
- Absolutely avoid coined/app-y/portmanteau names and single fake words (no "Kickflow", "Playforge", "Pitchwise", "Footwiz").
- Avoid corporate/stuffy terms (academy, institute, solutions, systems, labs, global, ventures, group, collective, HQ).
- Avoid vague status words (apex, echelon, ascend/ascendant, elevate, prime, alpha, omni, ultra, nova, synergy, quantum).
- No alliteration ("Power Play", "Future Footwork"), no weird suffixes (-ly, -ify, -verse, -matic, -scape).
- Keep it easy to say and spell. Prefer space-separated words. No hyphens.
${bannedWords.length > 0 ? `- NEVER use these words: ${bannedWords.join(', ')}` : ''}
${rejectedNames.length > 0 ? `- NEVER use names similar to: ${rejectedNames.join(', ')}` : ''}

If Mode = "invented":
- Allow 1–2 coined names but still avoid clichés (no -ly/-ify/-verse etc.). Balance with 3–4 descriptive options.

Return JSON:
{
  "names": [
    { "name": "Name", "tagline": "clear benefit promise" }
  ]
}
`.trim();

    // Filter and scoring functions
    const BAN_WORDS = [
      "academy","institute","solutions","systems","studio","labs","global","world","ventures",
      "vision","pathway","program","project","collective","group","house","hq","school","league"
    ];
    const BAN_VAGUE = [
      "apex","echelon","ascend","ascendant","elevate","ignite","stratagem","prime","alpha",
      "omni","ultra","nova","synergy","quantum","veridian","emerald","velocity"
    ];
    const BAN_SUFFIX = [/ly$/i, /ify$/i, /verse$/i, /scape$/i, /matic$/i];

    function isAlliteration(name: string): boolean {
      const parts = name.trim().split(/\s+/);
      if (parts.length < 2) return false;
      const firsts = parts.map(w => w[0]?.toLowerCase()).filter(Boolean);
      return new Set(firsts).size === 1;
    }

    function looksCorporate(name: string): boolean {
      const low = name.toLowerCase();
      if (BAN_WORDS.some(w => low.includes(w))) return true;
      if (BAN_VAGUE.some(w => low.includes(w))) return true;
      if (BAN_SUFFIX.some(rx => rx.test(name))) return true;
      return false;
    }

    function wordCount(name: string): number { 
      return name.trim().split(/\s+/).length; 
    }

    function charCount(name: string): number { 
      return name.replace(/\s+/g,'').length; 
    }
    
    function isSingleWord(n: string): boolean { 
      return n.trim().split(/\s+/).length === 1; 
    }
    
    function looksCoined(n: string): boolean {
      const low = n.toLowerCase();
      return isSingleWord(n) && !/coach|coaching|tutor|lessons|training|studio|club|team|works|workshop|services/.test(low);
    }

    function scoreName(n: string, mode: 'descriptive' | 'invented'): number {
      let score = 100;
      if (isAlliteration(n)) score -= 40;
      if (looksCorporate(n)) score -= 35;
      if (mode !== 'invented' && looksCoined(n)) score -= 40;
      const wc = wordCount(n);
      if (mode === 'descriptive' && (wc < 2 || wc > 3)) score -= 20;
      if (/[^a-zA-Z\s]/.test(n)) score -= 10;
      return score;
    }

    function filterRank(names: {name:string, tagline:string}[], mode: 'descriptive' | 'invented') {
      const dedup = new Map<string, {name:string, tagline:string}>();
      for (const x of names) {
        const key = x.name.trim().toLowerCase();
        if (!dedup.has(key)) dedup.set(key, x);
      }
      const arr = [...dedup.values()]
        .filter(x => !isAlliteration(x.name))
        .filter(x => !looksCorporate(x.name))
        .filter(x => mode === 'descriptive' ? wordCount(x.name) <= 3 : wordCount(x.name) <= 2);
      return arr
        .map(x => ({ ...x, __s: scoreName(x.name, mode) }))
        .sort((a,b) => b.__s - a.__s)
        .map(({__s, ...r}) => r);
    }

    // Tagline prompt
    const taglinePrompt = `Generate a short, memorable tagline for a business about: ${idea}.\nTarget audience: ${audienceStr}.\nTone: ${primaryTone}.\nMax 8 words.`;

    // Bio prompt: Improved human-quality generation
    const bioPrompt = `
You are a senior brand strategist writing a business bio.

Context:
- Business idea: ${idea}
- Founder expertise: ${aboutYou.expertise}
- Motivation: ${aboutYou.motivation || 'help people succeed'}
- Audience: ${audienceStr}
- Tone: ${primaryTone}
${isPersonalBrand ? `- Personal brand: Yes (founder: ${nameInfo.firstName || ''} ${nameInfo.lastName || ''})` : ''}

Your task:
Write a concise 2-3 sentence bio for an "About" page that:
- Introduces what the business does in clear, natural language
- Shows the founder's unique perspective or approach
- Connects with the target audience emotionally
- Feels authentic and human, not corporate jargon
${isPersonalBrand ? '- Naturally incorporates the founder\'s name and story' : ''}

Output ONLY the bio text, no labels or formatting.
    `.trim();

    // Colors prompt
    const colorsPrompt = `Generate 4 brand colors (hex codes) for a ${primaryTone} business about: ${idea}. Return ONLY an array like: ["#4C5973", "#F5E0C2", "#A3C7D4", "#D4E0A3"]`;

    // AI Generation
    const aiGatewayUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';

    async function generateText(prompt: string, useHighTemp = false) {
      const response = await fetch(aiGatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }],
          temperature: useHighTemp ? 0.4 : undefined,
          response_format: useHighTemp ? { type: "json_object" } : undefined,
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

    // Generate initial names
    const [nameResponse, tagline, bio, colors] = await Promise.all([
      generateText(namingPrompt, true),
      generateText(taglinePrompt),
      generateText(bioPrompt),
      generateText(colorsPrompt),
    ]);

    // Parse and filter names with rerank
    let collected: {name:string, tagline:string}[] = [];
    const initialParse = safeParseJSON(nameResponse, { names: [] });
    collected = filterRank(initialParse.names || [], namingMode);

    // Refill loop if too many got filtered (max 2 tries)
    let tries = 0;
    while (collected.length < wantCount && tries < 2) {
      tries++;
      console.log(`[generate-identity] Refilling names (try ${tries}), have ${collected.length}/${wantCount}`);
      const topUpResponse = await generateText(namingPrompt, true);
      const topUpParse = safeParseJSON(topUpResponse, { names: [] });
      collected = filterRank([...collected, ...(topUpParse.names || [])], namingMode);
    }

    let parsedNames = collected.slice(0, wantCount);

    // Safety check: ensure we have at least one name
    if (parsedNames.length === 0) {
      console.warn('[generate-identity] All names filtered out, using fallback');
      parsedNames = [{ name: "BusinessName", tagline: "A great business" }];
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
