import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkIdempotency, storeIdempotentResponse, hashRequest, parseFeatureFlags } from '../_shared/idempotency.ts';

const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-session-id, x-trace-id, x-env, x-retry, x-idempotency-key, x-feature-flags",
};

serve(async (req) => {
  const startTime = performance.now();
  const sessionId = req.headers.get("X-Session-Id") || "unknown";
  const traceId = req.headers.get("X-Trace-Id") || "unknown";
  const idempotencyKey = req.headers.get("X-Idempotency-Key") || traceId;

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const { ideaText = "", audience = "general", tone = "neutral", vibes = [] } = requestBody;

    const cachedResponse = await checkIdempotency(sessionId, idempotencyKey, "names");
    if (cachedResponse) {
      return new Response(JSON.stringify({ ...cachedResponse, deduped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const namingPrompt = `
Act as a senior brand strategist creating names for new ventures.

Context:
- Business idea: ${ideaText || "—"}
- Audience: ${audience}
- Tone / Vibe: ${vibes.length ? vibes.join(", ") : tone}

Your task:
Generate 8 concise, *brandable* business names and matching taglines that sound human and market-ready.
Follow these rules strictly:

✅ MUST:
- 1–2 words max (3 only if it sounds natural and brandable)
- Evoke meaning, confidence, or creativity
- Sound like a real brand you'd see on BrandBucket, ProductHunt, or IndieMaker
- Use metaphors, blends, or subtle abstractions (e.g. SideHive, Fretwell, Strumverse)
- Include a short tagline (max 10 words) that feels natural and aspirational

❌ NEVER:
- No rhyme or cutesy alliteration (no "Guitar Gigglers", "Chord Commanders")
- No filler suffixes (no HQ, House, World, Co., Studio, Funhouse, Academy, Institute)
- No literal repetition of the ideaText words
- No generic corporate words (no "Solutions", "Vision", "Enterprises", "Systems")
- No random mashups or unrelated adjectives

Output format (JSON only):
{
  "ideas": [
    { "name": "ExampleName", "tagline": "Short positioning line here." },
    { "name": "AnotherName", "tagline": "A second short line." }
  ]
}
    `.trim();

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: namingPrompt }
        ],
        temperature: 0.8,
        max_output_tokens: 800,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Lovable AI error: ${error}`);
    }

    const data = await response.json();
    const ideas = data?.choices?.[0]?.message?.content ? JSON.parse(data.choices[0].message.content).ideas : [];

    const durationMs = Math.round(performance.now() - startTime);
    const responseData = {
      ok: true,
      ideas,
      ideaText,
      tone,
      audience,
      vibes,
      trace_id: traceId,
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      duration_ms: durationMs,
    };

    const requestHash = await hashRequest(requestBody);
    await storeIdempotentResponse(sessionId, idempotencyKey, "names", requestHash, responseData);

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const durationMs = Math.round(performance.now() - startTime);
    const errMsg = error instanceof Error ? error.message : String(error);

    return new Response(JSON.stringify({
      ok: false,
      error: errMsg,
      trace_id: traceId,
      session_id: sessionId,
      duration_ms: durationMs,
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
