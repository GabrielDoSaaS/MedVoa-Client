import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, updating unsubscribed state");
      
      // Upsert subscriber record in Supabase (using profiles table instead)
      const { data: profileData, error: profileError } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
      }

      return new Response(JSON.stringify({ 
        subscribed: false, 
        subscription_tier: 'free',
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });
    const hasAnySub = subscriptions.data.length > 0;
    const activeSub = subscriptions.data.find((s: any) => s.status === 'active' || s.status === 'trialing') || null;

    let hasActiveSub = !!activeSub;
    let subscriptionTier = hasActiveSub ? 'premium' : 'free';
    let subscriptionEnd: string | null = activeSub ? new Date(activeSub.current_period_end * 1000).toISOString() : null;

    if (hasActiveSub && activeSub) {
      logStep("Active/trialing subscription found", { subscriptionId: activeSub.id, endDate: subscriptionEnd, status: activeSub.status });
    } else if (hasAnySub) {
      const latest = subscriptions.data[0];
      logStep("Subscription present but not active", { subscriptionId: latest.id, status: latest.status });
    } else {
      logStep("No subscription found");
    }

    // Upsert subscribers table (single source of truth)
    const upsertPayload: any = {
      email: user.email,
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: activeSub?.id ?? null,
      subscribed: hasActiveSub,
      subscription_status: activeSub?.status ?? (hasAnySub ? subscriptions.data[0].status : 'none'),
      subscription_tier: subscriptionTier,
      current_period_end: subscriptionEnd,
      cancel_at_period_end: activeSub?.cancel_at_period_end ?? false,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabaseClient
      .from('subscribers')
      .upsert(upsertPayload, { onConflict: 'email' });
    if (upsertError) {
      console.error('Error upserting subscribers:', upsertError);
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_tier: subscriptionTier,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ 
      error: errorMessage,
      subscribed: false,
      subscription_tier: 'free',
      subscription_end: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});