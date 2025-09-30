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

    const { businessId, type, platforms } = await req.json();

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

    const systemPrompt = `You are a social media copywriter. Return strict JSON with this schema:
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

    const userPrompt = `Create ${type} campaign posts for ${business.business_name}:
- Business: ${business.business_name}
- Audience: ${business.audience}
- Bio: ${business.bio}
- Tagline: ${business.tagline}
- Platforms: ${platforms.join(', ')}
- Type: ${campaignTemplates[type as keyof typeof campaignTemplates]}

Generate platform-optimized content for each platform that uses the business name and speaks directly to the target audience.`;

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
    const content = data.choices[0].message.content;

    let generatedData;
    try {
      generatedData = JSON.parse(content);
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
    const campaignItems = generatedData.campaigns.map((item: any) => ({
      campaign_id: campaign.id,
      platform: item.platform,
      hook: item.hook,
      caption: item.caption,
      hashtags: item.hashtags
    }));

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