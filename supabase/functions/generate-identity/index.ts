import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SVG sanitization function
function sanitizeSVG(svgString: string): string {
  // Basic SVG sanitization - allow only safe tags and attributes
  const allowedTags = ['svg', 'g', 'path', 'rect', 'circle', 'text', 'defs', 'linearGradient', 'stop'];
  const allowedAttrs = ['viewBox', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'd', 'x', 'y', 'rx', 'ry', 'cx', 'cy', 'r', 'font-family', 'font-size', 'text-anchor', 'id', 'x1', 'y1', 'x2', 'y2', 'offset', 'stop-color'];
  
  // Remove script tags, event handlers, and external references
  const cleaned = svgString
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/href="[^"]*"/gi, '');
  
  // Fallback to simple text logo if sanitization fails
  if (!cleaned.includes('<svg') || cleaned.length > 20000) {
    return `<svg viewBox="0 0 320 80" width="320" height="80" xmlns="http://www.w3.org/2000/svg">
      <rect width="320" height="80" fill="#2563eb"/>
      <text x="160" y="45" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">LOGO</text>
    </svg>`;
  }
  
  return cleaned;
}

// Rate limiting function
async function checkRateLimit(userId: string): Promise<boolean> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'identity')
    .gte('created_at', oneMinuteAgo);
  
  return (count || 0) < 4; // Max 4 requests per minute
}

async function logUsage(userId: string) {
  await supabase
    .from('ai_usage')
    .insert({ user_id: userId, kind: 'identity' });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Edge function called with headers:', req.headers.get('authorization') ? 'Authorization present' : 'No authorization');
    
    // Try to authenticate, but allow anonymous users
    let user = null;
    const authHeader = req.headers.get('authorization');
    
    if (authHeader) {
      console.log('Attempting to verify user authentication...');
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(
          authHeader.replace('Bearer ', '')
        );
        
        if (!authError && authUser) {
          user = authUser;
          console.log('User authenticated successfully:', user.id);
        } else {
          console.log('Authentication failed, proceeding as anonymous user:', authError?.message);
        }
      } catch (authException) {
        console.log('Authentication exception, proceeding as anonymous user:', String(authException));
      }
    } else {
      console.log('No authorization header, proceeding as anonymous user');
    }

    // Check rate limit only for authenticated users
    if (user) {
      const canProceed = await checkRateLimit(user.id);
      if (!canProceed) {
        console.error('Rate limit exceeded for user:', user.id);
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait before trying again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.log('Skipping rate limit check for anonymous user');
    }

    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { idea, audience, experience, namingPreference, firstName, tone, regenerateNamesOnly } = requestBody;

    if (!idea || !audience) {
      console.error('Missing required fields:', { idea: !!idea, audience: !!audience });
      return new Response(JSON.stringify({ error: 'Missing required fields: idea, audience' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create OpenAI prompt - different for name regeneration vs full identity
    let systemPrompt, userPrompt;

    if (regenerateNamesOnly) {
      systemPrompt = `You are a brand strategist. Return strict JSON with ONLY nameOptions:
{
  "nameOptions": ["Name 1", "Name 2", "Name 3", "Name 4", "Name 5", "Name 6", "Name 7"]
}

Generate 7 unique, creative business name options.`;

      userPrompt = `Generate NEW business name options for:
- Idea: ${idea}
- Target audience: ${audience}
- Naming preference: ${namingPreference || 'anonymous'}
- First name: ${firstName || 'Not provided'}

These should be completely different from any previous suggestions. Make them creative, memorable, and relevant.`;
    } else {
      systemPrompt = `You are a brand strategist. Return strict JSON matching this exact schema:
{
  "nameOptions": ["Name 1", "Name 2", "Name 3"],
  "tagline": "tagline here",
  "bio": "bio here", 
  "colors": ["#color1", "#color2", "#color3"],
  "logoSVG": "<svg>...</svg>"
}

Keep names unique, modern, and relevant to the idea and audience. Bio must sound human and specific (2-3 sentences). Logo must be a minimal, monochrome SVG wordmark with optional simple icon, viewBox="0 0 320 80", using only safe tags (svg, g, path, rect, circle, text). No scripts, no external references.`;

      userPrompt = `Generate a business identity for:
- Idea: ${idea}
- Target audience: ${audience}
- Experience/background: ${experience || 'Not specified'}
- Naming preference: ${namingPreference || 'anonymous'}
- First name: ${firstName || 'Not provided'}
- Tone: ${tone || 'professional'}

Provide 3-6 name options, one compelling tagline (max 80 chars), a personalized bio using first name and experience if provided, 3 brand colors, and a clean SVG logo.`;
    }

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    console.log('OpenAI response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `AI generation failed: ${response.status} ${response.statusText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
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

    // For name regeneration, skip everything else and just return names
    if (regenerateNamesOnly) {
      console.log('Returning regenerated names only');
      return new Response(JSON.stringify({
        nameOptions: generatedData.nameOptions
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Sanitize SVG
    generatedData.logoSVG = sanitizeSVG(generatedData.logoSVG);

    // Only save to database if user is authenticated
    let business = null;
    if (user) {
      console.log('Saving data for authenticated user...');
      
      // Ensure user profile exists
      await supabase
        .from('profiles')
        .upsert({ 
          user_id: user.id,
          display_name: firstName || user.user_metadata?.full_name || null,
          email: user.email 
        });

      // Create or update business record
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .upsert({
          owner_id: user.id,
          idea,
          audience,
          experience,
          naming_preference: namingPreference,
          business_name: generatedData.nameOptions[0],
          tagline: generatedData.tagline,
          bio: generatedData.bio,
          brand_colors: generatedData.colors,
          logo_svg: generatedData.logoSVG,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'owner_id'
        })
        .select()
        .single();

      if (businessError) {
        console.error('Database error:', businessError);
        return new Response(JSON.stringify({ error: 'Failed to save business data' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      business = businessData;
      
      // Log usage
      await logUsage(user.id);
    } else {
      console.log('Skipping database operations for anonymous user');
    }

    return new Response(JSON.stringify({
      business,
      nameOptions: generatedData.nameOptions,
      tagline: generatedData.tagline,
      bio: generatedData.bio,
      colors: generatedData.colors,
      logoSVG: generatedData.logoSVG
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-identity function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});