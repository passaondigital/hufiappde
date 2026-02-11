import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    const ELEVENLABS_AGENT_ID = Deno.env.get("ELEVENLABS_AGENT_ID");
    if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
      throw new Error("ElevenLabs configuration missing");
    }

    // Authenticate user
    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (token === supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user } } = await supabaseClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check AI limit
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: limitResult } = await adminClient.rpc("check_ai_limit", { p_user_id: user.id });
    if (limitResult && !limitResult.allowed) {
      return new Response(JSON.stringify({ error: limitResult.reason }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user profile for mode-dependent prompt
    const { data: profile } = await adminClient
      .from("profiles")
      .select("user_type, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    // Check if admin
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!roleData;

    // Get user's horses for context
    const { data: horses } = await adminClient
      .from("horses")
      .select("id, name, breed, age, notes")
      .eq("user_id", user.id)
      .limit(10);

    // Anti-amnesia: last 5 knowledge entries
    const { data: recentKnowledge } = await adminClient
      .from("knowledge_vault")
      .select("content, category, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    // Build mode-dependent system context
    const userMode = profile?.user_type || "personal";
    let contextPrompt = "";

    if (isAdmin) {
      // Admin (Pascal) gets full access
      const { data: strategies } = await adminClient
        .from("business_strategies")
        .select("content, category, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      contextPrompt = `Du sprichst mit ${profile?.display_name || "Pascal"}, dem Admin und Gründer von HuufiApp.
Modus: ADMIN/BUSINESS - Vollzugriff auf knowledge_base, Business-Strategien und alle Pferdedaten.
Du bist sein persönlicher Strategie- und Wissensassistent für App-Entwicklung, Hufpflege-Business und Pferdemanagement.

Letzte Business-Strategien: ${strategies?.map(s => `[${s.category}/${s.status}] ${s.content}`).join("\n") || "Keine"}`;
    } else if (userMode === "business") {
      contextPrompt = `Du sprichst mit ${profile?.display_name || "einem Profi"}.
Modus: BUSINESS (B2B) - Professioneller Assistent für Kundenmanagement, Terminplanung und Hufpflege.
Fokus: Effiziente Arbeitsorganisation, Kundenkommunikation, fachliche Huf-Befunde.`;
    } else {
      contextPrompt = `Du sprichst mit ${profile?.display_name || "einem Pferdebesitzer"}.
Modus: PERSÖNLICH (B2C) - Empathischer Begleiter für Pferdegesundheit und -pflege.
Fokus: Verständliche Erklärungen, emotionale Unterstützung, Gesundheitstipps.`;
    }

    const horsesContext = horses?.length
      ? `\n\nPferde des Nutzers:\n${horses.map(h => `- ${h.name} (${h.breed || "k.A."}, ${h.age || "?"} J.) ${h.notes ? `Notizen: ${h.notes}` : ""}`).join("\n")}`
      : "";

    const knowledgeContext = recentKnowledge?.length
      ? `\n\nLetzte Gespräche/Wissen:\n${recentKnowledge.map(k => `[${k.category}] ${k.content.substring(0, 200)}`).join("\n")}`
      : "";

    // Get conversation token from ElevenLabs
    const elResp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${ELEVENLABS_AGENT_ID}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
    );

    if (!elResp.ok) {
      const errText = await elResp.text();
      console.error("ElevenLabs token error:", elResp.status, errText);
      throw new Error("Voice token generation failed");
    }

    const { token: conversationToken } = await elResp.json();

    // Log usage
    await adminClient.from("ai_usage_log").insert({
      user_id: user.id,
      tokens_in: 0,
      tokens_out: 0,
      model: "elevenlabs-voice-agent",
    });

    return new Response(JSON.stringify({
      token: conversationToken,
      agentId: ELEVENLABS_AGENT_ID,
      context: contextPrompt + horsesContext + knowledgeContext,
      userMode,
      isAdmin,
      horses: horses?.map(h => ({ id: h.id, name: h.name })) || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-token error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
