import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ME-ENTITLEMENTS] ${step}${detailsStr}`);
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

    const { data: sub } = await supabase
      .from('subscribers')
      .select('*')
      .or(`user_id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    const tier = sub?.subscribed ? 'premium' : 'free';

    const entitlements = tier === 'premium' ? {
      doutor_ia_daily: Infinity,
      quiz_monthly: Infinity,
      cases_monthly: Infinity,
      games_daily: Infinity,
      games_monthly: Infinity,
      flashcards_ai: true,
      medplay_upload: true,
      file_manager: true,
    } : {
      doutor_ia_daily: 3,
      quiz_monthly: 3,
      cases_monthly: 3,
      games_daily: 1,
      games_monthly: 5,
      flashcards_ai: false,
      medplay_upload: false,
      file_manager: false,
    };

    return new Response(JSON.stringify({
      tier,
      entitlements,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep('ERROR in /me/entitlements', { message: (error as Error).message });
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});