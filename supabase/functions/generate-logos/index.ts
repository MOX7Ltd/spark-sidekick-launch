import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessName, style } = await req.json();

    console.log('Generating logos for:', businessName, 'with style:', style);

    // Generate 3-5 logo variations using OpenAI
    const logoPromises = Array.from({ length: 3 }, async (_, i) => {
      const styleDescriptions = {
        'modern': 'modern minimalist, clean lines, simple geometric shapes',
        'playful': 'playful and colorful, fun shapes, vibrant colors',
        'bold': 'bold typography-focused, strong letterforms',
        'professional': 'clean professional, corporate, trustworthy',
        'icon': 'icon-based, symbolic, memorable mark',
        'retro': 'retro vintage style, nostalgic aesthetic',
        'gradient': 'dynamic gradient, modern colorful transitions'
      };

      const styleDesc = styleDescriptions[style as keyof typeof styleDescriptions] || 'modern professional';
      
      const prompt = `Create a simple, clean logo mark for "${businessName}". Style: ${styleDesc}. Design variation ${i + 1}. Minimalist, scalable, works well at small sizes. No text in the logo, just the icon/mark. Flat design, vector style, professional. Transparent background.`;

      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          n: 1,
          size: '1024x1024',
          quality: 'low',
          background: 'transparent',
          output_format: 'png'
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('OpenAI API error:', error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const data = await response.json();
      
      // OpenAI returns base64 for gpt-image-1
      if (data.data && data.data[0] && data.data[0].b64_json) {
        return `data:image/png;base64,${data.data[0].b64_json}`;
      }
      
      throw new Error('Invalid response format from OpenAI');
    });

    const logos = await Promise.all(logoPromises);

    console.log('Generated', logos.length, 'logos');

    return new Response(JSON.stringify({ logos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-logos function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate logos';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
