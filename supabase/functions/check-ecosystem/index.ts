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

const VALID_STATUSES = ["connected", "not_connected", "pending", "error"];

// HMAC-SHA256 signature verification
async function verifySignature(body: string, signature: string | null, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return signature === expected;
}

// Validate webhook_data shape
function validateWebhookData(data: unknown): data is { user_id: string; status?: string; external_id?: string } {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (typeof d.user_id !== "string" || d.user_id.length < 10 || d.user_id.length > 100) return false;
  if (d.status !== undefined && (typeof d.status !== "string" || !VALID_STATUSES.includes(d.status))) return false;
  if (d.external_id !== undefined && d.external_id !== null && (typeof d.external_id !== "string" || d.external_id.length > 255)) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rawBody = await req.text();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, app_key, user_id, webhook_data } = parsed as {
      action?: string;
      app_key?: string;
      user_id?: string;
      webhook_data?: unknown;
    };

    // Validate app_key against whitelist
    if (app_key && !APP_URLS[app_key]) {
      return new Response(JSON.stringify({ error: "Unknown app" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Webhook endpoint for external apps
    if (action === "webhook") {
      if (!app_key || !validateWebhookData(webhook_data)) {
        return new Response(JSON.stringify({ error: "Invalid webhook data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify webhook signature
      const signature = req.headers.get("x-webhook-signature");
      const secretKey = Deno.env.get(`ECOSYSTEM_WEBHOOK_SECRET`);
      if (!secretKey) {
        console.error("Webhook secret not configured");
        return new Response(JSON.stringify({ error: "Webhook not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const isValid = await verifySignature(rawBody, signature, secretKey);
      if (!isValid) {
        console.warn(`Webhook signature verification failed for app_key: ${app_key}`);
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const validatedData = webhook_data as { user_id: string; status?: string; external_id?: string };

      const { error } = await supabase
        .from("ecosystem_links")
        .update({
          status: validatedData.status || "connected",
          external_id: validatedData.external_id || null,
          connected_at: validatedData.status === "connected" ? new Date().toISOString() : null,
        })
        .eq("user_id", validatedData.user_id)
        .eq("app_key", app_key);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Status check – requires authenticated user
    if (action === "status") {
      if (!app_key || !user_id) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
      if (!app_key) {
        return new Response(JSON.stringify({ error: "Missing app_key" }), {
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
