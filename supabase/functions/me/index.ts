import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ME] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    // Try reading from subscribers table first
    let sub: any = null;
    let subError: any = null;
    try {
      const res = await supabase
        .from('subscribers')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email}`)
        .maybeSingle();
      sub = res.data;
      subError = res.error;
    } catch (e) {
      subError = e;
    }

    let isPremium = !!sub?.subscribed;
    let subscription_status = sub?.subscription_status ?? 'none';
    let current_period_end = sub?.current_period_end ?? null;

    // Fallback to Stripe direct check when table is missing or no row
    if (!isPremium && (!sub || subError)) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          const customerId = customers.data[0].id;
          const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 3 });
          const active = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing');
          if (active) {
            isPremium = true;
            subscription_status = active.status;
            current_period_end = new Date(active.current_period_end * 1000).toISOString();
          } else if (subscriptions.data.length > 0) {
            subscription_status = subscriptions.data[0].status;
          }
        }
      }
    }

    const response = {
      id: user.id,
      name: user.user_metadata?.full_name ?? null,
      email: user.email,
      isPremium,
      plan: isPremium ? 'premium' : 'free',
      subscription_status,
      current_period_end,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep('ERROR in /me', { message: (error as Error).message });
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});