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

    const { userId, productId, rating, title, body, name, email } = await req.json();

    console.log('Creating new review', { userId, productId, rating });

    // Insert as pending review (requires user_id based on existing schema)
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        product_id: productId,
        reviewer_name: name || null,
        rating: Math.round(rating * 10), // Store 1-5 scale as 10-50
        comment: body,
        // Note: existing schema doesn't have title, customer_email, status, helpful
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      return new Response(JSON.stringify({ error: reviewError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // TODO Phase M4: Send confirmation email via SendGrid

    console.log('Review created successfully:', review.id);

    return new Response(
      JSON.stringify({ success: true, reviewId: review.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in new-review function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
