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
    
    const { 
      idea, 
      audience, 
      experience, 
      namingPreference, 
      firstName, 
      lastName,
      tone, 
      styleWord,
      styleCategory,
      regenerateNamesOnly 
    } = requestBody;

    if (!idea || !audience) {
      console.error('Missing required fields:', { idea: !!idea, audience: !!audience });
      return new Response(JSON.stringify({ error: 'Missing required fields: idea, audience' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!lovableApiKey) {
      console.error('Lovable API key not configured');
      return new Response(JSON.stringify({ error: 'AI service unavailable' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create AI prompts - different for name regeneration vs full identity
    let systemPrompt: string;
    let userPrompt: string;

    if (regenerateNamesOnly) {
      systemPrompt = `You are an expert branding consultant specializing in business naming. Generate ${namingPreference === 'with_personal_name' ? 'name variations that incorporate the personal name naturally' : `${styleCategory || 'brandable'} business names`}.

CRITICAL NAMING RULES:
- Names MUST be SHORT (1-3 words max)
- Names MUST be MEMORABLE and BRANDABLE
- STRICTLY AVOID these overused words: Magic, Haven, Corner, Solutions, Group, Hub, Studio, Edge, Peak, Core, Nexus, Spark
- Be SPECIFIC to the business idea, not generic
- Match the style: ${styleCategory || 'professional'}
- ${styleWord ? `Incorporate this style essence: ${styleWord}` : ''}

Style Guidelines:
- Professional: Clear, authoritative, trust-building (e.g., "Meridian Advisory", "Anchor Partners")
- Playful: Fun, memorable, friendly (e.g., "Wiggle Room", "Bumble Bee Coaching")
- Minimalist: Clean, simple, modern (e.g., "Base", "Form Collective")
- Visionary: Bold, forward-thinking (e.g., "Horizon Labs", "Frontier Guild")

Return ONLY a JSON object with this structure:
{
  "nameOptions": ["Name1", "Name2", "Name3", "Name4", "Name5", "Name6"]
}`;

      const nameInstruction = namingPreference === 'with_personal_name' 
        ? `Create variations using "${firstName}${lastName ? ' ' + lastName : ''}" (e.g., "${firstName} ${idea.split(' ')[0]}", "${lastName || firstName} Advisory")`
        : 'Create unique, brandable names';

      userPrompt = `Generate 6 ${styleCategory || 'brandable'} business name options:

Business Concept: ${idea}
Target Audience: ${audience}
Style Category: ${styleCategory || 'professional'}
${styleWord ? `Style Word: ${styleWord}` : ''}
${namingPreference === 'with_personal_name' ? `Personal Name to Incorporate: ${firstName}${lastName ? ' ' + lastName : ''}` : ''}
Tone: ${tone}

${nameInstruction}

Remember: Avoid all generic/overused terms. Be specific, memorable, and match the ${styleCategory || 'professional'} style.`;
    } else {
      systemPrompt = `You are an expert business identity generator. Create compelling, unique business identities that feel authentic and avoid generic corporate clichés.

CRITICAL NAMING RULES:
- Business names MUST be SHORT (1-3 words max)
- STRICTLY AVOID: Magic, Haven, Corner, Solutions, Group, Hub, Studio, Edge, Peak, Core, Nexus, Spark, Sphere
- Be SPECIFIC to the business concept and style category
- Make names MEMORABLE and BRANDABLE
- Match the requested style: ${styleCategory || 'professional'}
- ${styleWord ? `Embody this style essence: ${styleWord}` : ''}

Style Guidelines:
- Professional: Trustworthy, established, clear (e.g., "Momentum Consulting", "Blueprint Advisory")
- Playful: Fun, approachable, memorable (e.g., "Happy Trails", "Sunshine Coaching")  
- Minimalist: Clean, simple, modern (e.g., "Base", "Form", "Clear Path")
- Visionary: Bold, disruptive, forward-thinking (e.g., "Frontier Group", "Vanguard Labs")

Return ONLY valid JSON with this structure:
{
  "nameOptions": ["Name1", "Name2", "Name3", "Name4"],
  "tagline": "Compelling 5-10 word tagline (max 80 chars)",
  "bio": "2-3 sentence personalized bio using founder's background and name",
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "logoSVG": "Clean, simple SVG logo that matches the style"
}`;

      const nameInstruction = namingPreference === 'with_personal_name'
        ? `Generate names that naturally incorporate "${firstName}${lastName ? ' ' + lastName : ''}" (e.g., "${firstName} ${idea.split(' ')[0]}", "${lastName || firstName} ${styleCategory === 'professional' ? 'Advisory' : styleCategory === 'playful' ? 'Studio' : 'Co'}")`
        : `Generate ${styleCategory || 'professional'} names for the business`;

      userPrompt = `Generate a complete business identity:

Business Concept: ${idea}
Target Audience: ${audience}
Founder Background: ${experience}
${firstName ? `Founder Name: ${firstName}${lastName ? ' ' + lastName : ''}` : ''}
Style Category: ${styleCategory || 'professional'}
${styleWord ? `Style Word: ${styleWord}` : ''}
Tone: ${tone}

${nameInstruction}

Provide 4-6 ${styleCategory || 'professional'} name options, one compelling tagline (max 80 chars), a personalized bio (use "${firstName}" and reference their background: "${experience}"), 3 complementary brand colors that match the ${styleCategory || 'professional'} style, and a clean SVG logo.

REMEMBER: Avoid ALL generic/overused business terms. Be specific and match the ${styleCategory || 'professional'} aesthetic.`;
    }

    console.log('Calling Lovable AI API...');
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

    console.log('Lovable AI response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: `AI generation failed: ${response.status} ${response.statusText}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    console.log('Lovable AI response received successfully');
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