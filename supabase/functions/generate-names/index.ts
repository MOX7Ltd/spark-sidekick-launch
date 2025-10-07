import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('[generate-names] Function started and deployed successfully');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaText, audience = 'general', tone = 'neutral', max_names = 12 } = await req.json();

    const namingPrompt = `
You are a brand strategist. Create ${Math.min(max_names, 12)} memorable brand NAMES for a business.

Context:
- What we do / core idea: ${ideaText || '—'}
- Audience: ${audience}
- Tone: ${tone}

Hard rules:
- 1–2 words only (3 only if truly strong; avoid long phrases)
- No cheesy alliteration or rhyme (no "Guitar Gigglers", "Chord Commanders")
- No filler words: HQ, House, Palace, Funhouse, Studio, Co., Corp., LLC
- No literal category descriptors unless essential (e.g., "Guitar", "Course")
- Prefer coined blends, abstractions, or metaphorical roots (e.g., Fretwell, Tuneform, Strumverse)
- Must sound like a real brand that could appear on BrandBucket or IndieMaker
- No punctuation, no emojis

Return JSON ONLY:
{
  "names": ["NameOne", "NameTwo", "..."]
}
`.trim();

    console.log('Generating brand names for:', ideaText);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: namingPrompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI API error:', error);
      throw new Error(`Lovable AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in response');
    }

    const parsed = JSON.parse(content);
    const names = parsed.names || [];

    // Lightweight scoring
    const scores: Record<string, {brevity: number, distinctiveness: number, relevance: number, total: number}> = {};
    
    names.forEach((name: string) => {
      const wordCount = name.trim().split(/\s+/).length;
      const brevity = wordCount === 1 ? 5 : wordCount === 2 ? 4 : 3;
      
      // Simple distinctiveness check (no common words)
      const commonWords = ['the', 'and', 'for', 'with', 'your', 'our', 'my'];
      const lowerName = name.toLowerCase();
      const hasCommonWord = commonWords.some(w => lowerName.includes(w));
      const distinctiveness = hasCommonWord ? 2 : 5;
      
      // Relevance - check if it's too generic
      const genericWords = ['company', 'business', 'service', 'shop', 'store'];
      const isGeneric = genericWords.some(w => lowerName.includes(w));
      const relevance = isGeneric ? 2 : 5;
      
      const total = brevity + distinctiveness + relevance;
      
      scores[name] = { brevity, distinctiveness, relevance, total };
    });

    // Sort names by score
    const sortedNames = names.sort((a: string, b: string) => 
      scores[b].total - scores[a].total
    );

    console.log('Generated', sortedNames.length, 'brand names');

    return new Response(JSON.stringify({ 
      names: sortedNames,
      scores 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-names function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate names';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      names: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
