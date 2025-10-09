import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, payload } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let tools: any[] = [];
    let userMessage = '';

    // Define tools and messages based on action
    switch (action) {
      case 'write_user_bio':
        tools = [{
          type: 'function',
          function: {
            name: 'write_user_bio',
            description: 'Generate a personal bio for a user profile',
            parameters: {
              type: 'object',
              properties: {
                bio: {
                  type: 'string',
                  description: 'A warm, first-person bio (150-350 characters) that builds trust'
                }
              },
              required: ['bio']
            }
          }
        }];
        userMessage = `Write a ${payload.tone || 'friendly'} first-person bio for ${payload.name}. Make it warm and authentic.`;
        break;

      case 'improve_user_bio':
        tools = [{
          type: 'function',
          function: {
            name: 'improve_user_bio',
            description: 'Improve an existing user bio',
            parameters: {
              type: 'object',
              properties: {
                bio: {
                  type: 'string',
                  description: 'An improved version of the bio'
                }
              },
              required: ['bio']
            }
          }
        }];
        userMessage = `Improve this bio with a ${payload.tone || 'friendly'} tone: "${payload.current_bio}". Keep it authentic and engaging.`;
        break;

      case 'rename_business':
        tools = [{
          type: 'function',
          function: {
            name: 'rename_business',
            description: 'Suggest 5 business name options',
            parameters: {
              type: 'object',
              properties: {
                options: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      why: { type: 'string' }
                    },
                    required: ['name', 'why']
                  },
                  minItems: 5,
                  maxItems: 5
                }
              },
              required: ['options']
            }
          }
        }];
        userMessage = `Suggest 5 creative business names similar to "${payload.current_name}" with a ${payload.vibe_tags?.[0] || 'friendly'} vibe. Include a brief reason for each.`;
        break;

      case 'write_tagline':
        tools = [{
          type: 'function',
          function: {
            name: 'write_tagline',
            description: 'Generate a tagline and alternatives',
            parameters: {
              type: 'object',
              properties: {
                tagline: { type: 'string', description: 'Main tagline (max 120 chars)' },
                alts: {
                  type: 'array',
                  items: { type: 'string' },
                  description: '2-3 alternative taglines'
                }
              },
              required: ['tagline', 'alts']
            }
          }
        }];
        userMessage = `Write a catchy tagline for "${payload.business_name}" with a ${payload.vibe_tags?.[0] || 'friendly'} tone. Include 2-3 alternatives.`;
        break;

      case 'rewrite_business_bio':
        tools = [{
          type: 'function',
          function: {
            name: 'rewrite_business_bio',
            description: 'Rewrite a business bio',
            parameters: {
              type: 'object',
              properties: {
                bio: {
                  type: 'string',
                  description: 'A rewritten business bio in brand voice'
                }
              },
              required: ['bio']
            }
          }
        }];
        userMessage = `Rewrite this business bio with a ${payload.tone || 'professional'} tone: "${payload.current_bio}". Make it compelling and clear.`;
        break;

      default:
        throw new Error('Invalid action');
    }

    // Call Lovable AI
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful brand and profile assistant. Generate authentic, engaging content that builds trust.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        tools,
        tool_choice: { type: 'function', function: { name: tools[0].function.name } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Profile assist error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
