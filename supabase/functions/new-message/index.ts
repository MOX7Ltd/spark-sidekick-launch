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

    const { businessId, productId, customer, topic, body } = await req.json();

    // Validate input
    if (!businessId || !customer?.email || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create message thread
    const { data: msg, error: msgError } = await supabase
      .from("customer_messages")
      .insert({
        business_id: businessId,
        product_id: productId,
        customer_email: customer.email,
        customer_name: customer.name,
        topic: topic || "general",
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (msgError) {
      console.error("Error creating message:", msgError);
      return new Response(
        JSON.stringify({ error: msgError.message }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add first reply
    await supabase.from("customer_message_replies").insert({
      message_id: msg.id,
      sender_type: "customer",
      body,
      via: "in_app",
    });

    // Get business owner email
    const { data: business } = await supabase
      .from("businesses")
      .select("business_name, owner_id")
      .eq("id", businessId)
      .single();

    if (business?.owner_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", business.owner_id)
        .single();

      // Send notification email to business owner
      if (profile?.email) {
        const productInfo = productId ? ` (about a product)` : '';
        const publicUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://sidehive.app';
        await sendMail({
          to: profile.email,
          subject: `New message from ${customer.name}${productInfo}`,
          text: `You have a new message on ${business.business_name}:\n\nFrom: ${customer.name} (${customer.email})\nTopic: ${topic}\n\n${body}\n\n---\nView and reply: ${publicUrl}/hub/customers/messages?id=${msg.id}`,
          html: `<h2>New message on ${business.business_name}</h2>
                 <p><strong>From:</strong> ${customer.name} (${customer.email})</p>
                 <p><strong>Topic:</strong> ${topic}</p>
                 <p><strong>Message:</strong></p>
                 <p>${body.replace(/\n/g, '<br>')}</p>
                 <hr style="margin: 20px 0;">
                 <p><a href="${publicUrl}/hub/customers/messages?id=${msg.id}">View and reply in your SideHive Hub</a></p>`,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, threadId: msg.id }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in new-message:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
