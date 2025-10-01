import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';
import { checkIdempotency, storeIdempotentResponse, hashRequest } from '../_shared/idempotency.ts';
import { normalizeOnboardingInput, shouldIncludeName } from '../_shared/normalize.ts';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry',
};

const requestSchema = z.object({
  idea: z.string().min(10),
  aboutYou: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    includeFirstName: z.boolean().default(false),
    includeLastName: z.boolean().default(false),
    expertise: z.string().optional(),
    motivation: z.string().optional()
  }).optional(),
  vibes: z.array(z.string()).min(1).default(['Friendly']),
  audiences: z.array(z.string()).min(1).default(['General']),
  products: z.array(z.string()).optional(),
  bannedWords: z.array(z.string()).optional(),
  rejectedNames: z.array(z.string()).optional(),
  regenerateNames: z.boolean().optional(),
  regenerateSingleName: z.boolean().optional(),
});

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
  const startTime = performance.now();
  const sessionId = req.headers.get('X-Session-Id') || 'unknown';
  const traceId = req.headers.get('X-Trace-Id') || 'unknown';
  const idempotencyKey = req.headers.get('X-Idempotency-Key') || traceId;
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Edge function called with headers:', req.headers.get('authorization') ? 'Authorization present' : 'No authorization');
    
    // Check for cached response
    const cachedResponse = await checkIdempotency(sessionId, idempotencyKey, 'identity');
    if (cachedResponse) {
      console.log('Returning cached identity for idempotency key:', idempotencyKey);
      return new Response(JSON.stringify({
        ...cachedResponse,
        deduped: true,
        idempotency_key: idempotencyKey,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
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
    
    // Normalize inputs with defaults
    const normalized = normalizeOnboardingInput(requestBody);
    const namePrefs = shouldIncludeName(normalized.aboutYou);
    
    const { 
      idea, 
      audience, 
      experience, 
      motivation,
      namingPreference,
      tone,
      styleCategory,
      regenerateNamesOnly,
      regenerateSingleName,
      bannedWords = [],
      rejectedNames = []
    } = requestBody;
    
    const firstName = namePrefs.firstName;
    const lastName = namePrefs.lastName;
    const includeFirstName = namePrefs.includeFirst;
    const includeLastName = namePrefs.includeLast;
    const vibes = normalized.vibes;
    const audiences = normalized.audiences;

    // Debug logging for name inclusion parameters
    console.log('===== NAME PARAMETERS DEBUG =====');
    console.log('namingPreference:', namingPreference);
    console.log('firstName:', firstName);
    console.log('lastName:', lastName);
    console.log('includeFirstName:', includeFirstName);
    console.log('includeLastName:', includeLastName);
    console.log('Normalized:', normalized);
    console.log('================================');

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
      // Determine which track to use based on what names are missing
      const needsThematicName = rejectedNames.some((n: string) => !n.includes(firstName || '') && !n.includes(lastName || ''));
      const needsNameIntegrated = rejectedNames.some((n: string) => n.includes(firstName || '') || n.includes(lastName || ''));
      
      let trackType = needsThematicName ? 'thematic' : 'name-integrated';
      
      let nameGuidelines = '';
      if (trackType === 'thematic') {
        nameGuidelines = `Generate a THEMATIC name (Track A) - DO NOT use any personal names ("${firstName}" or "${lastName}"). 
Focus on: metaphors, emotional concepts, descriptive industry terms.
Examples for family/parenting: Family Rhythm, Parent Compass, Home Harmony, ThriveTrack, Kiddo Flow.
Make it natural, emotional, and industry-relevant.`;
      } else {
        nameGuidelines = `Generate a NAME-INTEGRATED option (Track B) using the founder's name naturally.
Use ONLY these patterns:
- [Concept] by [Name] (e.g., "Parent Compass by ${firstName}")
- [Name] [Descriptor] (e.g., "${lastName} Family Consulting")
- [Verb/Concept] with [Name] (e.g., "LifeFlow with ${firstName}")

${includeFirstName && includeLastName ? `Use either "${firstName}" OR "${lastName}" (not both).` : ''}
${includeFirstName && !includeLastName ? `Use "${firstName}" only.` : ''}
${!includeFirstName && includeLastName ? `Use "${lastName}" only.` : ''}

AVOID: Simple possessive formats like "${firstName}'s [Noun]" unless extremely natural.`;
      }
      
      console.log('[SINGLE NAME] Track type:', trackType);
      console.log('[SINGLE NAME] Name guidelines being used:', nameGuidelines);

      systemPrompt = `You are an expert branding consultant. Generate ONE unique, professional business name.

CRITICAL NAMING RULES:
- Name MUST be SHORT (2-4 words max)
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
  "style": "${trackType === 'thematic' ? 'Thematic' : 'Name-Integrated'}",
  "tagline": "5-8 word human-sounding tagline that reflects the outcome"
}`;

      userPrompt = `Generate 1 fresh business name (${trackType} track):

Business Concept: ${idea}
Target Audience: ${audience}
${firstName ? `Founder First Name: ${firstName}` : ''}
${lastName ? `Founder Last Name: ${lastName}` : ''}
${motivation ? `Founder Motivation: ${motivation}` : ''}
Business Type Tone: ${tone}

Make it COMPLETELY DIFFERENT from the rejected names.`;

    } else if (regenerateNamesOnly) {
      console.log('[REGENERATE NAMES] Starting two-track name generation...');
      
      // Build context-aware industry tone
      let industryContext = '';
      if (idea.toLowerCase().includes('parent') || idea.toLowerCase().includes('family')) {
        industryContext = 'Family/Parenting: nurturing, playful, supportive tone';
      } else if (idea.toLowerCase().includes('fitness') || idea.toLowerCase().includes('health')) {
        industryContext = 'Fitness/Health: energetic, inspiring, movement-focused tone';
      } else if (idea.toLowerCase().includes('consult') || idea.toLowerCase().includes('coach')) {
        industryContext = 'Consulting/Coaching: professional, credible, trustworthy tone';
      } else {
        industryContext = `${tone || 'professional'} tone appropriate to the industry`;
      }

      systemPrompt = `You are an expert branding consultant. Generate business names using a TWO-TRACK APPROACH:

🎯 TRACK A - THEMATIC NAMES (3-5 names)
Generate creative, metaphorical, or descriptive names WITHOUT using the founder's personal name.
- Focus on: emotional concepts, industry metaphors, outcome-focused terms
- Examples for parenting: Family Rhythm, Kiddo Flow, Parent Compass, Home Harmony, ThriveTrack
- Examples for consulting: Blueprint Partners, Catalyst Co., Momentum Lab
- Make them feel natural, memorable, and emotionally appealing

👤 TRACK B - NAME-INTEGRATED (2-3 names)
Naturally integrate the founder's name using ONLY these patterns:
- [Concept] by [Name] (e.g., "Parent Compass by ${firstName || lastName}")
- [Name] [Descriptor] (e.g., "${lastName || firstName} Family Consulting")
- [Verb/Concept] with [Name] (e.g., "LifeFlow with ${firstName || lastName}")

${firstName && lastName ? `Use EITHER "${firstName}" OR "${lastName}" in each option (not both together).` : ''}
${firstName && !lastName ? `Use "${firstName}" naturally.` : ''}
${!firstName && lastName ? `Use "${lastName}" naturally.` : ''}

CRITICAL RULES FOR ALL NAMES:
- STRICTLY AVOID: ${bannedWordsStr}
- NO awkward possessive formats like "${firstName || 'Name'}'s Pylon" or "${firstName || 'Name'}'s Roost"
- NO forced, archaic, or irrelevant word combinations
- Be emotionally appealing and relevant to: ${industryContext}
${rejectedNamesStr ? `- DO NOT reuse these rejected names: ${rejectedNamesStr}` : ''}
- If you detect repeated patterns (e.g., ${firstName}'s Path, ${firstName}'s Pylon, ${firstName}'s Pith), regenerate with different structures

Return ONLY valid JSON:
{
  "trackA": [
    {"name": "ThematicName1", "style": "Thematic", "tagline": "5-10 word human tagline"},
    {"name": "ThematicName2", "style": "Thematic", "tagline": "5-10 word human tagline"},
    {"name": "ThematicName3", "style": "Thematic", "tagline": "5-10 word human tagline"}
  ],
  "trackB": [
    {"name": "NameIntegrated1", "style": "Name-Integrated", "tagline": "5-10 word human tagline"},
    {"name": "NameIntegrated2", "style": "Name-Integrated", "tagline": "5-10 word human tagline"}
  ]
}`;
      userPrompt = `Generate business names using the TWO-TRACK approach:

Business Concept: ${idea}
Target Audience: ${audience}
Industry Context: ${industryContext}
${firstName ? `Founder First Name: ${firstName}` : ''}
${lastName ? `Founder Last Name: ${lastName}` : ''}
${motivation ? `Founder Motivation: ${motivation}` : ''}

TRACK A: Generate 3-5 thematic names (no personal names)
TRACK B: Generate 2-3 name-integrated options using natural patterns

Ensure all names are emotionally appealing, relevant, and sound like something a real entrepreneur would proudly use.`;

    } else {
      console.log('[FULL IDENTITY] Starting full identity generation with two-track names...');
      
      // Build context-aware industry tone
      let industryContext = '';
      if (idea.toLowerCase().includes('parent') || idea.toLowerCase().includes('family')) {
        industryContext = 'Family/Parenting: nurturing, playful, supportive';
      } else if (idea.toLowerCase().includes('fitness') || idea.toLowerCase().includes('health')) {
        industryContext = 'Fitness/Health: energetic, inspiring, movement-focused';
      } else if (idea.toLowerCase().includes('consult') || idea.toLowerCase().includes('coach')) {
        industryContext = 'Consulting/Coaching: professional, credible, trustworthy';
      } else {
        industryContext = tone || 'professional';
      }

      systemPrompt = `You are an expert business identity generator. Create a compelling business identity using a TWO-TRACK naming approach.

🎯 TRACK A - THEMATIC NAMES (Generate 3 names)
Creative names WITHOUT the founder's personal name:
- Focus on: metaphors, emotional concepts, industry-relevant descriptors
- Industry context: ${industryContext}
- Examples: Family Rhythm, Kiddo Flow, Blueprint Partners, Momentum Lab

👤 TRACK B - NAME-INTEGRATED (Generate 2 names)
Names that naturally integrate the founder's name using ONLY these patterns:
- [Concept] by [Name] (e.g., "Parent Compass by ${firstName || lastName}")
- [Name] [Descriptor] (e.g., "${lastName || firstName} Family Consulting")
- [Verb/Concept] with [Name] (e.g., "LifeFlow with ${firstName || lastName}")

${firstName && lastName ? `Use EITHER "${firstName}" OR "${lastName}" (not both together).` : ''}
${firstName && !lastName ? `Use "${firstName}" naturally in Track B.` : ''}
${!firstName && lastName ? `Use "${lastName}" naturally in Track B.` : ''}

CRITICAL RULES:
- All names MUST be SHORT (2-4 words max)
- STRICTLY AVOID: ${bannedWordsStr}
- NO awkward possessive formats or forced combinations
- Match the tone: ${industryContext}
- Be emotionally appealing and authentic

BIO GUIDELINES:
- Length: 2-3 sentences (40-80 words)
- CRITICAL: Transform raw user input into polished, natural storytelling
- NEVER use formal language like "successfully managed" or "intimately understand"
- NEVER use phrases like "I'm passionate about sharing" or "ensuring everyone thrives"
- Write conversationally, as if the founder is speaking to a friend
- Show vulnerability and authenticity — real people, real challenges
- Blend experience + motivation into natural flow

TRANSFORMATION EXAMPLES:
❌ BAD (robotic, formal):
"As a parent who successfully managed raising five children, I intimately understand the challenges of modern family life. I'm passionate about sharing the practical tips and clever hacks I developed to help other families navigate busy schedules, ensuring everyone thrives without dropping any balls."

✅ GOOD (natural, human):
"As a parent of five, I know firsthand the beautiful chaos of family life. Over the years I've developed simple, practical ways to stay organized while juggling competing demands. Now, I'm excited to share those strategies with other parents who want more balance, confidence, and joy at home."

Return ONLY valid JSON:
{
  "trackA": [
    {"name": "ThematicName1", "style": "Thematic", "tagline": "5-10 word tagline"},
    {"name": "ThematicName2", "style": "Thematic", "tagline": "5-10 word tagline"},
    {"name": "ThematicName3", "style": "Thematic", "tagline": "5-10 word tagline"}
  ],
  "trackB": [
    {"name": "NameIntegrated1", "style": "Name-Integrated", "tagline": "5-10 word tagline"},
    {"name": "NameIntegrated2", "style": "Name-Integrated", "tagline": "5-10 word tagline"}
  ],
  "tagline": "Compelling 5-10 word tagline (max 80 chars)",
  "bio": "2-3 sentence polished bio that transforms user's raw experience + motivation into cohesive narrative",
  "colors": ["#hexcolor1", "#hexcolor2", "#hexcolor3"],
  "logoSVG": "Clean, simple SVG logo that matches the style"
}`;


      userPrompt = `Generate a complete business identity with TWO-TRACK name approach:

Business Concept: ${idea}
Target Audience: ${audience}
Industry Context: ${industryContext}
Founder Background: ${experience}
${motivation ? `Founder Motivation: ${motivation}` : ''}
${firstName ? `Founder First Name: ${firstName}` : ''}
${lastName ? `Founder Last Name: ${lastName}` : ''}
Style Category: ${styleCategory || 'professional'}
Tone: ${tone}

TRACK A: Generate 3 thematic names (without personal name)
TRACK B: Generate 2 name-integrated options (with natural name integration)

Provide the two tracks of names, one compelling tagline (max 80 chars), a personalized bio that TRANSFORMS the raw inputs below into polished narrative text (blend their experience/skills with their motivation into 2-3 cohesive sentences - do NOT copy their exact words), 3 complementary brand colors that match the ${styleCategory || 'professional'} style, and a clean SVG logo.

IMPORTANT FOR BIO: Transform these raw inputs into polished text:
- Experience/Skills: "${experience}" (factual context)
- Motivation: "${motivation || 'passion for helping others'}" (their why)
Blend both into natural, cohesive bio that sounds like it was written by a professional, not copied from a form.

CRITICAL: Ensure names feel intentional, polished, and trustworthy. Each name should be emotionally appealing and relevant to the business idea.`;
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

    // For name regeneration, combine both tracks into single array
    if (regenerateNamesOnly) {
      console.log('Returning regenerated names from two tracks');
      const trackA = generatedData.trackA || [];
      const trackB = generatedData.trackB || [];
      const combinedNames = [...trackA, ...trackB];
      
      return new Response(JSON.stringify({
        nameOptions: combinedNames
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
      // Extract first name from two-track structure
      const trackA = generatedData.trackA || [];
      const trackB = generatedData.trackB || [];
      const allNames = [...trackA, ...trackB];
      const firstNameOption = allNames.length > 0 
        ? (typeof allNames[0] === 'string' ? allNames[0] : allNames[0].name)
        : 'Business Name';

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

    // Combine two tracks into single nameOptions array
    const trackA = generatedData.trackA || [];
    const trackB = generatedData.trackB || [];
    const combinedNameOptions = [...trackA, ...trackB];

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      business,
      nameOptions: combinedNameOptions,
      tagline: generatedData.tagline,
      bio: generatedData.bio,
      colors: generatedData.colors,
      logoSVG: generatedData.logoSVG,
      products: products,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
      applied_defaults: normalized.appliedDefaults.length > 0 ? normalized.appliedDefaults : undefined,
      deduped: false,
      ok: true,
    };
    
    // Store for idempotency
    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, 'identity', requestHash, responseData);
    
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    console.error('Error in generate-identity function:', error);
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