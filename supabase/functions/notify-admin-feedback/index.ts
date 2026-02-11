import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Reject if token is just the anon key
    if (token === supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Auth required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const { category, content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Missing content" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get verified display_name from database instead of trusting client input
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const userName = profile?.display_name || "Unbekannt";

    const categoryLabels: Record<string, string> = {
      problem: "🔴 Problem",
      wunsch: "💡 Wunsch",
      frage: "❓ Frage",
      feedback: "💬 Feedback",
    };

    const safeCategory = typeof category === "string" && categoryLabels[category] ? category : "feedback";
    const catLabel = categoryLabels[safeCategory];

    // Sanitize content for HTML email (prevent XSS in email clients)
    const sanitizedContent = content.trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    const sanitizedUserName = userName
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const emailResponse = await resend.emails.send({
      from: "HuufiApp <noreply@huufiapp.de>",
      to: ["passaondigital@gmail.com"],
      subject: `[HuufiApp] Neues Feedback: ${catLabel}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e; margin-bottom: 8px;">Neues Nutzer-Feedback</h2>
          <div style="background: #f8f8fc; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Kategorie</p>
            <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">${catLabel}</p>
            <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Von</p>
            <p style="margin: 0 0 16px; font-size: 14px;">${sanitizedUserName}</p>
            <p style="margin: 0 0 8px; font-size: 12px; color: #666;">Nachricht</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">${sanitizedContent}</p>
          </div>
          <p style="font-size: 12px; color: #999;">
            Öffne das Admin Dashboard → MVP-Learning → Feedback, um zu antworten.
          </p>
        </div>
      `,
    });

    console.log("Admin notification sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending admin notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
