import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform normalization helper (matches src/lib/platforms.ts taxonomy)
const PLATFORM_ALIAS: Record<string, string> = {
  x: 'twitter',
  ig: 'instagram',
  fb: 'facebook',
  yt: 'youtube',
  threads: 'instagram',
  instagram: 'instagram',
  twitter: 'twitter',
  facebook: 'facebook',
  linkedin: 'linkedin',
  youtube: 'youtube',
  tiktok: 'tiktok',
  pinterest: 'pinterest',
  substack: 'substack'
};

function canonicalizePlatformKey(raw?: string | null): string | null {
  if (!raw) return null;
  const k = raw.toString().trim();
  const lower = k.toLowerCase();
  return PLATFORM_ALIAS[lower] ?? PLATFORM_ALIAS[k] ?? lower;
}

interface CampaignRequest {
  user_id?: string;
  mode: 'suggest' | 'defined';
  idea?: string;
  goal?: 'awareness' | 'signups' | 'sales' | 'bookings';
  audienceHints?: string[];
  angle?: string[];
  durationPreset?: '7d' | '14d' | '30d';
  platforms: string[];
  business_context?: {
    name?: string;
    tagline?: string;
    bio?: string;
    audiences?: string[];
    vibes?: string[];
  };
  product_context?: Array<{ id: string; title: string; type?: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const body: CampaignRequest = await req.json();
    console.log('[generate-campaign-concepts] Request:', {
      mode: body.mode,
      platforms: body.platforms,
      goal: body.goal,
      duration: body.durationPreset
    });

    // === Phase 1: Construct messages ===
    const businessInfo = body.business_context
      ? `Name: ${body.business_context.name}
${body.business_context.tagline ? `Tagline: ${body.business_context.tagline}` : ''}
${body.business_context.bio ? `Bio: ${body.business_context.bio}` : ''}
${body.business_context.audiences?.length ? `Audiences: ${body.business_context.audiences.join(', ')}` : ''}
${body.business_context.vibes?.length ? `Vibes: ${body.business_context.vibes.join(', ')}` : ''}`
      : 'A small business owner';

    const durationInfo = body.durationPreset === '7d' ? '1 week' :
                         body.durationPreset === '14d' ? '2 weeks' :
                         body.durationPreset === '30d' ? '1 month' : '1 week';

    // System message with concise instructions and JSON example
    const SYSTEM = {
      role: 'system',
      content: `You are a social media strategist.

Return JSON that matches the tool schema. For EACH requested platform, generate 2–3 posts (hook, caption, 3–8 hashtags, media guidance). Do not skip platforms.

Example:
{
  "concepts": [{
    "title": "Summer Fitness Challenge",
    "promise": "Get beach-ready in 30 days",
    "cadence": { "days": 30, "posts": 12 },
    "key_messages": ["Consistency wins", "Small steps daily", "Community support"],
    "posts_by_platform": {
      "instagram": [{
        "platform": "instagram",
        "hook": "Day 1: Your transformation starts NOW 💪",
        "caption": "Ready to crush your fitness goals? Join our 30-day challenge...",
        "hashtags": ["#FitnessChallenge","#SummerBody","#GetFit"],
        "media_guide": { "idea": "Before/after calendar", "specs": ["1:1"] }
      }],
      "tiktok": [{
        "platform": "tiktok",
        "hook": "POV: You committed to 30 days",
        "caption": "Watch what happens when you show up every day...",
        "hashtags": ["#FitnessTok","#Transformation","#30DayChallenge"],
        "media_guide": { "idea": "Quick montage", "video_beats": ["Start","Mid","Reveal"], "specs": ["9:16","<60s"] }
      }]
    }
  }]
}`.trim()
    };

    // User prompt (short and clear)
    const prompt = body.mode === 'suggest'
      ? `Generate 2–3 campaign concepts for this business.

Business:
${businessInfo}

Platforms: ${body.platforms.join(', ')}
Duration: ${durationInfo}

CRITICAL: For EACH platform above, include 2–3 posts (hook, caption, 3–8 hashtags, media guidance).`
      : `Generate 1–2 campaign concepts for: "${body.idea}"

Goal: ${body.goal}
Business:
${businessInfo}

Platforms: ${body.platforms.join(', ')}
Duration: ${durationInfo}

CRITICAL: For EACH platform above, include 2–3 posts (hook, caption, 3–8 hashtags, media guidance).`;

    // === Phase 2: Define tool schema ===
    const POST_ITEM = {
      type: "object",
      required: ["platform", "hook", "caption"],
      properties: {
        platform: { type: "string" },
        hook: { type: "string" },
        caption: { type: "string" },
        hashtags: { type: "array", items: { type: "string" } },
        media_guide: {
          type: "object",
          properties: {
            idea: { type: "string" },
            video_beats: { type: "array", items: { type: "string" } },
            carousel: { type: "array", items: { type: "string" } },
            specs: { type: "array", items: { type: "string" } }
          }
        }
      }
    };

    const POSTS_BY_PLATFORM = {
      type: "object",
      description: "Posts for each platform. Must include ALL requested platforms.",
      properties: {
        instagram: { type: "array", items: POST_ITEM },
        twitter: { type: "array", items: POST_ITEM },
        facebook: { type: "array", items: POST_ITEM },
        linkedin: { type: "array", items: POST_ITEM },
        youtube: { type: "array", items: POST_ITEM },
        tiktok: { type: "array", items: POST_ITEM },
        pinterest: { type: "array", items: POST_ITEM },
        substack: { type: "array", items: POST_ITEM }
      },
      additionalProperties: false
    };

    const TOOLS = [{
      type: "function",
      function: {
        name: "generate_campaign_concepts",
        description: "Generate campaign concepts with posts keyed by platform.",
        parameters: {
          type: "object",
          properties: {
            concepts: {
              type: "array",
              items: {
                type: "object",
                required: ["title", "posts_by_platform"],
                properties: {
                  title: { type: "string" },
                  promise: { type: "string" },
                  cadence: {
                    type: "object",
                    properties: { days: { type: "number" }, posts: { type: "number" } }
                  },
                  key_messages: { type: "array", items: { type: "string" } },
                  goal: { type: "string" },
                  audience: { type: "array", items: { type: "string" } },
                  posts_by_platform: POSTS_BY_PLATFORM
                }
              }
            }
          },
          required: ["concepts"]
        }
      }
    }];

    // === Phase 3: Call AI ===
    console.log('[generate-campaign-concepts] Calling Lovable AI...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [SYSTEM, { role: 'user', content: prompt }],
        tools: TOOLS,
        tool_choice: { type: "function", function: { name: "generate_campaign_concepts" } },
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-campaign-concepts] AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    // === Phase 4: Parse response ===
    const aiData = await response.json();
    const choice = aiData.choices?.[0];
    if (!choice) throw new Error('No choices in AI response');

    let parsed: any;

    // Try tool call first
    if (choice.message?.tool_calls?.[0]) {
      console.log('[generate-campaign-concepts] Using tool call response');
      const toolCall = choice.message.tool_calls[0];
      parsed = typeof toolCall.function.arguments === 'string'
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
    } else if (choice.message?.content) {
      // Fallback: parse content
      console.log('[generate-campaign-concepts] Fallback: parsing content');
      const content = choice.message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No tool_calls or content in AI response');
    }

    if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
      throw new Error('AI response missing concepts array');
    }

