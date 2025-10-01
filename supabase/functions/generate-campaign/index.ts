import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';
import { normalizeOnboardingInput } from '../_shared/normalize.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry, x-feature-flags',
};

const requestSchema = z.object({
  businessId: z.string().uuid().optional(),
  type: z.string().min(1),
  platforms: z.array(z.string()).min(1),
  businessName: z.string().optional(),
  tagline: z.string().optional(),
  audience: z.string().optional(),
  background: z.string().optional(),
  motivation: z.string().optional(),
  tone: z.string().optional(),
  firstName: z.string().optional(),
  products: z.array(z.string()).optional(),
});

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
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || traceId;
  const featureFlags = parseFeatureFlags(req.headers);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Attempting to verify user authentication...');
    console.log('[generate-campaign] Feature flags:', featureFlags);
    
    // Check for cached response
    const cachedResponse = await checkIdempotency(sessionId, idempotencyKey, 'campaign');
    if (cachedResponse) {
      console.log('Returning cached campaign for idempotency key:', idempotencyKey);
      return new Response(JSON.stringify({
        ...cachedResponse,
        deduped: true,
        idempotency_key: idempotencyKey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const authHeader = req.headers.get('authorization');
    
    let user = null;
    
    if (authHeader) {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (!authError && authUser) {
          user = authUser;
          console.log('User authenticated:', user.id);
          
          // Check rate limit for authenticated users
          const canProceed = await checkRateLimit(user.id);
          if (!canProceed) {
            const durationMs = Math.round(performance.now() - startTime);
            return new Response(JSON.stringify({ 
              error: 'Rate limit exceeded. Please wait before trying again.',
              trace_id: traceId,
              session_id: sessionId,
              duration_ms: durationMs,
              ok: false,
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          console.log('Authentication failed, proceeding as anonymous user:', authError?.message);
        }
      } catch (e) {
        console.log('Auth verification error, proceeding as anonymous user:', e);
      }
    } else {
      console.log('No auth header provided, proceeding as anonymous user');
    }

    const requestBody = await req.json();
    
    // Validate input
    const validationResult = requestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const durationMs = Math.round(performance.now() - startTime);
      return new Response(JSON.stringify({
        error: 'Invalid input',
        field_errors: validationResult.error.flatten().fieldErrors,
        trace_id: traceId,
        session_id: sessionId,
        duration_ms: durationMs,
        ok: false,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { businessId, type, platforms, background, motivation, tone, firstName, businessName, audience, tagline, products } = validationResult.data;
    
    // Normalize inputs
    const normalized = normalizeOnboardingInput({ audiences: audience ? [audience] : [], vibes: tone ? [tone] : [], products: products || [] });

    // For anonymous users, we need to use the provided business data in the request
    // For authenticated users, we can fetch from the database
    let business;
    
    if (user && businessId) {
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .eq('owner_id', user.id)
        .single();

      if (businessError || !businessData) {
        return new Response(JSON.stringify({ error: 'Business not found or unauthorized' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      business = businessData;
    } else {
      // For anonymous users during onboarding, use provided data
      if (!businessName) {
        return new Response(JSON.stringify({ error: 'businessName is required for anonymous users' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      business = {
        business_name: businessName,
        audience: audience || 'your target audience',
        bio: background || '',
        tagline: tagline || ''
      };
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

🚨 CRITICAL: DO NOT COPY RAW USER INPUT DIRECTLY 🚨
The user will provide raw inputs like "I've raised 5 children" or "I see families struggling". You MUST transform these into natural, grammatically correct sentences. NEVER paste their exact words mid-sentence.

❌ BAD EXAMPLES (broken grammar from pasting raw inputs):
- "After years of I've raised 5 children, I'm launching..." ← WRONG
- "I've spent years working in I've raised 5 children..." ← WRONG
- "As someone who I see families struggling..." ← WRONG

✅ GOOD EXAMPLES (transformed into natural language):
- "After raising five kids over the years, I'm launching..."
- "I've spent years raising five children and learning..."
- "As someone who has seen families struggle..."

TRANSFORMATION GUIDE:
Raw Input → Natural Transformation
"I've raised 5 children" → "raising five kids" or "as a parent of five" or "with five children"
"I see families struggling" → "I've seen families struggle" or "watching families navigate..."
"I had to learn how to..." → "I learned how to..." or "I developed strategies to..."

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
${firstName ? `- First Name: ${firstName}` : ''}
- Business Name: ${business.business_name}
- Background/Expertise: ${background || business.bio}
${motivation ? `- Personal Motivation: ${motivation}` : ''}
${tagline ? `- Tagline: ${tagline}` : ''}
${products && products.length > 0 ? `- Products/Services: ${products.join(', ')}` : ''}
- Target Audience: ${audience || business.audience}
- Tone/Style: ${tone || 'friendly'}
- Platforms: ${platforms.join(', ')}

Create both a short celebratory version AND a longer authentic story-driven version for each platform. ${firstName ? `Use the first name "${firstName}" when introducing yourself in the posts.` : ''}

${products && products.length > 0 ? 'IMPORTANT: Naturally mention at least ONE of the products/services in the posts to give concrete examples of what you offer.' : ''}

REMEMBER: Transform the user's raw inputs into polished narrative. If they say "I've raised 5 children", write "raising five kids" or "as a parent of five". Never copy-paste their exact phrasing mid-sentence.

EXAMPLES OF GOOD SHORT POSTS (natural, grammatically correct):
1. "🚀 Big news! After years of raising five kids and learning how to stay organized through the chaos, I'm launching [BusinessName] — a space to help parents find balance and joy. Can't wait to start this journey with you all! ✨"
2. "After helping friends launch their side hustles for years, I'm finally starting my own! 🚀 Meet [BusinessName] — let's build something amazing together."

EXAMPLES OF GOOD LONG POSTS (follow this 4-part structure: Intro → Story → Mission → Close):

1. "Hi everyone, I'm Sarah. As a fitness coach for the past decade, I've helped dozens of busy parents try to get back in shape. Time and time again, I saw the same pattern: they'd start strong, then life would get in the way. I realized traditional fitness programs weren't built for real life. That's why I created [BusinessName] — a flexible, family-friendly program designed for parents who want to prioritize their health without sacrificing family time. I'm not claiming to have all the answers, but I'm learning as I go and would love to hear from other parents navigating this journey. What's your biggest fitness challenge?"

2. "Hi everyone, I'm Alex. I never planned on becoming an entrepreneur. But after watching my dad struggle to find simple, affordable legal templates for his small business, I knew there had to be a better way. [BusinessName] is my answer to that problem — straightforward legal tools for everyday entrepreneurs who can't afford a $500/hour lawyer. I'm still figuring a lot of this out, and I'd love your feedback as I build this. What legal challenges have you faced in your business?"

3. "Hi everyone, I'm Paul. As a parent of five, I know firsthand the chaos and joy of family life. Over the years I've learned that staying organized isn't about perfection — it's about finding small strategies that make life feel lighter. That's why I created [BusinessName]: to help parents like me simplify the chaos and focus on what really matters. I'm not claiming to have all the answers, but I'm passionate about learning, sharing, and growing together. I'd love your support and feedback as I take this leap — and I can't wait to hear your own stories about what helps you stay balanced at home."

CRITICAL REMINDER: You are transforming raw user inputs into polished narrative prose. NEVER insert their exact words mid-sentence. Review every post for grammar errors before returning it.

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

    // For anonymous users, skip database operations and return generated content directly
    if (!user || !businessId) {
      console.log('Anonymous user - returning campaign items without database storage');
      
      const formattedItems = generatedData.campaigns.map((item: any) => {
        if (type === 'intro') {
          return [
            {
              platform: item.platform,
              hook: 'Short Version',
              caption: item.shortPost.caption,
              hashtags: item.shortPost.hashtags || []
            },
            {
              platform: item.platform,
              hook: 'Long Version',
              caption: item.longPost.caption,
              hashtags: []
            }
          ];
        } else {
          return {
            platform: item.platform,
            hook: item.hook,
            caption: item.caption,
            hashtags: item.hashtags
          };
        }
      }).flat();
      
      return new Response(JSON.stringify({
        campaign: {
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Campaign`,
          type,
          objective: campaignTemplates[type as keyof typeof campaignTemplates]
        },
        items: formattedItems
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create campaign record for authenticated users
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

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      campaign,
      items,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      applied_defaults: normalized.appliedDefaults.length > 0 ? normalized.appliedDefaults : undefined,
      feature_flags: featureFlags,
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, 'campaign', requestHash, responseData);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('Error in generate-campaign function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
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
