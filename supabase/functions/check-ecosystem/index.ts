import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const APP_URLS: Record<string, string> = {
  hufmanager: "https://hufmanager.de",
  hufiai: "https://hufiai.lovable.app",
  hufiapp: "https://hufiapp.de",
  memberhorse: "https://memberhorse.de",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, app_key, user_id, webhook_data } = await req.json();

    // Webhook endpoint for external apps
    if (action === "webhook") {
      if (!app_key || !webhook_data?.user_id) {
        return new Response(JSON.stringify({ error: "Missing webhook data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("ecosystem_links")
        .update({
          status: webhook_data.status || "connected",
          external_id: webhook_data.external_id || null,
          connected_at: webhook_data.status === "connected" ? new Date().toISOString() : null,
        })
        .eq("user_id", webhook_data.user_id)
        .eq("app_key", app_key);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Status check
    if (action === "status") {
      const appUrl = APP_URLS[app_key];
      if (!appUrl) {
        return new Response(JSON.stringify({ status: "not_connected", message: "Unknown app" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try to check external app status (best-effort)
      try {
        const res = await fetch(`${appUrl}/api/ecosystem/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id }),
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch {
        // External app not reachable – return current DB status
      }

      const { data: link } = await supabase
        .from("ecosystem_links")
        .select("status, external_id")
        .eq("user_id", user_id)
        .eq("app_key", app_key)
        .maybeSingle();

      return new Response(JSON.stringify({
        status: link?.status || "not_connected",
        external_id: link?.external_id || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Connect action
    if (action === "connect") {
      const appUrl = APP_URLS[app_key];
      if (!appUrl) {
        return new Response(JSON.stringify({ error: "Unknown app" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        status: "connected",
        redirect_url: null,
        external_id: null,
        message: `Verbindung zu ${app_key} wird hergestellt`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
