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

    console.log("Creating Connect onboarding link for user:", user.id);

    // Get user's business and Connect account ID
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("stripe_account_id, stripe_onboarded")
      .eq("owner_id", user.id)
      .single();

    if (bizError || !business?.stripe_account_id) {
      console.error("Business or Connect account not found:", bizError);
      return new Response(
        JSON.stringify({ error: "Connect account not found. Complete payment first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already onboarded
    if (business.stripe_onboarded) {
      console.log("User already onboarded");
      return new Response(
        JSON.stringify({ 
          onboarded: true, 
          message: "Account already onboarded" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: business.stripe_account_id,
      refresh_url: `${publicSiteUrl}/welcome?stripe=refresh`,
      return_url: `${publicSiteUrl}/welcome?stripe=return`,
      type: "account_onboarding",
    });

    console.log("Created account link for:", business.stripe_account_id);

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: business.stripe_account_id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Connect link:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
