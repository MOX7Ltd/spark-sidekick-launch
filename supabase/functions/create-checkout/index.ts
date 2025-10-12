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
    const { productId, quantity = 1 } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Creating checkout for product:", productId);

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, price, business_id, currency")
      .eq("id", productId)
      .eq("status", "published")
      .single();

    if (productError || !product) {
      console.error("Product not found:", productError);
      return new Response(
        JSON.stringify({ error: "Product not found or not available" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!product.price || product.price <= 0) {
      return new Response(
        JSON.stringify({ error: "Product has no valid price" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business details and Connect account
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, business_name, stripe_account_id, stripe_onboarded")
      .eq("id", product.business_id)
      .single();

    if (bizError || !business) {
      console.error("Business not found:", bizError);
      return new Response(
        JSON.stringify({ error: "Business not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!business.stripe_account_id || !business.stripe_onboarded) {
      console.error("Business not onboarded with Stripe");
      return new Response(
        JSON.stringify({ error: "This business is not yet set up to accept payments" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get business handle for redirect URLs
    const { data: settings } = await supabase
      .from("shopfront_settings")
      .select("*")
      .eq("business_id", business.id)
      .single();

    // Create a simple handle from business name if no settings
    const handle = business.business_name?.toLowerCase().replace(/\s+/g, '-') || business.id;

    // Calculate amounts in cents
    const currency = (product.currency || 'NZD').toLowerCase();
    const priceCents = Math.round(Number(product.price) * 100);
    const feeAmount = Math.round(priceCents * 0.15); // 15% platform fee
    const netAmount = priceCents - feeAmount;

    console.log("Payment breakdown:", {
      total: priceCents,
      platformFee: feeAmount,
      merchantNet: netAmount,
      currency,
    });

    const publicSiteUrl = Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";

    // Create Stripe Checkout Session with Connect destination
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: {
              name: product.title,
              description: `Purchase from ${business.business_name || 'Business'}`,
            },
          },
          quantity,
        },
      ],
      payment_intent_data: {
        application_fee_amount: feeAmount,
        transfer_data: {
          destination: business.stripe_account_id,
        },
        metadata: {
          business_id: business.id,
          product_id: product.id,
          quantity: quantity.toString(),
        },
      },
      success_url: `${publicSiteUrl}/s/${handle}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${publicSiteUrl}/s/${handle}?cancel=true`,
      metadata: {
        business_id: business.id,
        product_id: product.id,
        quantity: quantity.toString(),
        type: "marketplace_purchase",
      },
    });

    console.log("Created checkout session:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating checkout:", error);
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
