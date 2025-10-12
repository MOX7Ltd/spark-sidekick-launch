import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("Missing signature or webhook secret");
    return new Response("Webhook configuration error", { status: 400 });
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log("Received webhook event:", event.type, event.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error("Webhook signature verification failed:", message);
    return new Response(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Log all events to stripe_events table
    await supabase.from("stripe_events").insert({
      id: event.id,
      type: event.type,
      data: event.data as any,
    });

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const sessionType = session.metadata?.type;

      console.log("Checkout completed:", { userId, sessionType, sessionId: session.id });

      // Handle Starter Pack payment
      if (userId && sessionType === "starter_pack") {
        // Mark starter pack as paid
        const { error: bizError } = await supabase
          .from("businesses")
          .update({ starter_paid: true })
          .eq("owner_id", userId);

        if (bizError) {
          console.error("Error updating business:", bizError);
        } else {
          console.log("Marked starter_paid=true for user:", userId);
        }

        // Create Stripe Connect Express account
        const customerEmail = session.customer_email || session.customer_details?.email;
        
        if (customerEmail) {
          console.log("Creating Stripe Connect account for:", customerEmail);

          const account = await stripe.accounts.create({
            type: "express",
            email: customerEmail,
            capabilities: {
              card_payments: { requested: true },
              transfers: { requested: true },
            },
            metadata: { user_id: userId },
          });

          console.log("Created Connect account:", account.id);

          // Store Connect account ID
          const { error: accountError } = await supabase
            .from("businesses")
            .update({ stripe_account_id: account.id })
            .eq("owner_id", userId);

          if (accountError) {
            console.error("Error storing Connect account ID:", accountError);
          } else {
            console.log("Stored stripe_account_id for user:", userId);
          }
        } else {
          console.error("No customer email found in session");
        }
      }

      // Handle Subscription checkout completion
      if (session.mode === "subscription" && userId) {
        console.log("Subscription checkout completed for user:", userId);
        
        try {
          // Retrieve subscription details
          const subscriptionId = session.subscription as string;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);

          console.log("Subscription details:", {
            id: subscription.id,
            status: subscription.status,
            trial_end: subscription.trial_end,
            current_period_end: subscription.current_period_end,
          });

          // Update user's subscription status
          const { error: subError } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("user_id", userId);

          if (subError) {
            console.error("Error updating subscription status:", subError);
          } else {
            console.log("Updated subscription status for user:", userId);
          }
        } catch (subErr) {
          console.error("Error processing subscription:", subErr);
        }
      }
    }

    // Handle customer.subscription.updated
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("Subscription updated:", {
        id: subscription.id,
        customer: subscription.customer,
        status: subscription.status,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
          subscription_current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("stripe_customer_id", subscription.customer as string);

      if (error) {
        console.error("Error updating subscription:", error);
      } else {
        console.log("Updated subscription for customer:", subscription.customer);
      }
    }

    // Handle customer.subscription.deleted
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("Subscription deleted:", subscription.id);

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          subscription_current_period_end: new Date(
            subscription.current_period_end * 1000
          ).toISOString(),
        })
        .eq("stripe_customer_id", subscription.customer as string);

      if (error) {
        console.error("Error marking subscription as canceled:", error);
      }
    }

    // Handle invoice.payment_failed
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log("Invoice payment failed:", {
        invoice: invoice.id,
        customer: invoice.customer,
      });

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "past_due",
        })
        .eq("stripe_customer_id", invoice.customer as string);

      if (error) {
        console.error("Error updating to past_due:", error);
      } else {
        console.log("Marked subscription as past_due for customer:", invoice.customer);
      }
    }

    // Handle invoice.payment_succeeded (reactivate after payment)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Only update if this is a subscription invoice
      if (invoice.subscription) {
        console.log("Invoice payment succeeded:", {
          invoice: invoice.id,
          subscription: invoice.subscription,
        });

        try {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );

          const { error } = await supabase
            .from("profiles")
            .update({
              subscription_status: subscription.status,
              subscription_current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq("stripe_customer_id", invoice.customer as string);

          if (error) {
            console.error("Error updating after payment success:", error);
          }
        } catch (subErr) {
          console.error("Error retrieving subscription:", subErr);
        }
      }
    }

    // Handle account.updated (Connect onboarding status)
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;
      console.log("Account updated:", account.id, "charges_enabled:", account.charges_enabled);

      if (account.charges_enabled) {
        const { error } = await supabase
          .from("businesses")
          .update({ stripe_onboarded: true })
          .eq("stripe_account_id", account.id);

        if (error) {
          console.error("Error updating stripe_onboarded:", error);
        } else {
          console.log("Marked stripe_onboarded=true for account:", account.id);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
