import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { business_id: businessId, customer_email: email } = await req.json();

    if (!businessId || !email) {
      return new Response(
        JSON.stringify({ error: "Missing business_id or customer_email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase();

    console.log(`Fetching profile for customer: ${normalizedEmail} in business: ${businessId}`);

    // Verify the caller owns this business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single();

    if (!business) {
      return new Response(
        JSON.stringify({ error: "Business not found or access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all customer data in parallel
    const [ordersResult, reviewsResult, messagesResult] = await Promise.all([
      supabase
        .from("orders")
        .select("id, product_id, amount_total, status, created_at, currency, products(title)")
        .eq("business_id", businessId)
        .ilike("customer_email", normalizedEmail)
        .eq("status", "paid")
        .order("created_at", { ascending: false })
        .limit(50),
      
      supabase
        .from("reviews")
        .select("id, rating, title, body, created_at, status")
        .eq("business_id", businessId)
        .ilike("customer_email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(20),
      
      supabase
        .from("customer_messages")
        .select("id, customer_name, topic, status, created_at, last_message_at")
        .eq("business_id", businessId)
        .ilike("customer_email", normalizedEmail)
        .order("created_at", { ascending: false })
        .limit(20)
    ]);

    if (ordersResult.error) console.error("Orders error:", ordersResult.error);
    if (reviewsResult.error) console.error("Reviews error:", reviewsResult.error);
    if (messagesResult.error) console.error("Messages error:", messagesResult.error);

    const orders = ordersResult.data || [];
    const reviews = reviewsResult.data || [];
    const messages = messagesResult.data || [];

    // Calculate summary metrics
    const totalSpent = orders.reduce((sum, o) => sum + (o.amount_total || 0), 0) / 100;
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    const summary = {
      total_orders: orders.length,
      total_spent: totalSpent.toFixed(2),
      avg_rating: avgRating.toFixed(1),
      total_reviews: reviews.length,
      total_messages: messages.length,
    };

    console.log(`Profile fetched: ${orders.length} orders, ${reviews.length} reviews, ${messages.length} messages`);

    return new Response(
      JSON.stringify({
        summary,
        orders,
        reviews,
        messages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-customer-profile:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
