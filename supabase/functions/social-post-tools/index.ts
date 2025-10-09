import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, platform, hook, caption, hashtags } = body;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`[social-post-tools] Action: ${action}, Platform: ${platform}`);

    let systemMessage = '';
    let userMessage = '';
    let toolSchema: any = null;

    if (action === 'improve_post') {
      systemMessage = `You are a social media expert. Improve posts to be engaging, concise, and persuasive while respecting platform limits.`;
      
      userMessage = `Platform: ${platform}
Hook: ${hook}
Caption: ${caption}
Hashtags: ${hashtags?.join(', ') || 'none'}

Improve this post. Keep the meaning but make it more engaging and platform-appropriate.`;

      toolSchema = {
        type: 'function',
        function: {
          name: 'improve_post',
          description: 'Return improved hook, caption, and hashtags',
          parameters: {
            type: 'object',
            properties: {
              hook: { type: 'string' },
              caption: { type: 'string' },
              hashtags: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['hook', 'caption', 'hashtags']
          }
        }
      };
    } else if (action === 'recommend_times') {
      systemMessage = `You are a social media scheduling expert. Suggest optimal posting times based on platform and timezone.`;
      
      const timezone = body.timezone || 'UTC';
      userMessage = `Platform: ${platform}
Timezone: ${timezone}

Suggest 3-5 optimal posting times for this week.`;

      toolSchema = {
        type: 'function',
        function: {
          name: 'recommend_times',
          description: 'Return recommended posting times',
          parameters: {
            type: 'object',
            properties: {
              slots: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    iso: { type: 'string' },
                    reason: { type: 'string' }
                  },
                  required: ['iso', 'reason']
                }
              }
            },
            required: ['slots']
          }
        }
      };
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        tools: [toolSchema],
        tool_choice: { type: 'function', function: { name: toolSchema.function.name } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[social-post-tools] AI error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    console.log('[social-post-tools] Result:', JSON.stringify(result).slice(0, 200));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[social-post-tools] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
