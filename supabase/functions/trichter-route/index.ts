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
    const { text, source } = await req.json();
    if (!text?.trim()) {
      return new Response(JSON.stringify({ error: "No text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    // Fetch existing projects for duplicate check
    const { data: existingProjects } = await adminClient
      .from("projects_master")
      .select("id, name, assets_list, status")
      .eq("user_id", user.id);

    const projectsList = existingProjects || [];
    const projectNames = projectsList.map((p: any) => `"${p.name}"`).join(", ");
    const allAssets = projectsList.flatMap((p: any) => {
      const assets = p.assets_list;
      if (Array.isArray(assets)) return assets.map((a: any) => typeof a === "string" ? a : a.name || a.title || JSON.stringify(a));
      return [];
    });

    // AI classification
    let classification: any = { type: "knowledge", project: null, asset: null, duplicate: false, summary: "" };

    if (LOVABLE_API_KEY) {
      try {
        const classifyResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{
              role: "system",
              content: `Du bist ein intelligentes Routing-System. Analysiere den Input und antworte NUR mit einem JSON-Objekt:
{
  "type": "project" | "knowledge" | "todo" | "befund",
  "project": "Projektname falls erkannt oder null",
  "asset": "Asset-Name/Titel für das Projekt (kurz, max 60 Zeichen)",
  "summary": "Kurze Zusammenfassung des Inputs (max 120 Zeichen)",
  "duplicate": true/false
}

Bekannte Projekte des Users: ${projectNames || "keine"}
Bekannte Assets: ${allAssets.length > 0 ? allAssets.join(", ") : "keine"}

Regeln:
- type="project": Wenn es um ein Projekt, eine Idee, Strategie, Content, Workbook, Kurs oder ähnliches geht
- type="knowledge": Allgemeines Wissen, Notiz
- type="todo": Aufgabe, Erinnerung
- type="befund": Huf-Befund, Pferde-Medizin
- duplicate=true: Wenn asset inhaltlich einem bestehenden Asset sehr ähnlich ist
- project: Ordne existierendem Projekt zu falls passend, sonst schlage neuen Namen vor`,
            }, {
              role: "user",
              content: text,
            }],
            max_tokens: 200,
          }),
        });

        if (classifyResp.ok) {
          const data = await classifyResp.json();
          const raw = data.choices?.[0]?.message?.content?.trim() || "";
          // Extract JSON from response
          const jsonMatch = raw.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            classification = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (e) {
        console.error("Classification error:", e);
      }
    }

    const results: Record<string, any> = {};
    let duplicateWarning: string | null = null;

    // Route to project if applicable
    if (classification.type === "project" && classification.project) {
      const existingProject = projectsList.find(
        (p: any) => p.name.toLowerCase() === classification.project.toLowerCase()
      );

      if (existingProject) {
        // Check for duplicates in assets_list
        if (classification.duplicate) {
          duplicateWarning = `Ähnlicher Eintrag existiert bereits in "${existingProject.name}"`;
        }

        // Append new asset
        const currentAssets = Array.isArray(existingProject.assets_list) ? existingProject.assets_list : [];
        const newAsset = {
          name: classification.asset || classification.summary,
          content: text.substring(0, 500),
          source: source || "text",
          added_at: new Date().toISOString(),
        };
        const updatedAssets = [...currentAssets, newAsset];

        const { data: updated } = await adminClient
          .from("projects_master")
          .update({
            assets_list: updatedAssets,
            last_logic_update: new Date().toISOString(),
          })
          .eq("id", existingProject.id)
          .select()
          .single();
        results.project = updated;
      } else {
        // Create new project
        const newAsset = {
          name: classification.asset || classification.summary,
          content: text.substring(0, 500),
          source: source || "text",
          added_at: new Date().toISOString(),
        };
        const { data: created } = await adminClient
          .from("projects_master")
          .insert({
            user_id: user.id,
            name: classification.project,
            status: "aktiv",
            assets_list: [newAsset],
          })
          .select()
          .single();
        results.project = created;
      }
    }

    // Always save to knowledge_vault
    const { data: kvEntry } = await adminClient.from("knowledge_vault").insert({
      user_id: user.id,
      content: text,
      category: classification.type || "transcript",
      source: source || "text",
      metadata: { routing: classification.type, project: classification.project, asset: classification.asset },
    }).select().single();
    results.knowledge_vault = kvEntry;

    // Update learning profile
    await adminClient.from("user_learning_profile").upsert({
      user_id: user.id,
      input_count: 1,
      last_input_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    // Increment input_count
    const { data: profile } = await adminClient
      .from("user_learning_profile")
      .select("input_count, favorite_topics, patterns")
      .eq("user_id", user.id)
      .single();

    if (profile) {
      const topics = profile.favorite_topics || [];
      if (classification.type === "project" && classification.project && !topics.includes(classification.project)) {
        topics.push(classification.project);
        if (topics.length > 20) topics.shift();
      }
      await adminClient.from("user_learning_profile").update({
        input_count: (profile.input_count || 0) + 1,
        favorite_topics: topics,
        last_input_at: new Date().toISOString(),
      }).eq("user_id", user.id);
    }

    return new Response(JSON.stringify({
      classification,
      results,
      duplicateWarning,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trichter-route error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
