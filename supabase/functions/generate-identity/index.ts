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
      includeFirstName = false,
      includeLastName = false,
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

    // Build comprehensive banned words list - includes awkward and obscure words
    const baseBannedWords = [
      'Magic', 'Haven', 'Corner', 'Solutions', 'Group', 'Hub', 'Studio', 
      'Edge', 'Peak', 'Core', 'Nexus', 'Spark', 'Sphere', 'Venture', 
      'Genesis', 'Blueprint', 'Capital', 'Pro', 'Plus', 'Global', 'Elite',
      // Awkward/obscure words to avoid
      'Pylon', 'Pith', 'Apex', 'Zenith', 'Paradigm', 'Synergy', 'Leverage',
      'Pivot', 'Disrupt', 'Quantum', 'Matrix', 'Vortex', 'Cipher', 'Prism'
    ];
    const allBannedWords = [...new Set([...baseBannedWords, ...bannedWords])];
    const bannedWordsStr = allBannedWords.join(', ');
    const rejectedNamesStr = rejectedNames.length > 0 ? rejectedNames.join(', ') : '';
    
    // Analyze rejected patterns to learn from feedback
    const rejectedPatterns: string[] = [];
    rejectedNames.forEach((name: string) => {
      if (typeof name === 'string') {
        if (name.includes("'s")) rejectedPatterns.push("possessive format");
        if (name.split(' ').length > 2) rejectedPatterns.push("too many words");
      }
    });

    if (regenerateSingleName) {
      // Determine archetype diversity based on existing names
      const archetypes = ['Professional & Trustworthy', 'Creative & Visionary', 'Playful & Memorable', 'Personalized'];
      const randomArchetype = archetypes[Math.floor(Math.random() * archetypes.length)];
      
      let nameGuidelines = 'Create unique, brandable names without personal names.';
      if (namingPreference === 'with_personal_name') {
        if (includeFirstName && includeLastName) {
          nameGuidelines = `Use BOTH "${firstName}" AND "${lastName}" in creative ways (e.g., "${firstName} ${lastName} Advisory", "${lastName} & ${firstName} Studio"). Avoid using only one name.`;
        } else if (includeLastName) {
          nameGuidelines = `Use ONLY "${lastName}" (surname) + descriptor (e.g., "${lastName} Advisory", "${lastName} Partners", "${lastName} Studio"). DO NOT use "${firstName}".`;
        } else if (includeFirstName) {
          nameGuidelines = `Use ONLY "${firstName}" (first name) + descriptor (e.g., "${firstName}'s Studio", "${firstName} Lab", "${firstName} Coaching"). DO NOT use "${lastName}".`;
        }
      }

      systemPrompt = `You are an expert branding consultant. Generate ONE unique business name from the "${randomArchetype}" archetype.

BRAND ARCHETYPES:
1. Professional & Trustworthy - Clear, authoritative, established (e.g., "Morris Advisory", "Anchor Partners")
2. Creative & Visionary - Innovative, forward-thinking, bold (e.g., "BrightForge", "Launchpad Studio")
3. Playful & Memorable - Fun, approachable, friendly (e.g., "SideHustle Spark", "BizNest")
4. Personalized - Incorporates founder name naturally (e.g., "Morris Ventures", "Sarah's Studio")

CRITICAL NAMING RULES:
- Name MUST be SHORT (1-3 words max)
- Name MUST be MEMORABLE and BRANDABLE
- STRICTLY AVOID these words: ${bannedWordsStr}
- AVOID awkward, obscure, archaic, or overly technical words
- DO NOT use possessive formats ("___'s ___") unless extremely natural
${rejectedNamesStr ? `- DO NOT suggest any of these previously rejected names: ${rejectedNamesStr}` : ''}
${rejectedPatterns.length > 0 ? `- Avoid these patterns: ${rejectedPatterns.join(', ')}` : ''}
- Be SPECIFIC to the business idea, not generic
- ${nameGuidelines}

Return ONLY a JSON object:
{
  "name": "BusinessName",
  "archetype": "${randomArchetype}",
  "tagline": "5-8 word tagline that reflects the archetype and outcome focus"
}`;

      let personalNameInfo = '';
      if (namingPreference === 'with_personal_name') {
        if (includeFirstName && includeLastName) {
          personalNameInfo = `Personal Names: First="${firstName}", Last="${lastName}" (Use BOTH)`;
        } else if (includeLastName) {
          personalNameInfo = `Surname ONLY: "${lastName}" (DO NOT use "${firstName}")`;
        } else if (includeFirstName) {
          personalNameInfo = `First Name ONLY: "${firstName}" (DO NOT use "${lastName}")`;
        }
      }

      userPrompt = `Generate 1 fresh business name from the "${randomArchetype}" archetype:

Business Concept: ${idea}
Target Audience: ${audience}
${personalNameInfo}
${motivation ? `Founder Motivation: ${motivation}` : ''}
Tone: ${tone}

Make it COMPLETELY DIFFERENT from the rejected names. Focus on the "${randomArchetype}" archetype qualities.`;

    } else if (regenerateNamesOnly) {
      let nameGuidelines = 'Create unique, brandable names across all archetypes without personal names.';
      if (namingPreference === 'with_personal_name') {
        if (includeFirstName && includeLastName) {
          nameGuidelines = `PERSONAL NAME USAGE RULES:
- Use BOTH "${firstName}" AND "${lastName}" in creative combinations
- Examples: "${firstName} ${lastName} Advisory", "${lastName} & ${firstName} Co."
- At least 4-5 names should include BOTH names
- DO NOT use only one name in isolation`;
        } else if (includeLastName) {
          nameGuidelines = `PERSONAL NAME USAGE RULES:
- Use ONLY the surname "${lastName}" (e.g., "${lastName} Advisory", "${lastName} Partners", "${lastName} Studio")
- STRICTLY FORBIDDEN: Do NOT use the first name "${firstName}"
- At least 5-6 names should include "${lastName}"
- 2-3 names can be without personal name for variety`;
        } else if (includeFirstName) {
          nameGuidelines = `PERSONAL NAME USAGE RULES:
- Use ONLY the first name "${firstName}" (e.g., "${firstName}'s Studio", "${firstName} Lab", "${firstName} Coaching")
- STRICTLY FORBIDDEN: Do NOT use the last name "${lastName}"
- At least 5-6 names should include "${firstName}"
- 2-3 names can be without personal name for variety`;
        }
      }

      systemPrompt = `You are an expert branding consultant. Generate 8 SHORT, brandable business names across 4 distinct BRAND ARCHETYPES.

BRAND ARCHETYPES (Generate 2 names per archetype):
1. Professional & Trustworthy - Clear, authoritative, established (e.g., "Morris Advisory", "Anchor Partners", "Blueprint Co.")
2. Creative & Visionary - Innovative, forward-thinking, bold (e.g., "BrightForge", "Launchpad Studio", "Momentum Lab")
3. Playful & Memorable - Fun, approachable, friendly (e.g., "SideHustle Spark", "BizNest", "Happy Trails")
4. Personalized (if applicable) - Incorporates founder name naturally (e.g., "Morris Ventures", "Sarah's Studio")

CRITICAL NAMING RULES:
- Names MUST be SHORT (1-3 words max)
- Names MUST be MEMORABLE and BRANDABLE
- STRICTLY AVOID these overused/awkward words: ${bannedWordsStr}
- AVOID obscure, archaic, overly technical, or awkward word combinations
- DO NOT repeat the same structural pattern (e.g., multiple "___'s ___" names)
${rejectedNamesStr ? `- DO NOT suggest any of these previously rejected names: ${rejectedNamesStr}` : ''}
${rejectedPatterns.length > 0 ? `- Avoid these patterns that were rejected: ${rejectedPatterns.join(', ')}` : ''}
- Ensure VARIETY in tone, length, and memorability
- ${nameGuidelines}

Return ONLY a JSON object with this structure:
{
  "nameOptions": [
    {"name": "Name1", "archetype": "Professional & Trustworthy", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name2", "archetype": "Professional & Trustworthy", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name3", "archetype": "Creative & Visionary", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name4", "archetype": "Creative & Visionary", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name5", "archetype": "Playful & Memorable", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name6", "archetype": "Playful & Memorable", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name7", "archetype": "Personalized", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name8", "archetype": "Personalized", "tagline": "Outcome-focused tagline (5-8 words)"}
  ]
}`;

      let personalNameInfo = '';
      if (namingPreference === 'with_personal_name') {
        if (includeFirstName && includeLastName) {
          personalNameInfo = `Founder Names: First="${firstName}", Last="${lastName}" (Use BOTH names)`;
        } else if (includeLastName) {
          personalNameInfo = `Surname ONLY: "${lastName}" (NEVER use "${firstName}")`;
        } else if (includeFirstName) {
          personalNameInfo = `First Name ONLY: "${firstName}" (NEVER use "${lastName}")`;
        }
      }

      userPrompt = `Generate 8 business name options with MAXIMUM VARIETY across all 4 brand archetypes:

Business Concept: ${idea}
Target Audience: ${audience}
${personalNameInfo}
${motivation ? `Founder Motivation: ${motivation}` : ''}
Tone: ${tone}

IMPORTANT:
- Generate 2 names per archetype (8 total)
- Each name must feel intentional, polished, and trustworthy
- Avoid ALL generic/overused terms and awkward combinations
- Ensure variety in length, structure, and tone
- Taglines should reflect the archetype and outcome focus
- Make names that feel professional and memorable, never clunky or laughable`;
    } else {
      let nameGuidelines = 'Create diverse brandable names across different archetypes.';
      if (namingPreference === 'with_personal_name') {
        if (includeFirstName && includeLastName) {
          nameGuidelines = `PERSONAL NAME USAGE:
- Use BOTH "${firstName}" AND "${lastName}" together
- Include 2-3 names with both names, rest without for variety`;
        } else if (includeLastName) {
          nameGuidelines = `PERSONAL NAME USAGE:
- Use ONLY "${lastName}" (e.g., "${lastName} Advisory", "${lastName} Studio")
- NEVER use "${firstName}"
- Include 1-2 names with "${lastName}", rest without for variety`;
        } else if (includeFirstName) {
          nameGuidelines = `PERSONAL NAME USAGE:
- Use ONLY "${firstName}" (e.g., "${firstName}'s Studio", "${firstName} Lab")
- NEVER use "${lastName}"
- Include 1-2 names with "${firstName}", rest without for variety`;
        }
      }

      systemPrompt = `You are an expert business identity generator. Create compelling, unique business identities using BRAND ARCHETYPES that feel authentic and avoid generic corporate clichés.

BRAND ARCHETYPES:
1. Professional & Trustworthy - Clear, authoritative, established (e.g., "Morris Advisory", "Anchor Partners")
2. Creative & Visionary - Innovative, forward-thinking, bold (e.g., "BrightForge", "Launchpad Studio")
3. Playful & Memorable - Fun, approachable, friendly (e.g., "SideHustle Spark", "BizNest")
4. Personalized - Incorporates founder name naturally (e.g., "Morris Ventures")

CRITICAL NAMING RULES:
- Business names MUST be SHORT (1-3 words max)
- STRICTLY AVOID: ${bannedWordsStr}
- AVOID obscure, awkward, archaic, or overly technical words
- DO NOT repeat the same structural pattern across names
- Be SPECIFIC to the business concept and archetype
- Make names MEMORABLE, BRANDABLE, and POLISHED
- Match the requested style: ${styleCategory || 'professional'}
- ${nameGuidelines}

BIO GUIDELINES:
- Length: 2-3 sentences
- Tone: Warm, approachable, aligned with user's style
- Must feel authentic and personal, not corporate or robotic
- Include a hint of the user's "why" from their motivation if provided
- Write in first person if founder name is provided

Return ONLY valid JSON with this structure:
{
  "nameOptions": [
    {"name": "Name1", "archetype": "Professional & Trustworthy", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name2", "archetype": "Creative & Visionary", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name3", "archetype": "Playful & Memorable", "tagline": "Outcome-focused tagline (5-8 words)"},
    {"name": "Name4", "archetype": "Personalized", "tagline": "Outcome-focused tagline (5-8 words)"}
  ],
  "tagline": "Compelling 5-10 word tagline (max 80 chars)",
  "bio": "2-3 sentence personalized bio using founder's background and motivation",
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "logoSVG": "Clean, simple SVG logo that matches the style"
}`;

      let personalNameInfo = '';
      if (firstName || lastName) {
        if (includeFirstName && includeLastName) {
          personalNameInfo = `Founder Names: First="${firstName}", Last="${lastName}" (Use BOTH)`;
        } else if (includeLastName) {
          personalNameInfo = `Surname ONLY: "${lastName}" (DO NOT use "${firstName}")`;
        } else if (includeFirstName) {
          personalNameInfo = `First Name ONLY: "${firstName}" (DO NOT use "${lastName}")`;
        }
      }

      userPrompt = `Generate a complete business identity with diverse name options across brand archetypes:

Business Concept: ${idea}
Target Audience: ${audience}
Founder Background: ${experience}
${motivation ? `Founder Motivation: ${motivation}` : ''}
${personalNameInfo}
Style Category: ${styleCategory || 'professional'}
Tone: ${tone}

Provide 4-6 name options across different brand archetypes (Professional, Creative, Playful, Personalized), one compelling tagline (max 80 chars), a personalized bio (use "${firstName}" and reference their background: "${experience}"), 3 complementary brand colors that match the ${styleCategory || 'professional'} style, and a clean SVG logo.

CRITICAL: Ensure names feel intentional, polished, and trustworthy. Avoid clunky, awkward, or laughable combinations. Each name should reflect its archetype clearly.`;
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