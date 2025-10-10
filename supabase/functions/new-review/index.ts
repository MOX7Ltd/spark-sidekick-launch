import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import sendMail from "../_shared/sendgrid.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { businessId, rating, title, body, name, email } = await req.json();

    // Validate input
    if (!businessId || !rating || !email) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create review (pending confirmation)
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        business_id: businessId,
        rating,
        title: title || null,
        body: body || null,
        customer_name: name,
        customer_email: email,
        status: "pending",
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Error creating review:", reviewError);
      return new Response(
        JSON.stringify({ error: reviewError.message }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate confirmation link (simple ID-based for now)
    const confirmUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/confirm-review?id=${review.id}`;

    // Send confirmation email
    await sendMail({
      to: email,
      subject: "Confirm your review",
      text: `Thank you for your review!\n\nClick to publish: ${confirmUrl}`,
      html: `<h2>Confirm your review</h2>
             <p>Thank you for taking the time to leave a review!</p>
             <p>Rating: ${'★'.repeat(Math.floor(rating / 20))}${'☆'.repeat(5 - Math.floor(rating / 20))}</p>
             ${title ? `<p><strong>${title}</strong></p>` : ''}
             ${body ? `<p>${body}</p>` : ''}
             <p><a href="${confirmUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Confirm Review</a></p>`,
    });

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in new-review:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
