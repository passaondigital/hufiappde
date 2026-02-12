import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Model tiers
const FREE_MODEL = "google/gemini-2.5-flash-lite";
const PREMIUM_MODEL = "google/gemini-3-flash-preview";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

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

    // Load user context: profile, role, horses, recent knowledge, subscription
    const [{ data: profile }, { data: roleData }, { data: horses }, { data: recentKnowledge }, { data: subscription }] = await Promise.all([
      adminClient.from("profiles").select("user_type, display_name").eq("user_id", user.id).maybeSingle(),
      adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      adminClient.from("horses").select("id, name, breed, age, notes").eq("user_id", user.id).limit(10),
      adminClient.from("knowledge_vault").select("content, category, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      adminClient.from("user_subscriptions").select("plan, is_active").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
    ]);

    const isAdmin = !!roleData;
    const userMode = profile?.user_type || "personal";
    const isPremium = isAdmin || subscription?.plan === "premium";
    const selectedModel = isPremium ? PREMIUM_MODEL : FREE_MODEL;

    // Build mode-dependent system prompt
    let modePrompt = "";
    if (isAdmin) {
      const { data: strategies } = await adminClient.from("business_strategies")
        .select("content, category, status").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(5);

      modePrompt = `Du sprichst mit ${profile?.display_name || "Pascal"}, dem Admin und Gründer von HuufiApp.
Modus: ADMIN – Vollzugriff auf Knowledge Vault, Business-Strategien und alle Pferdedaten.
Du bist sein persönlicher Strategie- und Wissensassistent.

Letzte Strategien: ${strategies?.map(s => `[${s.category}/${s.status}] ${s.content}`).join("\n") || "Keine"}`;
    } else if (userMode === "business") {
      modePrompt = `Du sprichst mit ${profile?.display_name || "einem Profi"}.
Modus: BUSINESS – Professioneller Assistent für Kundenmanagement, Terminplanung und Hufpflege.`;
    } else {
      modePrompt = `Du sprichst mit ${profile?.display_name || "einem Pferdebesitzer"}.
Modus: PERSÖNLICH – Empathischer Begleiter für Pferdegesundheit und -pflege.`;
    }

    const horsesCtx = horses?.length
      ? `\n\nPferde:\n${horses.map(h => `- ${h.name} (${h.breed || "k.A."}, ${h.age || "?"} J.)${h.notes ? ` – ${h.notes}` : ""}`).join("\n")}`
      : "";

    const knowledgeCtx = recentKnowledge?.length
      ? `\n\nLetzte Wissenseinträge:\n${recentKnowledge.map(k => `[${k.category}] ${k.content.substring(0, 200)}`).join("\n")}`
      : "";

    const systemPrompt = `Du bist der HuufiApp Assistent – ein freundlicher, kompetenter KI-Berater rund ums Pferd.

${modePrompt}${horsesCtx}${knowledgeCtx}

Wichtige Regeln:
- Du gibst KEINE medizinischen Diagnosen. Bei gesundheitlichen Problemen empfiehlst du immer einen Tierarzt.
- Antworte immer auf Deutsch.
- Halte deine Antworten klar, konkret und hilfreich.
- Sei empathisch – Pferdebesitzer machen sich oft Sorgen.
- Wenn du dir nicht sicher bist, sage das ehrlich.`;

    // Log usage with model info
    await adminClient.from("ai_usage_log").insert({
      user_id: user.id, tokens_in: 0, tokens_out: 0, model: selectedModel,
    });

    // Save user's last message to knowledge_vault
    const lastUserMsg = messages?.[messages.length - 1];
    if (lastUserMsg?.role === "user" && lastUserMsg.content) {
      await adminClient.from("knowledge_vault").insert({
        user_id: user.id,
        content: lastUserMsg.content,
        category: "chat",
        source: "text",
        metadata: { channel: "text-chat" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte versuche es gleich nochmal." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Guthaben aufgebraucht. Bitte Credits aufladen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Fehler aufgetreten" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return stream with model info header
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "X-Model-Tier": isPremium ? "premium" : "free",
        "X-Model-Name": selectedModel,
      },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
