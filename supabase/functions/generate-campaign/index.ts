import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting function
async function checkRateLimit(userId: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'campaign')
    .gte('created_at', oneMinuteAgo);
  
  return (count || 0) < 4; // Max 4 requests per minute
}

async function logUsage(userId: string) {
  await supabase
    .from('ai_usage')
    .insert({ user_id: userId, kind: 'campaign' });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user from auth header
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check rate limit
    const canProceed = await checkRateLimit(user.id);
    if (!canProceed) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { businessId, type, platforms, background, motivation, tone } = await req.json();

    if (!businessId || !type || !platforms?.length) {
      return new Response(JSON.stringify({ error: 'Missing required fields: businessId, type, platforms' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get business data
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .eq('owner_id', user.id)
      .single();

    if (businessError || !business) {
      return new Response(JSON.stringify({ error: 'Business not found or unauthorized' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create campaign prompts based on type
    const campaignTemplates = {
      intro: 'story-driven introduction explaining why you started this business, who you help, with a soft call-to-action',
      quick_win: 'single actionable tip or checklist excerpt that provides immediate value, with save/share CTA',
      conversion: 'clear value proposition with specific offer and direct CTA to your storefront or product'
    };

    let systemPrompt: string;
    let userPrompt: string;

    if (type === 'intro') {
      systemPrompt = `You are writing introductory social media posts for a new business launch. The entrepreneur wants authentic, human content that reflects their personal journey.

CRITICAL RULES:
- Write in the first person ("I" / "my")
- Sound human, authentic, and conversational — avoid corporate jargon and AI-sounding phrases
- Match the specified tone/style (${tone || 'friendly'}) consistently throughout
- Show vulnerability and personality — real people have doubts, excitement, and learning moments
- NEVER use robotic phrases like "I'm thrilled to announce..." "Big moment!" "Exciting news!" unless the tone is explicitly Playful
- Transform raw user inputs into natural, polished storytelling — do NOT copy their exact words

Return strict JSON with TWO versions for EACH platform:

{
  "campaigns": [
    {
      "platform": "platform_name",
      "shortPost": {
        "caption": "2-3 sentence energetic announcement (<280 chars)",
        "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
      },
      "longPost": {
        "caption": "3-6 sentence authentic intro (500-800 chars) including: personal backstory, why they started, what the business offers, who it helps, vulnerability/challenges, call to action"
      }
    }
  ]
}

SHORT POST GUIDELINES (<280 characters):
- 2-3 sentences maximum
- Energetic but natural tone (avoid "thrilled to announce" unless tone is Playful)
- Focus on "going live" excitement
- Include 3-5 niche-specific hashtags
- Optional: 1-2 emojis if tone is Friendly/Playful (zero emojis if Professional)

LONG POST GUIDELINES:
- 3-6 sentences, 500-800 characters
- Introduce the person behind the business
- Share the "why" — personal motivation, backstory, passion
- Clearly describe what the business offers and who it helps
- Show authenticity and vulnerability (challenges, hopes, learning)
- End with inclusive call to action (e.g., "I'd love your feedback," "Follow along on this journey")
- NO hashtags unless explicitly relevant to the story`;

      userPrompt = `Write TWO versions of an introductory social media post for a new business launch:

Business Details:
- Business Name: ${business.business_name}
- Background/Expertise: ${background || business.bio}
${motivation ? `- Personal Motivation: ${motivation}` : ''}
- Tone/Style: ${tone || 'friendly'}
- Platforms: ${platforms.join(', ')}

Create both a short celebratory version AND a longer authentic story-driven version for each platform.

EXAMPLES OF GOOD SHORT POSTS:
1. "🚀 Big news! After years of [relevant experience], I'm launching [BusinessName] — [brief benefit for audience]. Can't wait to start this journey with you all! ✨ #NewBusiness #Entrepreneur #Launch"
2. "After 5 years of helping friends launch their side hustles, I'm finally starting my own! 🚀 Meet [BusinessName] — let's build something amazing together. #NewBeginnings #Entrepreneur #Launch"

EXAMPLES OF GOOD LONG POSTS (follow this 4-part structure):

1. "Hi everyone, I'm Sarah. As a fitness coach for the past decade, I've helped dozens of busy parents try to get back in shape. Time and time again, I saw the same pattern: they'd start strong, then life would get in the way. I realized traditional fitness programs weren't built for real life. That's why I created [BusinessName] — a flexible, family-friendly program designed for parents who want to prioritize their health without sacrificing family time. I'm not claiming to have all the answers, but I'm learning as I go and would love to hear from other parents navigating this journey. What's your biggest fitness challenge?"

2. "Hi everyone, I'm Alex. I never planned on becoming an entrepreneur. But after watching my dad struggle to find simple, affordable legal templates for his small business, I knew there had to be a better way. [BusinessName] is my answer to that problem — straightforward legal tools for everyday entrepreneurs who can't afford a $500/hour lawyer. I'm still figuring a lot of this out, and I'd love your feedback as I build this. What legal challenges have you faced in your business?"

Generate authentic, human posts that sound like they were written by a real person, not an AI.`;
    } else {
      systemPrompt = `You are a social media copywriter. Return strict JSON with this schema:
{
  "campaigns": [
    {
      "platform": "platform_name",
      "hook": "hook text",
      "caption": "caption text", 
      "hashtags": ["#hashtag1", "#hashtag2"]
    }
  ]
}

Hooks are punchy (<100 chars). Captions 120-220 chars. Hashtags must be niche-specific; avoid generic #success/#motivation.`;

      userPrompt = `Create ${type} campaign posts for ${business.business_name}:
- Business: ${business.business_name}
- Audience: ${business.audience}
- Bio: ${business.bio}
- Tagline: ${business.tagline}
- Platforms: ${platforms.join(', ')}
- Type: ${campaignTemplates[type as keyof typeof campaignTemplates]}

Generate platform-optimized content for each platform that uses the business name and speaks directly to the target audience.`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('Lovable AI API error:', await response.text());
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Strip markdown code fences if present
    if (content.includes('```json')) {
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    } else if (content.includes('```')) {
      content = content.replace(/```\s*/g, '');
    }

    let generatedData;
    try {
      generatedData = JSON.parse(content.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        business_id: businessId,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Campaign`,
        type,
        objective: campaignTemplates[type as keyof typeof campaignTemplates]
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      return new Response(JSON.stringify({ error: 'Failed to create campaign' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create campaign items for each platform
    const campaignItems = generatedData.campaigns.map((item: any) => {
      if (type === 'intro') {
        // For intro campaigns, create two items per platform (short and long)
        return [
          {
            campaign_id: campaign.id,
            platform: item.platform,
            hook: 'Short Version',
            caption: item.shortPost.caption,
            hashtags: item.shortPost.hashtags || []
          },
          {
            campaign_id: campaign.id,
            platform: item.platform,
            hook: 'Long Version',
            caption: item.longPost.caption,
            hashtags: []
          }
        ];
      } else {
        return {
          campaign_id: campaign.id,
          platform: item.platform,
          hook: item.hook,
          caption: item.caption,
          hashtags: item.hashtags
        };
      }
    }).flat();

    const { data: items, error: itemsError } = await supabase
      .from('campaign_items')
      .insert(campaignItems)
      .select();

    if (itemsError) {
      console.error('Campaign items creation error:', itemsError);
      return new Response(JSON.stringify({ error: 'Failed to create campaign items' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log usage
    await logUsage(user.id);

    return new Response(JSON.stringify({
      campaign,
      items
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-campaign function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});