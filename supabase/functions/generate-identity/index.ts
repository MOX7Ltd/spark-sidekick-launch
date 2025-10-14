import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';
import { normalizeOnboardingInput, shouldIncludeName } from '../_shared/normalize.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Model configuration (centralized for easy updates)
const NAMING_MODEL = Deno.env.get('NAMING_MODEL') || 'google/gemini-2.5-pro';
const NAMING_TEMP = parseFloat(Deno.env.get('NAMING_TEMP') || '0.65'); // 0.6-0.7 range for creativity + coherence

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
  business_type: z.enum(['service', 'product', 'education', 'general']).optional(),
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
    
    // Infer business type from idea
    function inferBusinessType(idea: string): 'service' | 'product' | 'education' | 'general' {
      const lower = idea.toLowerCase();
      
      const serviceKeywords = [
        'mow', 'lawn', 'paint', 'clean', 'wash', 'repair', 'fix', 'install',
        'plumb', 'design', 'photograph', 'walk dogs', 'pet sit', 'babysit',
        'landscap', 'garden', 'handyman', 'electrician', 'carpentry'
      ];
      
      const educationKeywords = [
        'teach', 'tutor', 'coach', 'mentor', 'train', 'course', 'lesson',
        'academy', 'workshop', 'class', 'instruct', 'consulting'
      ];
      
      const productKeywords = [
        'sell', 'shop', 'store', 'ecommerce', 'product', 'goods',
        'handmade', 'craft', 'digital download'
      ];
      
      if (serviceKeywords.some(k => lower.includes(k))) return 'service';
      if (educationKeywords.some(k => lower.includes(k))) return 'education';
      if (productKeywords.some(k => lower.includes(k))) return 'product';
      return 'general';
    }
    
    const businessType = validationResult.data.business_type || inferBusinessType(idea);

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
    
    // Build name prompt with business type awareness
    const wantCount = regenerateSingleName ? 2 : 6;
    const namingMode = normalized.naming_mode || 'descriptive';
    
    // Dynamic naming prompt that adapts to business type
    const namingPrompt = `
You are helping a new microbusiness owner name their business.

Inputs:
- Business idea or category: ${idea}
- Audience they want to serve: ${audienceStr}
- Tone or vibe: ${vibes.join(', ')}
- Experience or background: ${aboutYou.expertise}
- Business type: ${businessType}
${isPersonalBrand ? `- Founder name: ${personalName} (should be incorporated in at least 2 options)` : ''}

Your goal:
Generate ${wantCount} business names that sound natural, trustworthy, and relevant
to this exact business type and audience — not digital courses or coaching,
unless the idea explicitly involves teaching.

Guidelines:
- If the business provides a **service** (e.g. mowing lawns, cleaning, painting, plumbing, design work, photography), produce names that sound like **local service providers** or small brands customers would hire.
  Examples: "Greenstreet Lawns", "Playfield Mowing", "Kapiti Lawn Co."
  
- If it sells **products** (digital or physical), lean toward brandable product names.
  Examples: "CozyNest Candles", "Peak Performance Gear", "Handmade Haven"
  
- If it's **education or consulting**, then use learning-oriented phrasing.
  Examples: "First Touch Coaching", "Morris Guitar Lessons", "Growth Path Consulting"
  
- Never add "Coaching", "Academy", "Training", "Consulting" unless the idea explicitly includes teaching.
- Use warm, authentic tones (trust, pride, craft, community, nature).
- Prefer short, easy-to-remember names (2–4 words).
- Avoid clichés like "Solutions", "Enterprises", "Online".
- Return a JSON array of objects: [{ "name": "...", "tagline": "..." }].

Example for a lawn care service:
[
  { "name": "Greenstreet Lawns", "tagline": "Beautiful yards, local care" },
  { "name": "Playfield Mowing", "tagline": "Groundskeeper-level lawns for every home" },
  { "name": "Kapiti Lawn Co.", "tagline": "Enjoy your greenspace — we'll handle the rest" }
]

${isPersonalBrand ? `CRITICAL: At least 2 of the ${wantCount} names MUST include "${personalName}"` : ''}

Quality guidelines:
✓ Easy to say and spell
✓ Matches business type (service vs product vs education)
✓ Distinct from each other
✓ At least 1 option with geographic reference for local services
✗ No alliteration (matching first letters)
✗ No corporate jargon (academy, solutions, systems, ventures, collective, HQ, institute, labs)
✗ No vague buzzwords (apex, synergy, quantum, elevate, alpha, echelon, ascend, prime, omni)
✗ No trendy suffixes (-ly, -ify, -verse, -matic, -scape)
✗ No coined/app-y/portmanteau names (Kickflow, Playforge, Pitchwise, Footwiz)
${bannedWords.length > 0 ? `✗ Never use: ${bannedWords.join(', ')}` : ''}
${rejectedNames.length > 0 ? `✗ Avoid similarity to: ${rejectedNames.join(', ')}` : ''}

Return JSON:
{
  "names": [
    { "name": "Name", "tagline": "benefit-driven promise" }
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
      
      // Relaxed penalties
      if (isAlliteration(n)) score -= 30;  // was -40
      if (looksCorporate(n)) score -= 25;  // was -35
      if (mode !== 'invented' && looksCoined(n)) score -= 18;  // was -40, now soft penalty
      
      const wc = wordCount(n);
      // More flexible word count (1-4 acceptable)
      if (mode === 'descriptive' && (wc < 1 || wc > 4)) score -= 15;  // was strict 2-3
      if (mode === 'invented' && (wc < 1 || wc > 3)) score -= 15;
      
      // Keep punctuation penalty
      if (/[^a-zA-Z\s]/.test(n)) score -= 10;
      
      return score;
    }

    function filterRank(names: {name:string, tagline:string}[], mode: 'descriptive' | 'invented') {
      const dedup = new Map<string, {name:string, tagline:string}>();
      for (const x of names) {
        const key = x.name.trim().toLowerCase();
        if (!dedup.has(key)) dedup.set(key, x);
      }
      // Less aggressive filtering - let scoring handle it
      const arr = [...dedup.values()]
        .filter(x => !looksCorporate(x.name))  // Keep corporate filter as hard filter
        .filter(x => wordCount(x.name) <= (mode === 'descriptive' ? 4 : 3));  // Relaxed word count
      return arr
        .map(x => ({ ...x, __s: scoreName(x.name, mode) }))
        .filter(x => x.__s >= 55)  // Accept scores ≥ 55
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

    async function generateText(prompt: string, useHighTemp = false, useModel?: string) {
      const response = await fetch(aiGatewayUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: useModel || NAMING_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: useHighTemp ? NAMING_TEMP : undefined,
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
      generateText(taglinePrompt, false, 'google/gemini-2.5-flash'),
      generateText(bioPrompt, false, 'google/gemini-2.5-flash'),
      generateText(colorsPrompt, false, 'google/gemini-2.5-flash'),
    ]);

    // Parse and filter names with rerank
    let collected: {name:string, tagline:string}[] = [];
    const initialParse = safeParseJSON(nameResponse, { names: [] });
    collected = filterRank(initialParse.names || [], namingMode);

    // Refill loop if too many got filtered (max 1 refill attempt, accept 3+ names)
    let tries = 0;
    while (collected.length < 3 && tries < 1) {
      tries++;
      console.log(`[generate-identity] Refilling names (try ${tries}), have ${collected.length}/${wantCount}`);
      const topUpResponse = await generateText(namingPrompt, true);
      const topUpParse = safeParseJSON(topUpResponse, { names: [] });
      collected = filterRank([...collected, ...(topUpParse.names || [])], namingMode);
    }

    let parsedNames = collected.slice(0, wantCount);
    
    // AI Quality Re-Scoring Pass (2nd stage) - only run if we need more names
    type ScoredName = {name: string; tagline: string; aiScore?: number; combinedScore?: number};
    let scoredNames: ScoredName[] = parsedNames;
    
    if (parsedNames.length > 0 && collected.length < wantCount) {
      const scoringPrompt = `Rate each business name 1–10 for memorability, clarity, and uniqueness.
