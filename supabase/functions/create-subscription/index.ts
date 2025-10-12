import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating subscription for user:", user.id);

    // Get user's Stripe customer ID
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("stripe_customer_id, subscription_status")
      .eq("id", user.id)
      .single();

    if (userError || !userRecord?.stripe_customer_id) {
      console.error("User record or customer not found:", userError);
      return new Response(
        JSON.stringify({ error: "Stripe customer not found. Please complete payment first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already has active subscription
    if (userRecord.subscription_status === 'active' || userRecord.subscription_status === 'trialing') {
      console.log("User already has active subscription");
      return new Response(
        JSON.stringify({ 
          error: "You already have an active subscription",
          status: userRecord.subscription_status 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const priceId = Deno.env.get("STRIPE_PRICE_ID_PRO");
    if (!priceId) {
      console.error("STRIPE_PRICE_ID_PRO not configured");
      return new Response(
        JSON.stringify({ error: "Subscription pricing not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate trial end (14 days from now)
    const trialEnd = Math.floor(Date.now() / 1000) + 14 * 24 * 3600;

    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";

    // Create Checkout Session for subscription with trial
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: userRecord.stripe_customer_id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_end: trialEnd,
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${publicSiteUrl}/hub/billing?subscribed=success`,
      cancel_url: `${publicSiteUrl}/hub/billing?subscribed=cancel`,
      metadata: {
        user_id: user.id,
        type: "subscription",
      },
    });

    console.log("Created subscription session:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating subscription:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
