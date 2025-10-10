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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { threadId, body, attachments } = await req.json();

    console.log('Owner replying to message', { threadId, userId: user.id });

    // Add reply
    const { data: reply, error: replyError } = await supabase
      .from('customer_message_replies')
      .insert({
        message_id: threadId,
        sender_type: 'user',
        sender_id: user.id,
        body,
        attachments: attachments || [],
        via: 'in_app',
      })
      .select()
      .single();

    if (replyError) {
      console.error('Error creating reply:', replyError);
      return new Response(JSON.stringify({ error: replyError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update last_message_at
    await supabase
      .from('customer_messages')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId);

    // TODO Phase M4: Send SendGrid notification to customer

    console.log('Reply created successfully:', reply.id);

    return new Response(
      JSON.stringify({ success: true, replyId: reply.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in reply-message function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