Business idea: ${idea}
Audience: ${audienceStr}
Tone: ${vibes.join(', ')}

Names to rate:
${parsedNames.map(n => n.name).join('\n')}

Return JSON:
{"scores":[{"name":"Example","memorability":8,"clarity":9,"uniqueness":7}]}`;

      try {
        const scoringResponse = await fetch(aiGatewayUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [{ role: 'user', content: scoringPrompt }],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });
        
        if (scoringResponse.ok) {
          const scoringData = await scoringResponse.json();
          const aiScores = safeParseJSON(scoringData.choices[0].message.content, { scores: [] });
          
          // Merge AI scores back into results
          type AIScore = {name: string; memorability: number; clarity: number; uniqueness: number};
          const scoreMap = new Map<string, AIScore>(aiScores.scores?.map((s: AIScore) => [s.name.toLowerCase(), s]) || []);
          scoredNames = parsedNames.map(name => {
            const aiScore: AIScore | undefined = scoreMap.get(name.name.toLowerCase());
            if (aiScore) {
              const avgAiScore = ((aiScore.memorability || 5) + (aiScore.clarity || 5) + (aiScore.uniqueness || 5)) / 3;
              const localScore = scoreName(name.name, namingMode);
              const combinedScore = (localScore * 0.6) + (avgAiScore * 4);
              return { ...name, aiScore: avgAiScore, combinedScore };
            }
            return { ...name, aiScore: 5, combinedScore: scoreName(name.name, namingMode) };
          });
          
          // Re-rank by combined score
          scoredNames.sort((a, b) => (b.combinedScore || 0) - (a.combinedScore || 0));
          console.log('[generate-identity] AI re-scoring complete');
        }
      } catch (error) {
        console.warn('[generate-identity] AI re-scoring failed, continuing with local scores:', error);
      }
    }
    
    // Remove scoring metadata before returning
    parsedNames = scoredNames.map(({aiScore, combinedScore, ...rest}) => rest);

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