    // === Diagnostics (Phase 1) ===
    console.log('[DEBUG] Raw AI response keys:', Object.keys(parsed));
    console.log('[DEBUG] Raw AI response (truncated):', JSON.stringify(parsed).slice(0, 2000));
    if (parsed.concepts.length > 0) {
      const sample = parsed.concepts[0];
      console.log('[DEBUG] First concept sample:', JSON.stringify({
        title: sample.title,
        posts_by_platform_keys: Object.keys(sample.posts_by_platform || {}),
        has_posts: Object.values(sample.posts_by_platform || {}).some((arr: any) => Array.isArray(arr) && arr.length > 0) ? 'yes' : 'no',
        direct_platform_keys: Object.keys(sample).filter((k: string) => 
          ['instagram','twitter','tiktok','facebook','linkedin','youtube','pinterest','substack'].includes(k.toLowerCase())
        )
      }, null, 2));
    }

    // === Phase 5: Normalize platform keys using taxonomy ===
    function normalizePost(post: any, platformKey: string): any {
      return {
        platform: platformKey,
        hook: post.hook || '',
        caption: post.caption || '',
        hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
        media_guide: post.media_guide || { idea: '' }
      };
    }

    const normalized = parsed.concepts.map((concept: any) => {
      const pbp = concept.posts_by_platform || {};
      const normalizedPosts: Record<string, any[]> = {};

      // Normalize platform keys using canonicalizePlatformKey from taxonomy
      for (const [rawKey, rawPosts] of Object.entries(pbp)) {
        const platformKey = canonicalizePlatformKey(rawKey);
        if (!platformKey) continue;
        if (!Array.isArray(rawPosts)) continue;
        if (rawPosts.length === 0) continue;
        normalizedPosts[platformKey] = rawPosts.map((p: any) => normalizePost(p, platformKey));
      }

      // Fallback parser: check for direct platform keys
      const directKeys = ['instagram', 'twitter', 'tiktok', 'facebook', 'linkedin', 'youtube', 'pinterest', 'substack'];
      for (const k of directKeys) {
        if (Array.isArray(concept[k]) && concept[k].length > 0 && !normalizedPosts[k]) {
          normalizedPosts[k] = concept[k].map((p: any) => normalizePost(p, k));
        }
        // Also check for instagramPosts, twitterPosts, etc.
        const altKey = `${k}Posts`;
        if (Array.isArray(concept[altKey]) && concept[altKey].length > 0 && !normalizedPosts[k]) {
          normalizedPosts[k] = concept[altKey].map((p: any) => normalizePost(p, k));
        }
      }

      // Fallback parser: flat posts array with platform field
      if (Array.isArray(concept.posts) && concept.posts.length > 0) {
        for (const post of concept.posts) {
          const platformKey = canonicalizePlatformKey(post.platform);
          if (!platformKey) continue;
          if (!normalizedPosts[platformKey]) normalizedPosts[platformKey] = [];
          normalizedPosts[platformKey].push(normalizePost(post, platformKey));
        }
      }

      return {
        id: crypto.randomUUID(),
        title: concept.title || 'Untitled Campaign',
        promise: concept.promise || '',
        cadence: concept.cadence || { days: 7, posts: 7 },
        key_messages: Array.isArray(concept.key_messages) ? concept.key_messages : [],
        goal: concept.goal || body.goal || 'awareness',
        audience: Array.isArray(concept.audience) ? concept.audience : [],
        posts_by_platform: normalizedPosts
      };
    });

