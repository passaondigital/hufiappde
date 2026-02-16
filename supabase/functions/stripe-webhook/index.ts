import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "No signature" }), { status: 400 });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata?.user_id || !metadata?.addon_type || !metadata?.amount) {
      console.log("Not an addon purchase, skipping:", session.id);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const userId = metadata.user_id;
    const addonType = metadata.addon_type;
    const amount = parseInt(metadata.amount, 10);
    const addonKey = metadata.addon_key || "unknown";

    console.log(`Processing addon: ${addonType} x${amount} for user ${userId}`);

    // Ensure user_balances row exists
    const { data: existing } = await supabaseAdmin
      .from("user_balances")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin.from("user_balances").insert({ user_id: userId });
    }

    // Credit the balance
    if (addonType === "tokens") {
      const { error } = await supabaseAdmin.rpc("credit_tokens", {
        p_user_id: userId,
        p_amount: amount,
      });
      if (error) console.error("Token credit error:", error);
      else console.log(`Credited ${amount} tokens to ${userId}`);
    } else if (addonType === "storage") {
      const { error } = await supabaseAdmin.rpc("credit_storage", {
        p_user_id: userId,
        p_amount: amount,
      });
      if (error) console.error("Storage credit error:", error);
      else console.log(`Credited ${amount} GB storage to ${userId}`);
    }

    // Log the purchase
    await supabaseAdmin.from("addon_purchases").insert({
      user_id: userId,
      addon_type: addonType,
      addon_key: addonKey,
      amount,
      stripe_session_id: session.id,
    });

    console.log(`Addon purchase logged: ${addonKey} for ${userId}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});
