import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Missing review ID", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get review to verify it exists and get business_id
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, business_id, status")
      .eq("id", id)
      .single();

    if (reviewError || !review) {
      return new Response("Review not found", { status: 404 });
    }

    if (review.status === "published") {
      return new Response(
        `<!DOCTYPE html>
        <html>
        <head><title>Review Already Confirmed</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
          <h1>✓ Review Already Confirmed</h1>
          <p>This review has already been published. Thank you!</p>
        </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // Publish review
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ status: "published" })
      .eq("id", id);

    if (updateError) {
      console.error("Error publishing review:", updateError);
      return new Response("Error confirming review", { status: 500 });
    }

    // Recompute business rating
    await supabase.rpc("compute_business_rating", { bid: review.business_id });

    return new Response(
      `<!DOCTYPE html>
      <html>
      <head><title>Review Confirmed</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
        <h1>✓ Review Confirmed!</h1>
        <p>Thank you! Your review has been published.</p>
        <p style="color: #666; margin-top: 20px;">You may close this tab.</p>
      </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (error) {
    console.error("Error in confirm-review:", error);
    return new Response("Internal server error", { status: 500 });
  }
});
