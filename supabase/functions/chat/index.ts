import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const N8N_WEBHOOK_URL = "https://verteiler.passaon.com/webhook/hufiai-chat";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();

    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authentifizierung erforderlich" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (token === supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Authentifizierung erforderlich" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Authentifizierung erforderlich" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check AI limit
    const { data: limitResult } = await adminClient.rpc("check_ai_limit", { p_user_id: user.id });
    if (limitResult && !limitResult.allowed) {
      return new Response(JSON.stringify({ error: limitResult.reason }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get subscription plan
    const { data: subscription } = await adminClient
      .from("user_subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    const accountType = subscription?.plan === "premium" ? "pro" : "free";

    // Get the last user message
    const lastUserMsg = messages?.[messages.length - 1];
    const messageText = lastUserMsg?.content || "";

    // Save to knowledge_vault
    if (lastUserMsg?.role === "user" && messageText) {
      await adminClient.from("knowledge_vault").insert({
        user_id: user.id,
        content: messageText,
        category: "chat",
        source: "text",
        metadata: { channel: "text-chat" },
      });
    }

    // Log usage
    await adminClient.from("ai_usage_log").insert({
      user_id: user.id, tokens_in: 0, tokens_out: 0, model: "n8n-hufiai",
    });

    // Forward to n8n webhook
    const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: messageText,
        user_id: user.id,
        account_type: accountType,
      }),
    });

    if (!n8nResponse.ok) {
      const errText = await n8nResponse.text();
      console.error("n8n webhook error:", n8nResponse.status, errText);
      return new Response(JSON.stringify({ error: "KI-Verarbeitung fehlgeschlagen" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // n8n can return text or JSON – handle both
    const contentType = n8nResponse.headers.get("content-type") || "";
    let reply = "";

    if (contentType.includes("application/json")) {
      const data = await n8nResponse.json();
      // Support various response shapes from n8n
      reply = data.reply || data.response || data.message || data.output || data.text || JSON.stringify(data);
    } else {
      reply = await n8nResponse.text();
    }

    return new Response(JSON.stringify({
      reply,
      account_type: accountType,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
