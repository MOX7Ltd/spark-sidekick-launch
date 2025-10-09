import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action } = body;

    console.log(`[profile-assist] action=${action}`);

    let result: any = {};

    if (action === 'write_user_bio') {
      result = await writeUserBio(body);
    } else if (action === 'improve_user_bio') {
      result = await improveUserBio(body);
    } else if (action === 'rename_business') {
      result = await renameBusiness(body);
    } else if (action === 'write_tagline') {
      result = await writeTagline(body);
    } else if (action === 'rewrite_business_bio') {
      result = await rewriteBusinessBio(body);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[profile-assist] error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function writeUserBio(body: any): Promise<{ bio: string }> {
  const { name, tone = 'friendly', highlights = [] } = body;

  const highlightsText = highlights.length > 0 ? `\nHighlights: ${highlights.join(', ')}` : '';

  const systemPrompt = `You are a personal bio writer. Write warm, authentic, first-person bios (150-350 words).`;

  const userPrompt = `Write a bio for ${name}.
Tone: ${tone}${highlightsText}

Keep it real, conversational, and trustworthy. Focus on connection, not perfection.`;

  const payload = {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'write_bio',
          description: 'Return a user bio',
          parameters: {
            type: 'object',
            properties: {
              bio: { type: 'string' },
            },
            required: ['bio'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'write_bio' } },
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[write_user_bio] AI error:', response.status, text);
    throw new Error('AI request failed');
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('No tool call returned');

  const args = JSON.parse(toolCall.function.arguments);
  return { bio: args.bio };
}

async function improveUserBio(body: any): Promise<{ bio: string }> {
  const { current_bio, tone = 'friendly', max_chars = 600 } = body;

  const systemPrompt = `You are a personal bio editor. Improve bios to be warmer, clearer, and more engaging.`;

  const userPrompt = `Improve this bio (max ${max_chars} chars, tone: ${tone}):\n\n"${current_bio}"`;

  const payload = {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'improve_bio',
          description: 'Return improved bio',
          parameters: {
            type: 'object',
            properties: {
              bio: { type: 'string' },
            },
            required: ['bio'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'improve_bio' } },
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[improve_user_bio] AI error:', response.status, text);
    throw new Error('AI request failed');
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('No tool call returned');

  const args = JSON.parse(toolCall.function.arguments);
  return { bio: args.bio };
}

async function renameBusiness(body: any): Promise<{ options: Array<{ name: string; why: string }> }> {
  const { current_name, vibe_tags = [], audience = '', constraints = [] } = body;

  const vibesText = vibe_tags.length > 0 ? `\nVibes: ${vibe_tags.join(', ')}` : '';
  const audienceText = audience ? `\nAudience: ${audience}` : '';
  const constraintsText = constraints.length > 0 ? `\nConstraints: ${constraints.join(', ')}` : '';

  const systemPrompt = `You are a business naming consultant. Suggest 5 memorable, clear, and unique business names with rationales.`;

  const userPrompt = `Suggest 5 name options for this business:
Current: ${current_name}${vibesText}${audienceText}${constraintsText}

Each name should be:
- Clear and memorable
- Easy to spell and pronounce
- Aligned with the business vibe

Return name + brief "why" for each.`;

  const payload = {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'suggest_names',
          description: 'Return 5 name options',
          parameters: {
            type: 'object',
            properties: {
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    why: { type: 'string' },
                  },
                  required: ['name', 'why'],
                },
              },
            },
            required: ['options'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'suggest_names' } },
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[rename_business] AI error:', response.status, text);
    throw new Error('AI request failed');
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('No tool call returned');

  const args = JSON.parse(toolCall.function.arguments);
  return { options: args.options };
}

async function writeTagline(body: any): Promise<{ tagline: string; alts: string[] }> {
  const { business_name, audience = '', vibe_tags = [] } = body;

  const audienceText = audience ? `\nAudience: ${audience}` : '';
  const vibesText = vibe_tags.length > 0 ? `\nVibes: ${vibe_tags.join(', ')}` : '';

  const systemPrompt = `You are a tagline writer. Create short, punchy taglines (max 120 chars) that capture what a business does and why it matters.`;

  const userPrompt = `Write a tagline for: ${business_name}${audienceText}${vibesText}

Return 1 primary tagline + 2 alternates.`;

  const payload = {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'write_tagline',
          description: 'Return tagline and alternates',
          parameters: {
            type: 'object',
            properties: {
              tagline: { type: 'string' },
              alts: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['tagline', 'alts'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'write_tagline' } },
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[write_tagline] AI error:', response.status, text);
    throw new Error('AI request failed');
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('No tool call returned');

  const args = JSON.parse(toolCall.function.arguments);
  return { tagline: args.tagline, alts: args.alts };
}

async function rewriteBusinessBio(body: any): Promise<{ bio: string }> {
  const { current_bio, tone = 'friendly', audience = '', business_name = '' } = body;

  const audienceText = audience ? `\nAudience: ${audience}` : '';
  const nameText = business_name ? `\nBusiness: ${business_name}` : '';

  const systemPrompt = `You are a business bio writer. Rewrite bios to be warm, clear, and human (third-person or brand voice).`;

  const userPrompt = `Rewrite this bio (tone: ${tone}, max 1000 chars):${nameText}${audienceText}\n\n"${current_bio}"`;

  const payload = {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'rewrite_bio',
          description: 'Return rewritten bio',
          parameters: {
            type: 'object',
            properties: {
              bio: { type: 'string' },
            },
            required: ['bio'],
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'rewrite_bio' } },
  };

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[rewrite_business_bio] AI error:', response.status, text);
    throw new Error('AI request failed');
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error('No tool call returned');

  const args = JSON.parse(toolCall.function.arguments);
  return { bio: args.bio };
}
