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
      const userId = session.client_reference_id || session.metadata?.user_id;
      const flow = session.metadata?.flow;
      const telemetrySessionId = session.metadata?.session_id;

      console.log("Checkout completed:", { userId, flow, sessionId: session.id });

      // Handle Starter Pack payment
      if (userId && flow === "starter_pack") {
        // 1) Mark business as paid and active
        const { error: bizError } = await supabase
          .from("businesses")
          .update({ 
            starter_paid: true,
            status: 'active'
          })
          .eq("owner_id", userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (bizError) {
          console.error("Error updating business:", bizError);
        } else {
          console.log("Business marked as starter_paid for user:", userId);
        }

        // 2) Start 14-day trial in profiles
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);
        
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            subscription_status: 'trialing',
            subscription_current_period_end: trialEndDate.toISOString(),
          })
          .eq("user_id", userId);

        if (profileError) {
          console.error("Error updating profile trial:", profileError);
        } else {
          console.log("14-day trial started for user:", userId);
        }

        // 3) Mark onboarding session as migrated (audit trail)
        if (telemetrySessionId) {
          const { error: sessionError } = await supabase
            .from("onboarding_sessions")
            .update({ 
              migrated_to_user_id: userId, 
              migrated_at: new Date().toISOString() 
            })
            .eq("session_id", telemetrySessionId);

          if (sessionError) {
            console.error("Error marking onboarding session:", sessionError);
          }
        }

        // Generate shopfront handle if it doesn't exist
        const { data: business } = await supabase
          .from("businesses")
          .select("id, business_name, handle")
          .eq("owner_id", userId)
          .maybeSingle();

        if (business && !business.handle) {
          const slug = (business.business_name || "shop")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "")
            .slice(0, 40);

          const handle = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;

          const { error: handleError } = await supabase
            .from("businesses")
            .update({ handle })
            .eq("id", business.id);

          if (handleError) {
            console.error("Error creating shopfront handle:", handleError);
          } else {
            console.log("✅ Generated shopfront handle:", handle);
          }
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

    // Handle payment_intent.succeeded (marketplace purchases)
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Only process if this is a marketplace purchase (has Connect transfer)
      if (paymentIntent.transfer_data && paymentIntent.metadata?.business_id) {
        console.log("Processing marketplace payment:", paymentIntent.id);

        const businessId = paymentIntent.metadata.business_id;
        const productId = paymentIntent.metadata.product_id;
        const quantity = parseInt(paymentIntent.metadata.quantity || "1", 10);
        
        // All amounts in cents
        const amountCents = paymentIntent.amount;
        const feeCents = paymentIntent.application_fee_amount ?? Math.round(amountCents * 0.15);
        const netCents = amountCents - feeCents;

        console.log("Order details:", {
          businessId,
          productId,
          amount: amountCents,
          fee: feeCents,
          net: netCents,
        });

        // Upsert order record (idempotent on webhook retries)
        const { error: orderError } = await supabase.from("orders").upsert(
          {
            business_id: businessId,
            product_id: productId,
            stripe_payment_intent: paymentIntent.id,
            amount_total: amountCents,
            platform_fee: feeCents,
            net_amount: netCents,
            customer_email: paymentIntent.receipt_email || null,
            currency: paymentIntent.currency.toUpperCase(),
            payment_method: "card",
            quantity,
            status: "paid",
          },
          { onConflict: "stripe_payment_intent" }
        );

        if (orderError) {
          console.error("Error inserting order:", orderError);
        } else {
          console.log("Order created for payment:", paymentIntent.id);
        }
      }
    }

    // Handle payment_intent.payment_failed (marketplace payment failures)
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("Payment intent failed:", paymentIntent.id);

      // Update existing order if it exists
      const { error } = await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("stripe_payment_intent", paymentIntent.id);

      if (error) {
        console.error("Error updating failed payment:", error);
      } else {
        console.log("Marked order as failed for payment:", paymentIntent.id);
      }
    }

    // Handle charge.refunded (refunds for marketplace purchases)
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;
      
      console.log("Charge refunded:", {
        chargeId: charge.id,
        paymentIntent: paymentIntentId,
        amountRefunded: charge.amount_refunded / 100,
      });

      if (paymentIntentId) {
        const { error } = await supabase
          .from("orders")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent", paymentIntentId);

        if (error) {
          console.error("Error updating refunded order:", error);
        } else {
          console.log("Marked order as refunded for payment:", paymentIntentId);
        }
      }
    }

    // Handle customer.subscription.created (new subscriptions)
    if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log("Subscription created:", {
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
        console.error("Error creating subscription record:", error);
      } else {
        console.log("Created subscription record for customer:", subscription.customer);
      }
    }

    // Handle transfer.created (funds moved to connected account)
    if (event.type === "transfer.created") {
      const transfer = event.data.object as Stripe.Transfer;
      
      console.log("Transfer created to connected account:", {
        transferId: transfer.id,
        destination: transfer.destination,
        amount: transfer.amount / 100,
        currency: transfer.currency,
      });

      // Optional: Log transfer information for reporting
      // Could extend orders table with payout_transfer_id to track this
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
