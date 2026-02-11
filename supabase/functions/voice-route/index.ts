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
    const { transcript, durationSeconds, horseId } = await req.json();
    if (!transcript?.trim()) {
      return new Response(JSON.stringify({ error: "No transcript" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth
    const authHeader = req.headers.get("authorization") || "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

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

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check role & profile
    const [{ data: roleData }, { data: profile }] = await Promise.all([
      adminClient.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      adminClient.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle(),
    ]);
    const isAdmin = !!roleData;
    const userMode = profile?.user_type || "personal";

    // Use AI to classify the transcript
    let routingResult = "knowledge";
    let category = "transcript";

    if (LOVABLE_API_KEY) {
      try {
        const classifyResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [{
              role: "system",
              content: `Klassifiziere den folgenden Text in GENAU EINE Kategorie. Antworte NUR mit dem Kategorie-Namen:
- "huf_befund" = Fachlicher Huf-Befund, Hufmaße, Beschlag, Stellung, Befunde am Huf
- "business_idee" = Business-Idee, Strategie, App-Feature, Geschäftsmodell
- "todo" = Aufgabe, To-Do, Erinnerung, Termin
- "wissen" = Allgemeines Wissen, Information, Notiz, Gespräch`,
            }, {
              role: "user",
              content: transcript,
            }],
            max_tokens: 20,
          }),
        });

        if (classifyResp.ok) {
          const data = await classifyResp.json();
          const classification = data.choices?.[0]?.message?.content?.trim()?.toLowerCase() || "";

          if (classification.includes("huf_befund")) {
            routingResult = "medical";
            category = "befund";
          } else if (classification.includes("business_idee")) {
            routingResult = isAdmin ? "business" : "knowledge";
            category = "idee";
          } else if (classification.includes("todo")) {
            routingResult = isAdmin ? "business" : "knowledge";
            category = "todo";
          } else {
            routingResult = "knowledge";
            category = "wissen";
          }
        }
      } catch (e) {
        console.error("Classification error:", e);
      }
    }

    // Route data based on classification
    const results: Record<string, any> = {};

    // Always save to knowledge_vault
    const { data: kvEntry } = await adminClient.from("knowledge_vault").insert({
      user_id: user.id,
      content: transcript,
      category,
      source: "voice",
      metadata: { duration: durationSeconds, routing: routingResult, horse_id: horseId },
    }).select().single();
    results.knowledge_vault = kvEntry;

    // Route to specific tables
    if (routingResult === "medical" && horseId) {
      const { data: medEntry } = await adminClient.from("medical_logs").insert({
        user_id: user.id,
        horse_id: horseId,
        log_type: "befund",
        title: transcript.substring(0, 80),
        findings: transcript,
        source: "voice",
      }).select().single();
      results.medical_log = medEntry;
    }

    if (routingResult === "business" && isAdmin) {
      const { data: bizEntry } = await adminClient.from("business_strategies").insert({
        user_id: user.id,
        content: transcript,
        category,
        source: "voice",
      }).select().single();
      results.business_strategy = bizEntry;
    }

    // Log voice usage for billing
    await adminClient.from("voice_usage_log").insert({
      user_id: user.id,
      duration_seconds: durationSeconds || 0,
      agent_id: Deno.env.get("ELEVENLABS_AGENT_ID") || "",
      transcript: transcript.substring(0, 500),
      routing_result: routingResult,
    });

    return new Response(JSON.stringify({
      routing: routingResult,
      category,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("voice-route error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
