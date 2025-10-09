import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

Deno.serve(async (req) => {
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

    // Call Lovable AI
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
            content: 'You are a social media strategist. Always respond with valid JSON only. No markdown, no explanations.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generate-campaign-concepts] AI error:', response.status, errorText);
      throw new Error(`AI generation failed: ${response.status}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    
    if (!rawContent) {
      throw new Error('No content in AI response');
    }

    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch (e) {
      console.error('[generate-campaign-concepts] JSON parse error:', e, rawContent);
      throw new Error('Invalid JSON from AI');
    }

    // Ensure structure
    const concepts = (parsed.concepts || [parsed] || []).map((c: any, idx: number) => ({
      id: crypto.randomUUID(),
      title: c.title || `Concept ${idx + 1}`,
      promise: c.promise || c.one_line_promise || '',
      cadence: c.cadence || { days: 7, posts: 5 },
      key_messages: c.key_messages || [],
      suggested_platforms: c.suggested_platforms || body.platforms,
      posts_by_platform: c.posts_by_platform || {}
    }));

    console.log('[generate-campaign-concepts] Generated', concepts.length, 'concepts');

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
