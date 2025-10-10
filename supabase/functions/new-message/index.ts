import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { businessId, productId, customer, topic, body } = await req.json();

    console.log('Creating new customer message', { businessId, customer: customer?.email });

    // Create message thread
    const { data: message, error: msgError } = await supabase
      .from('customer_messages')
      .insert({
        business_id: businessId,
        product_id: productId || null,
        customer_email: customer.email,
        customer_name: customer.name || null,
        topic: topic || 'general',
      })
      .select()
      .single();

    if (msgError) {
      console.error('Error creating message:', msgError);
      return new Response(JSON.stringify({ error: msgError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add first reply
    const { error: replyError } = await supabase
      .from('customer_message_replies')
      .insert({
        message_id: message.id,
        sender_type: 'customer',
        body,
        via: 'in_app',
      });

    if (replyError) {
      console.error('Error creating reply:', replyError);
    }

    // TODO Phase M4: Send SendGrid notification to business owner

    console.log('Message created successfully:', message.id);

    return new Response(
      JSON.stringify({ success: true, threadId: message.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in new-message function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
