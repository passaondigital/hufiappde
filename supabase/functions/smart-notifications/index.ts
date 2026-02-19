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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    
    // Find appointments happening in the next 60 minutes
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    const nowTime = now.toTimeString().slice(0, 5);
    const oneHourTime = inOneHour.toTimeString().slice(0, 5);

    const { data: upcomingApts } = await adminClient
      .from("appointments")
      .select("*, horses(name)")
      .eq("date", todayStr)
      .gte("time", nowTime)
      .lte("time", oneHourTime);

    if (!upcomingApts || upcomingApts.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: "Keine anstehenden Termine" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalSent = 0;

    for (const apt of upcomingApts) {
      // Get push subscriptions for this user
      const { data: subs } = await adminClient
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", apt.user_id);

      if (!subs || subs.length === 0) continue;

      const horseName = (apt as any).horses?.name || "Allgemein";
      const title = "🐴 Termin-Erinnerung";
      const body = `In Kürze: ${apt.type} – ${horseName} (${apt.time} Uhr)`;

      // For each subscription, we log the notification
      // Since we don't have VAPID keys for web push, we use the Notification API on the client
      // Store a notification record so the client can poll for it
      await adminClient.from("knowledge_vault").insert({
        user_id: apt.user_id,
        content: JSON.stringify({ title, body, type: "appointment_reminder", appointment_id: apt.id }),
        category: "notification",
        source: "system",
        metadata: { channel: "push", sent_at: now.toISOString() },
      });

      totalSent++;
    }

    // Also check for medical logs that might indicate upcoming vaccinations
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const { data: medLogs } = await adminClient
      .from("medical_logs")
      .select("user_id, title, horse_id, horses(name)")
      .eq("log_type", "impfung")
      .gte("created_at", new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .lte("created_at", new Date(now.getTime() - 335 * 24 * 60 * 60 * 1000).toISOString());

    if (medLogs && medLogs.length > 0) {
      for (const log of medLogs) {
        const horseName = (log as any).horses?.name || "dein Pferd";
        await adminClient.from("knowledge_vault").insert({
          user_id: log.user_id,
          content: JSON.stringify({
            title: "💉 Impf-Erinnerung",
            body: `Die letzte Impfung für ${horseName} ist bald ein Jahr her. Zeit für einen Auffrischungstermin?`,
            type: "vaccination_reminder",
          }),
          category: "notification",
          source: "system",
          metadata: { channel: "push", sent_at: now.toISOString() },
        });
        totalSent++;
      }
    }

    return new Response(JSON.stringify({ sent: totalSent, message: `${totalSent} Benachrichtigungen verarbeitet` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("smart-notifications error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
