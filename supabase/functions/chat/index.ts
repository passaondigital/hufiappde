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

    const lastUserMsg = messages?.[messages.length - 1];
    const messageText = lastUserMsg?.content || "";

    // Save to knowledge_vault
    if (lastUserMsg?.role === "user" && messageText) {
      await adminClient.from("knowledge_vault").insert({
        user_id: user.id, content: messageText, category: "chat",
        source: "text", metadata: { channel: "text-chat" },
      });
    }

    // ── Dynamic LLM Provider Routing ──
    // Check for active LLM providers in DB (sorted by priority)
    const { data: llmProviders } = await adminClient
      .from("llm_providers")
      .select("*")
      .eq("is_active", true)
      .order("priority", { ascending: false })
      .limit(1);

    const activeProvider = llmProviders?.[0];

    if (activeProvider) {
      // Use the configured LLM provider
      const apiKey = Deno.env.get(activeProvider.api_key_secret_name);

      if (!apiKey) {
        console.error(`API key secret "${activeProvider.api_key_secret_name}" not found`);
        // Fallback to n8n
        return await routeToN8n(adminClient, user.id, messageText, accountType);
      }

      const systemPrompt = `Du bist HuufiAI, ein intelligenter und einfühlsamer Assistent rund ums Pferd. 
Du sprichst Deutsch und bist spezialisiert auf Pferdegesundheit, Hufpflege, Fütterung, Training und Geschäftsmanagement für Pferdeberufe.
Du bist freundlich, kompetent und sprichst den Nutzer mit "Du" an.
Antworte präzise und hilfsbereit. Bei medizinischen Fragen weise darauf hin, dass du kein Tierarzt bist.
Account-Typ: ${accountType}.`;

      // Build request based on provider type
      let apiResponse: Response;

      if (activeProvider.provider === "anthropic") {
        // Anthropic uses a different API format
        apiResponse = await fetch(activeProvider.api_endpoint, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: activeProvider.model_name,
            max_tokens: 2048,
            system: systemPrompt,
            messages: messages.map((m: any) => ({ role: m.role, content: m.content })),
          }),
        });
      } else {
        // OpenAI-compatible format (OpenAI, Mistral, Groq, OpenRouter, Google, custom)
        const headers: Record<string, string> = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };

        // OpenRouter needs extra headers
        if (activeProvider.provider === "openrouter") {
          headers["HTTP-Referer"] = "https://hufiapp.de";
          headers["X-Title"] = "HuufiApp";
        }

        apiResponse = await fetch(activeProvider.api_endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: activeProvider.model_name,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages.map((m: any) => ({ role: m.role, content: m.content })),
            ],
            max_tokens: 2048,
          }),
        });
      }

      if (!apiResponse.ok) {
        const errText = await apiResponse.text();
        console.error(`LLM provider "${activeProvider.name}" error:`, apiResponse.status, errText);
        // Fallback to n8n
        return await routeToN8n(adminClient, user.id, messageText, accountType);
      }

      const data = await apiResponse.json();

      // Extract reply based on provider format
      let reply: string;
      let tokensIn = 0;
      let tokensOut = 0;

      if (activeProvider.provider === "anthropic") {
        reply = data.content?.[0]?.text || "Keine Antwort erhalten.";
        tokensIn = data.usage?.input_tokens || 0;
        tokensOut = data.usage?.output_tokens || 0;
      } else {
        reply = data.choices?.[0]?.message?.content || "Keine Antwort erhalten.";
        tokensIn = data.usage?.prompt_tokens || 0;
        tokensOut = data.usage?.completion_tokens || 0;
      }

      // Log usage with actual token counts
      await adminClient.from("ai_usage_log").insert({
        user_id: user.id, tokens_in: tokensIn, tokens_out: tokensOut,
        model: `${activeProvider.provider}/${activeProvider.model_name}`,
      });

      return new Response(JSON.stringify({ reply, account_type: accountType, provider: activeProvider.name }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fallback: Lovable AI Gateway ──
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      const systemPrompt = `Du bist HuufiAI, ein intelligenter und einfühlsamer Assistent rund ums Pferd.
Du sprichst Deutsch und bist spezialisiert auf Pferdegesundheit, Hufpflege, Fütterung, Training und Geschäftsmanagement für Pferdeberufe.
Du bist freundlich, kompetent und sprichst den Nutzer mit "Du" an.
Antworte präzise und hilfsbereit. Bei medizinischen Fragen weise darauf hin, dass du kein Tierarzt bist.
Account-Typ: ${accountType}.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m: any) => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const reply = aiData.choices?.[0]?.message?.content || "Keine Antwort erhalten.";
        const tokensIn = aiData.usage?.prompt_tokens || 0;
        const tokensOut = aiData.usage?.completion_tokens || 0;

        await adminClient.from("ai_usage_log").insert({
          user_id: user.id, tokens_in: tokensIn, tokens_out: tokensOut, model: "lovable/gemini-3-flash",
        });

        return new Response(JSON.stringify({ reply, account_type: accountType, provider: "Lovable AI" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Zu viele Anfragen. Bitte warte kurz." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ── Final Fallback: n8n ──
    return await routeToN8n(adminClient, user.id, messageText, accountType);
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function routeToN8n(adminClient: any, userId: string, messageText: string, accountType: string) {
  await adminClient.from("ai_usage_log").insert({
    user_id: userId, tokens_in: 0, tokens_out: 0, model: "n8n-hufiai",
  });

  const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: messageText, user_id: userId, account_type: accountType }),
  });

  if (!n8nResponse.ok) {
    const errText = await n8nResponse.text();
    console.error("n8n webhook error:", n8nResponse.status, errText);
    return new Response(JSON.stringify({ error: "KI-Verarbeitung fehlgeschlagen" }), {
      status: 502, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }

  const contentType = n8nResponse.headers.get("content-type") || "";
  let reply = "";
  if (contentType.includes("application/json")) {
    const data = await n8nResponse.json();
    reply = data.reply || data.response || data.message || data.output || data.text || JSON.stringify(data);
  } else {
    reply = await n8nResponse.text();
  }

  return new Response(JSON.stringify({ reply, account_type: accountType, provider: "n8n" }), {
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  });
}