    // === Check if any concept has posts ===
    const hasAnyPosts = normalized.some((c: any) => {
      const keys = Object.keys(c.posts_by_platform);
      return keys.length > 0 && Object.values(c.posts_by_platform).some((arr: any) => Array.isArray(arr) && arr.length > 0);
    });

    // === Single retry if no posts ===
    if (!hasAnyPosts) {
      console.warn('[generate-campaign-concepts] No posts found in any concept. Retrying with stricter prompt...');
      const retryPrompt = `Return posts_by_platform with 2–3 posts for EACH of: ${body.platforms.join(', ')}. Do not return empty arrays.

${prompt}`;

      const retryResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [SYSTEM, { role: 'user', content: retryPrompt }],
          tools: TOOLS,
          tool_choice: { type: "function", function: { name: "generate_campaign_concepts" } },
          temperature: 0.9,
        }),
      });

      if (!retryResponse.ok) {
        console.error('[generate-campaign-concepts] Retry failed:', retryResponse.status);
      } else {
        const retryData = await retryResponse.json();
        const retryChoice = retryData.choices?.[0];
        if (retryChoice?.message?.tool_calls?.[0]) {
          const retryParsed = typeof retryChoice.message.tool_calls[0].function.arguments === 'string'
            ? JSON.parse(retryChoice.message.tool_calls[0].function.arguments)
            : retryChoice.message.tool_calls[0].function.arguments;

          if (retryParsed.concepts && Array.isArray(retryParsed.concepts)) {
            console.log('[generate-campaign-concepts] Retry succeeded, using retry result');
            // Re-normalize retry result
            const retryNormalized = retryParsed.concepts.map((concept: any) => {
              const pbp = concept.posts_by_platform || {};
              const normalizedPosts: Record<string, any[]> = {};

              for (const [rawKey, rawPosts] of Object.entries(pbp)) {
                const platformKey = canonicalizePlatformKey(rawKey);
                if (!platformKey || !Array.isArray(rawPosts) || rawPosts.length === 0) continue;
                normalizedPosts[platformKey] = rawPosts.map((p: any) => normalizePost(p, platformKey));
              }

              return {
                id: crypto.randomUUID(),
                title: concept.title || 'Untitled Campaign',
                promise: concept.promise || '',
                cadence: concept.cadence || { days: 7, posts: 7 },
                key_messages: Array.isArray(concept.key_messages) ? concept.key_messages : [],
                goal: concept.goal || body.goal || 'awareness',
                audience: Array.isArray(concept.audience) ? concept.audience : [],
                posts_by_platform: normalizedPosts
              };
            });

            // Replace normalized with retry result
            normalized.length = 0;
            normalized.push(...retryNormalized);
          }
        }
      }
    }

    // === Diagnostics (Phase 2) ===
    normalized.forEach((concept: any, idx: number) => {
      const keys = Object.keys(concept.posts_by_platform);
      const counts: Record<string, number> = {};
      for (const [k, v] of Object.entries(concept.posts_by_platform)) {
        counts[k] = Array.isArray(v) ? (v as any[]).length : 0;
      }
      console.log(`[generate-campaign-concepts] Concept ${idx}: { title: "${concept.title}", platform_keys: [${keys.map(k => `"${k}"`).join(', ')}], post_counts: ${JSON.stringify(counts)} }`);
      if (keys.length === 0 || Object.values(counts).every(c => c === 0)) {
        console.warn(`[generate-campaign-concepts] Warning: Concept "${concept.title}" has NO POSTS`);
      }
    });

    console.log('[generate-campaign-concepts] Returning', normalized.length, 'normalized concepts');

    return new Response(JSON.stringify({ concepts: normalized }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[generate-campaign-concepts] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
