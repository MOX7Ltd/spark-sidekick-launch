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
      motivation,
      namingPreference, 
      firstName, 
      lastName,
      tone, 
      styleCategory,
      regenerateNamesOnly,
      regenerateSingleName,
      bannedWords = [],
      rejectedNames = []
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

    // Build comprehensive banned words list
    const baseBannedWords = [
      'Magic', 'Haven', 'Corner', 'Solutions', 'Group', 'Hub', 'Studio', 
      'Edge', 'Peak', 'Core', 'Nexus', 'Spark', 'Sphere', 'Venture', 
      'Genesis', 'Blueprint', 'Capital', 'Pro', 'Plus', 'Global', 'Elite'
    ];
    const allBannedWords = [...new Set([...baseBannedWords, ...bannedWords])];
    const bannedWordsStr = allBannedWords.join(', ');
    const rejectedNamesStr = rejectedNames.length > 0 ? rejectedNames.join(', ') : '';

    if (regenerateSingleName) {
      // Generate just one replacement name
      systemPrompt = `You are an expert branding consultant. Generate ONE unique business name that avoids all previously rejected names and banned words.

CRITICAL NAMING RULES:
- Name MUST be SHORT (1-3 words max)
- Name MUST be MEMORABLE and BRANDABLE
- STRICTLY AVOID these words: ${bannedWordsStr}
${rejectedNamesStr ? `- DO NOT suggest any of these previously rejected names: ${rejectedNamesStr}` : ''}
- Be SPECIFIC to the business idea, not generic
- ${namingPreference === 'with_personal_name' ? 'Naturally incorporate the personal name if possible' : 'Create a unique brandable name'}

Return ONLY a JSON object:
{
  "name": "BusinessName",
  "style": "one of: Playful, Professional, Minimalist, Visionary, Invented, Compound, Metaphorical, Action-driven",
  "tagline": "Short 5-8 word tagline"
}`;

      userPrompt = `Generate 1 fresh business name option:

Business Concept: ${idea}
Target Audience: ${audience}
${namingPreference === 'with_personal_name' ? `Personal Name: ${firstName}${lastName ? ' ' + lastName : ''}` : ''}
${motivation ? `Founder Motivation: ${motivation}` : ''}
Tone: ${tone}

Make it COMPLETELY DIFFERENT from the rejected names. Avoid all banned words.`;

    } else if (regenerateNamesOnly) {
      systemPrompt = `You are an expert branding consultant specializing in business naming. Generate 7 SHORT, brandable business names across diverse styles.

CRITICAL NAMING RULES:
- Names MUST be SHORT (1-3 words max)
- Names MUST be MEMORABLE and BRANDABLE
- STRICTLY AVOID these overused words: ${bannedWordsStr}
${rejectedNamesStr ? `- DO NOT suggest any of these previously rejected names: ${rejectedNamesStr}` : ''}
- Be SPECIFIC to the business idea, not generic
- ${namingPreference === 'with_personal_name' ? 'Can naturally incorporate personal name where it fits' : 'Create unique brandable names'}

REQUIRED STYLE DIVERSITY - Generate exactly 7 names across these categories:
1. Playful / Quirky - Fun, memorable, friendly
2. Professional / Corporate - Clear, authoritative, trust-building  
3. Minimalist / Modern - Clean, simple, 1-2 words
4. Visionary / Inspirational - Bold, forward-thinking
5. Invented Word - Made-up but pronounceable word (e.g., "Zyra", "Novatra")
6. Compound Blend - Two words merged creatively (e.g., "HiveMind", "SkillForge")
7. Metaphorical - Uses imagery/symbolism (e.g., "Sparkline", "Northstar")

Return ONLY a JSON object with this structure:
{
  "nameOptions": [
    {"name": "Name1", "style": "Playful", "tagline": "Short tagline"},
    {"name": "Name2", "style": "Professional", "tagline": "Short tagline"},
    {"name": "Name3", "style": "Minimalist", "tagline": "Short tagline"},
    {"name": "Name4", "style": "Visionary", "tagline": "Short tagline"},
    {"name": "Name5", "style": "Invented", "tagline": "Short tagline"},
    {"name": "Name6", "style": "Compound", "tagline": "Short tagline"},
    {"name": "Name7", "style": "Metaphorical", "tagline": "Short tagline"}
  ]
}`;

      const nameInstruction = namingPreference === 'with_personal_name' 
        ? `Can incorporate "${firstName}${lastName ? ' ' + lastName : ''}" naturally where appropriate, but prioritize diversity across all 7 styles`
        : 'Create 7 unique, brandable names across all required styles';

      userPrompt = `Generate 7 business name options with MAXIMUM DIVERSITY:

Business Concept: ${idea}
Target Audience: ${audience}
${namingPreference === 'with_personal_name' ? `Personal Name (optional use): ${firstName}${lastName ? ' ' + lastName : ''}` : ''}
${motivation ? `Founder Motivation: ${motivation}` : ''}
Tone: ${tone}

${nameInstruction}

Remember: 
- Avoid ALL generic/overused terms and banned words
- Each name must represent a DIFFERENT style category
- Be specific, memorable, and unique
- Keep taglines to 5-8 words max`;
    } else {
      systemPrompt = `You are an expert business identity generator. Create compelling, unique business identities that feel authentic and avoid generic corporate clichés.

CRITICAL NAMING RULES:
- Business names MUST be SHORT (1-3 words max)
- STRICTLY AVOID: Magic, Haven, Corner, Solutions, Group, Hub, Studio, Edge, Peak, Core, Nexus, Spark, Sphere, Venture, Genesis, Blueprint, Capital
- Be SPECIFIC to the business concept and style category
- Make names MEMORABLE and BRANDABLE
- Match the requested style: ${styleCategory || 'professional'}

Style Guidelines based on tone:
- Professional: Trustworthy, established, clear (e.g., "Momentum Consulting", "Anchor Partners")
- Playful: Fun, approachable, memorable (e.g., "Happy Trails", "Sunshine Coaching")  
- Minimalist: Clean, simple, modern (e.g., "Base", "Form", "Clear Path")
- Visionary: Bold, disruptive, forward-thinking (e.g., "Frontier Group", "Vanguard Labs")
- Educational: Clear, informative, helpful (e.g., "Learn Path", "Guide House")

BIO GUIDELINES:
- Length: 2-3 sentences
- Tone: Warm, approachable, aligned with user's style
- Must feel authentic and personal, not corporate or robotic
- Include a hint of the user's "why" from their motivation if provided
- Write in first person if founder name is provided

Return ONLY valid JSON with this structure:
{
  "nameOptions": [
    {"name": "Name1", "style": "Professional", "tagline": "Short tagline"},
    {"name": "Name2", "style": "Playful", "tagline": "Short tagline"},
    {"name": "Name3", "style": "Minimalist", "tagline": "Short tagline"},
    {"name": "Name4", "style": "Visionary", "tagline": "Short tagline"}
  ],
  "tagline": "Compelling 5-10 word tagline (max 80 chars)",
  "bio": "2-3 sentence personalized bio using founder's background and motivation",
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "logoSVG": "Clean, simple SVG logo that matches the style"
}`;

      const nameInstruction = namingPreference === 'with_personal_name'
        ? `Generate diverse name styles that can naturally incorporate "${firstName}${lastName ? ' ' + lastName : ''}" where appropriate`
        : `Generate diverse ${styleCategory || 'professional'} name styles for the business`;

      userPrompt = `Generate a complete business identity with diverse name options:

Business Concept: ${idea}
Target Audience: ${audience}
Founder Background: ${experience}
${motivation ? `Founder Motivation: ${motivation}` : ''}
${firstName ? `Founder Name: ${firstName}${lastName ? ' ' + lastName : ''}` : ''}
Style Category: ${styleCategory || 'professional'}
Tone: ${tone}

${nameInstruction}

Provide 4-6 name options with style diversity, one compelling tagline (max 80 chars), a personalized bio (use "${firstName}" and reference their background: "${experience}"), 3 complementary brand colors that match the ${styleCategory || 'professional'} style, and a clean SVG logo.

REMEMBER: Avoid ALL generic/overused business terms (${bannedWordsStr}). Be specific and provide variety across different naming styles.`;
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

    // For single name regeneration
    if (regenerateSingleName) {
      console.log('Returning single regenerated name');
      return new Response(JSON.stringify({
        nameOption: generatedData
      }), {
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

    // Generate product descriptions
    console.log('Generating product descriptions...');
    const productDescriptionPrompt = `You are creating short, outcomes-focused product descriptions for digital products in a new entrepreneur's storefront.

Inputs:
- Business Idea: ${idea}
- Target Audience: ${audience}
- Tone/Style: ${tone || 'Professional and friendly'}

Generate exactly 3 products that match this business idea. For each product:
- Create a practical product title (2-4 words)
- Generate a product type/category
- Set a reasonable price between $19-$297
- Write a description (1-2 sentences, max 30 words) focused on outcomes and benefits

Rules for descriptions:
- Focus on outcomes and benefits for the customer (not just features)
- Make it sound practical, clear, and inspiring
- Write in plain, human language (avoid jargon)
- Each description should feel like it adds real value and makes the product purchase-worthy

Return ONLY valid JSON with no markdown formatting:
{
  "products": [
    {
      "title": "Product Name",
      "type": "Product Type",
      "price": "$XX",
      "description": "Outcome-focused description here"
    }
  ]
}`;

    const productResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: productDescriptionPrompt }
        ],
      }),
    });

    let products = [];
    if (productResponse.ok) {
      const productData = await productResponse.json();
      let productContent = productData.choices[0].message.content;
      
      // Strip markdown code fences if present
      if (productContent.includes('```json')) {
        productContent = productContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (productContent.includes('```')) {
        productContent = productContent.replace(/```\s*/g, '');
      }
      
      try {
        const productJson = JSON.parse(productContent.trim());
        products = productJson.products || [];
        console.log('Generated products:', products);
      } catch (parseError) {
        console.error('Failed to parse product response:', productContent);
      }
    } else {
      console.error('Product generation failed:', productResponse.status);
    }

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
      // Extract first name from nameOptions (handle both formats)
      const firstNameOption = typeof generatedData.nameOptions[0] === 'string' 
        ? generatedData.nameOptions[0] 
        : generatedData.nameOptions[0].name;

      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .upsert({
          owner_id: user.id,
          idea,
          audience,
          experience,
          naming_preference: namingPreference,
          business_name: firstNameOption,
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
      logoSVG: generatedData.logoSVG,
      products
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