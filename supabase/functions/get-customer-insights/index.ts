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

    const { business_id: businessId } = await req.json();

    if (!businessId) {
      return new Response(
        JSON.stringify({ error: "Missing business_id in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching customer insights for business: ${businessId}`);

    // Call the security definer function
    const { data, error } = await supabase.rpc('get_customer_insights', {
      business_uuid: businessId
    });

    if (error) {
      console.error("Error fetching customer insights:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate summary metrics
    const repeatCount = data?.filter((d: any) => d.total_orders > 1).length ?? 0;
    const firstCount = (data?.length ?? 0) - repeatCount;
    const avgRating = data?.length > 0
      ? data.reduce((s: number, d: any) => s + (d.avg_rating || 0), 0) / data.length
      : 0;
    const avgLTV = data?.length > 0
      ? data.reduce((s: number, d: any) => s + (d.total_spend || 0), 0) / data.length
      : 0;
    const totalRevenue = data?.reduce((s: number, d: any) => s + (d.total_spend || 0), 0) ?? 0;

    console.log(`Insights calculated: ${repeatCount} repeat, ${firstCount} first-time customers`);

    return new Response(
      JSON.stringify({
        summary: {
          repeat_customers: repeatCount,
          first_time_customers: firstCount,
          avg_rating: avgRating,
          avg_ltv: avgLTV,
          total_revenue: totalRevenue,
          total_customers: data?.length ?? 0,
        },
        customers: data || []
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-customer-insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
