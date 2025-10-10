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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messageId, body } = await req.json();

    if (!messageId || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user owns this message's business
    const { data: message } = await supabase
      .from("customer_messages")
      .select("id, customer_email, customer_name, business_id")
      .eq("id", messageId)
      .single();

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message not found" }), 
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("business_name, owner_id")
      .eq("id", message.business_id)
      .single();

    if (!business || business.owner_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert reply
    await supabase.from("customer_message_replies").insert({
      message_id: messageId,
      sender_type: "business",
      sender_id: user.id,
      body,
      via: "in_app",
    });

    // Update last_message_at
    await supabase
      .from("customer_messages")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", messageId);

    // Send email to customer
    const publicUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://sidehive.app';
    await sendMail({
      to: message.customer_email,
      subject: `Reply from ${business.business_name}`,
      text: `${business.business_name} replied to your message:\n\n${body}\n\n---\nReply directly to this email to continue the conversation, or view online: ${publicUrl}/messages/${messageId}`,
      html: `<h2>Reply from ${business.business_name}</h2>
             <p>${body.replace(/\n/g, '<br>')}</p>
             <hr style="margin: 20px 0;">
             <p style="color: #666; font-size: 12px;">Reply directly to this email to continue the conversation</p>
             <p><a href="${publicUrl}/messages/${messageId}">View full conversation</a></p>`,
    });

    return new Response(
      JSON.stringify({ success: true }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in reply-message:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
