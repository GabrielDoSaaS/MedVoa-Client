import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

type SubState = {
  subscribed: boolean;
  subscription_status: string;
  subscription_tier: 'free' | 'premium';
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    return new Response("Missing Stripe secrets", { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  let event: Stripe.Event;
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? '', webhookSecret);
  } catch (err) {
    logStep('Invalid signature', { error: (err as Error).message });
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400, headers: corsHeaders });
  }

  // Idempotency check
  const eventId = event.id;
  const { data: existing } = await supabase.from('processed_events').select('id').eq('id', eventId).maybeSingle();
  if (existing) {
    logStep('Duplicate event ignored', { eventId });
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200, headers: corsHeaders });
  }

  const markProcessed = async () => {
    await supabase.from('processed_events').insert({ id: eventId });
  };

  const upsertByEmail = async (email: string, state: SubState) => {
    logStep('Upserting subscriber', { email, state });
    await supabase.from('subscribers').upsert({
      email,
      subscribed: state.subscribed,
      subscription_status: state.subscription_status,
      subscription_tier: state.subscription_tier,
      current_period_end: state.current_period_end,
      cancel_at_period_end: state.cancel_at_period_end,
      stripe_customer_id: state.stripe_customer_id ?? null,
      stripe_subscription_id: state.stripe_subscription_id ?? null,
    }, { onConflict: 'email' });
  };

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = (session.customer as string) || session.customer_details?.customer;
        const email = session.customer_details?.email || session.client_reference_id || session.customer_email || '';
        let state: SubState = {
          subscribed: true,
          subscription_status: 'active',
          subscription_tier: 'premium',
          current_period_end: null,
          cancel_at_period_end: false,
          stripe_subscription_id: (session.subscription as string) || null,
          stripe_customer_id: customerId || null,
        };
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          state.current_period_end = new Date(sub.current_period_end * 1000).toISOString();
          state.subscription_status = sub.status;
          state.cancel_at_period_end = !!sub.cancel_at_period_end;
        }
        if (email) await upsertByEmail(email, state);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email ?? '';
        const isActive = sub.status === 'active' || sub.status === 'trialing';
        const state: SubState = {
          subscribed: isActive,
          subscription_status: sub.status,
          subscription_tier: isActive ? 'premium' : 'free',
          current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: !!sub.cancel_at_period_end,
          stripe_subscription_id: sub.id,
          stripe_customer_id: customerId,
        };
        if (email) await upsertByEmail(email, state);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email ?? '';
        let sub: Stripe.Subscription | null = null;
        if (invoice.subscription) {
          sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        }
        const isActive = sub ? (sub.status === 'active' || sub.status === 'trialing') : true;
        const state: SubState = {
          subscribed: isActive,
          subscription_status: sub?.status ?? 'active',
          subscription_tier: isActive ? 'premium' : 'free',
          current_period_end: sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancel_at_period_end: !!sub?.cancel_at_period_end,
          stripe_subscription_id: sub?.id ?? (invoice.subscription as string) ?? null,
          stripe_customer_id: customerId,
        };
        if (email) await upsertByEmail(email, state);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
        const email = customer.email ?? '';
        const state: SubState = {
          subscribed: false,
          subscription_status: 'past_due',
          subscription_tier: 'free',
          current_period_end: null,
          cancel_at_period_end: false,
          stripe_subscription_id: (invoice.subscription as string) || null,
          stripe_customer_id: customerId,
        };
        if (email) await upsertByEmail(email, state);
        break;
      }
      default:
        logStep('Unhandled event', { type: event.type });
    }

    await markProcessed();
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: corsHeaders });
  } catch (error) {
    logStep('ERROR processing webhook', { message: (error as Error).message, stack: (error as Error).stack });
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: corsHeaders });
  }
});