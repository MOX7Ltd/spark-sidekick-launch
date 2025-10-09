import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Build prompt
    const businessInfo = body.business_context
      ? `Business: ${body.business_context.name || 'Unknown'}
Tagline: ${body.business_context.tagline || 'N/A'}
Bio: ${body.business_context.bio || 'N/A'}
Target audience: ${body.business_context.audiences?.join(', ') || 'general'}
Brand tone: ${body.business_context.vibes?.join(', ') || 'friendly'}`
      : 'No business context provided';

    const durationInfo = body.durationPreset
      ? body.durationPreset === '7d'
        ? '7 days, 3-5 posts'
        : body.durationPreset === '14d'
        ? '14 days, 6-10 posts'
        : '30 days, 10-20 posts'
      : '7 days, 3-5 posts';

    const prompt = body.mode === 'suggest'
      ? `You are a social media strategist. Generate 3 campaign concepts for this business.

${businessInfo}

Platforms: ${body.platforms.join(', ')}
Duration: ${durationInfo}

For each concept, provide:
1. A clear campaign title
2. One-line promise (what the audience gains)
3. Cadence (days and post count)
4. 3-5 key messages
5. Suggested platforms
6. For EACH selected platform (${body.platforms.join(', ')}), generate 2-3 posts with:
   - Hook (attention-grabbing first line)
   - Caption (platform-optimized length: Twitter 240 chars, Instagram/TikTok/Facebook 2200, LinkedIn 3000, Pinterest 500, YouTube 5000)
   - 3-8 relevant hashtags (platform-appropriate: Twitter 3 max, Instagram 10 max, others 5-8)
   - Media guidance (non-generative):
     * idea: What to shoot/create (be specific: "Close-up of ball control drill on green turf")
     * video_beats: Array of shot steps if video (["Open with wide shot of field", "Cut to close-up of feet"])
     * carousel: Array of slide ideas if carousel (["Slide 1: Before technique", "Slide 2: During practice"])
     * specs: Array of practical file specs (["1:1 ratio", "< 60s duration", "Good lighting"])

Make posts actionable, conversion-friendly, and authentic to the brand tone. Focus on real value, not hype.`
      : `You are a social media strategist. Generate 2-3 campaign concepts based on this idea:

Campaign idea: ${body.idea}
Goal: ${body.goal}
Angle: ${body.angle?.join(', ')}
Duration: ${durationInfo}

${businessInfo}

Platforms: ${body.platforms.join(', ')}

For each concept, provide:
1. A clear campaign title
2. One-line promise
3. Cadence (days and post count)
4. 3-5 key messages aligned with the campaign idea
5. Suggested platforms
6. For EACH selected platform (${body.platforms.join(', ')}), generate 2-3 posts with:
   - Hook (attention-grabbing first line)
   - Caption (platform-optimized length: Twitter 240 chars, Instagram/TikTok/Facebook 2200, LinkedIn 3000, Pinterest 500, YouTube 5000)
   - 3-8 relevant hashtags (platform-appropriate: Twitter 3 max, Instagram 10 max, others 5-8)
   - Media guidance (non-generative):
     * idea: What to shoot/create
     * video_beats: Array of shot steps if video
     * carousel: Array of slide ideas if carousel
     * specs: Array of practical file specs

Keep posts authentic, actionable, and aligned with the ${body.goal} goal.`;

    // Define tool schema for structured output
    const toolSchema = {
      type: "function",
      function: {
        name: "generate_campaign_concepts",
        description: "Generate social media campaign concepts with platform-specific posts",
        parameters: {
          type: "object",
          properties: {
            concepts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Campaign title" },
                  promise: { type: "string", description: "One-line value promise" },
                  goal: { type: "string", description: "Campaign goal" },
                  audience: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Target audience segments"
                  },
                  cadence: {
                    type: "object",
                    properties: {
                      days: { type: "number" },
                      posts: { type: "number" }
                    },
                    required: ["days", "posts"]
                  },
                  key_messages: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key messages"
                  },
                  suggested_platforms: {
                    type: "array",
                    items: { type: "string" }
                  },
                  posts_by_platform: {
                    type: "object",
                    description: "Posts keyed by platform (instagram, twitter, facebook, linkedin, youtube, tiktok, pinterest)",
                    additionalProperties: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          platform: { type: "string" },
                          hook: { type: "string" },
                          caption: { type: "string" },
                          hashtags: {
                            type: "array",
                            items: { type: "string" }
                          },
                          media: {
                            type: "object",
                            properties: {
                              idea: { type: "string" },
                              video_beats: { type: "array", items: { type: "string" } },
                              carousel: { type: "array", items: { type: "string" } },
                              specs: { type: "array", items: { type: "string" } }
                            }
                          }
                        },
                        required: ["platform", "hook", "caption", "hashtags"]
                      }
                    }
                  }
                },
                required: ["title", "promise", "cadence", "key_messages", "posts_by_platform"]
              }
            }
          },
          required: ["concepts"]
        }
      }
    };

    // Call Lovable AI with tool calling
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a social media strategist. Generate structured campaign concepts with posts for each requested platform.'
          },
          { role: 'user', content: prompt }
        ],
        tools: [toolSchema],
        tool_choice: { type: "function", function: { name: "generate_campaign_concepts" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-campaign-concepts] AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract tool call response or fallback to content
    let parsed;
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      console.log('[generate-campaign-concepts] Using tool call response');
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('[generate-campaign-concepts] Tool call parse error:', e);
        throw new Error('Invalid JSON from tool call');
      }
    } else {
      // Fallback to content-based response
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) {
        throw new Error('No content or tool call in AI response');
      }
      console.log('[generate-campaign-concepts] Falling back to content response');
      try {
        parsed = JSON.parse(rawContent);
      } catch (e) {
        console.error('[generate-campaign-concepts] JSON parse error:', e, rawContent?.slice(0, 500));
        throw new Error('Invalid JSON from AI');
      }
    }

    // DIAGNOSTIC: Log raw parsed structure
    console.log('[DEBUG] Raw AI response keys:', Object.keys(parsed));
    if (parsed.concepts?.[0]) {
      const firstConcept = parsed.concepts[0];
      console.log('[DEBUG] First concept sample:', JSON.stringify({
        title: firstConcept.title,
        posts_by_platform_keys: Object.keys(firstConcept.posts_by_platform || {}),
        has_posts: firstConcept.posts ? 'yes (flat array)' : 'no',
        direct_platform_keys: Object.keys(firstConcept).filter(k => 
          k.toLowerCase().includes('instagram') || 
          k.toLowerCase().includes('twitter') || 
          k.toLowerCase().includes('facebook') ||
          k.toLowerCase().includes('tiktok') ||
          k.toLowerCase().includes('linkedin')
        )
      }, null, 2));
    }

    // Platform normalization helpers (match client-side taxonomy)
    const UI_PLATFORMS = ['instagram','twitter','facebook','linkedin','youtube','tiktok','pinterest','substack'];
    const ALIAS: Record<string,string> = { 
      x:'twitter', ig:'instagram', fb:'facebook', yt:'youtube', threads:'instagram',
      Instagram:'instagram', Twitter:'twitter', Facebook:'facebook', LinkedIn:'linkedin',
      YouTube:'youtube', TikTok:'tiktok', Pinterest:'pinterest', Substack:'substack'
    };
    const toUi = (k: string) => {
      const lower = (k || '').toLowerCase().trim();
      return ALIAS[lower] ?? ALIAS[k] ?? lower;
    };

    // Normalize and enrich concepts with fallback parsing
    const concepts = (parsed.concepts || [parsed] || []).map((c: any, idx: number) => {
      let pbp = c.posts_by_platform || c.postsByPlatform || {};
      
      // FALLBACK 1: Check for flat posts array with platform field
      if (Object.keys(pbp).length === 0 && Array.isArray(c.posts)) {
        console.log('[generate-campaign-concepts] Fallback: grouping flat posts array by platform');
        pbp = c.posts.reduce((acc: any, post: any) => {
          const platform = post.platform || 'unknown';
          if (!acc[platform]) acc[platform] = [];
          acc[platform].push(post);
          return acc;
        }, {});
      }
      
      // FALLBACK 2: Check for direct platform keys (instagramPosts, twitterPosts, etc.)
      if (Object.keys(pbp).length === 0) {
        const platformKeys = Object.keys(c).filter(k => 
          k.toLowerCase().includes('posts') && 
          (k.toLowerCase().includes('instagram') || 
           k.toLowerCase().includes('twitter') ||
           k.toLowerCase().includes('facebook') ||
           k.toLowerCase().includes('tiktok') ||
           k.toLowerCase().includes('linkedin') ||
           k.toLowerCase().includes('youtube') ||
           k.toLowerCase().includes('pinterest'))
        );
        
        if (platformKeys.length > 0) {
          console.log('[generate-campaign-concepts] Fallback: mapping direct platform keys:', platformKeys);
          platformKeys.forEach(key => {
            const platform = key.toLowerCase().replace('posts', '').replace('_', '');
            if (Array.isArray(c[key])) {
              pbp[platform] = c[key];
            }
          });
        }
      }
      
      // Normalize platform keys and post objects
      const normEntries = Object.entries(pbp).map(([plat, posts]) => {
        const key = toUi(String(plat));
        const arr = Array.isArray(posts) ? posts : [];
        return [key, arr.map((p: any) => ({ ...p, platform: toUi(p.platform || key) }))];
      });
      
      const normalizedConcept = {
        id: crypto.randomUUID(),
        title: c.title || c.name || `Concept ${idx + 1}`,
        promise: c.promise || c.one_line_promise || '',
        cadence: c.cadence || { days: 7, posts: 5 },
        key_messages: c.key_messages || [],
        suggested_platforms: Array.isArray(c.suggested_platforms) ? c.suggested_platforms.map(toUi) : [],
        posts_by_platform: Object.fromEntries(normEntries),
        goal: c.goal,
        audience: Array.isArray(c.audience) ? c.audience : (c.audience ? [c.audience] : [])
      };
      
      return normalizedConcept;
    });

    // Diagnostics for debugging
    concepts.forEach((c: any, idx: number) => {
      const keys = Object.keys(c.posts_by_platform || {});
      const counts = Object.fromEntries(keys.map((k: string) => [k, (c.posts_by_platform?.[k] || []).length]));
      console.log(`[generate-campaign-concepts] Concept ${idx}:`, { 
        title: c.title, 
        platform_keys: keys, 
        post_counts: counts 
      });
      
      const totalPosts = Object.values(c.posts_by_platform).flat().length;
      if (totalPosts === 0) {
        console.warn(`[generate-campaign-concepts] Warning: Concept "${c.title}" has NO POSTS`);
      }
    });

    console.log('[generate-campaign-concepts] Returning', concepts.length, 'normalized concepts');

    return new Response(JSON.stringify({ concepts }), {
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
