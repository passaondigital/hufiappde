import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Nicht autorisiert");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Auth fehlgeschlagen");

    // Determine next business day
    const today = new Date();
    let nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    // Skip weekends
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    const nextDayStr = nextDay.toISOString().split("T")[0];

    // Get user profile for location
    const { data: profile } = await supabase
      .from("profiles")
      .select("location_lat, location_lng, location_name, display_name")
      .eq("user_id", user.id)
      .maybeSingle();

    const lat = profile?.location_lat || 51.1657; // Default: Germany center
    const lng = profile?.location_lng || 10.4515;
    const userName = profile?.display_name?.split(" ")[0] || "Pascal";

    // Fetch weather from Open-Meteo (free, no key needed)
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=2`
    );
    const weatherData = await weatherRes.json();
    const tomorrowIdx = 1; // index 1 = tomorrow
    const daily = weatherData.daily;

    const weatherCode = daily.weather_code[tomorrowIdx];
    const tempMax = Math.round(daily.temperature_2m_max[tomorrowIdx]);
    const tempMin = Math.round(daily.temperature_2m_min[tomorrowIdx]);
    const precipProb = daily.precipitation_probability_max[tomorrowIdx];
    const windMax = Math.round(daily.wind_speed_10m_max[tomorrowIdx]);

    const wmoToDescription = (code: number): string => {
      if (code === 0) return "Klar";
      if (code <= 3) return "Teilweise bewölkt";
      if (code <= 48) return "Nebelig";
      if (code <= 57) return "Nieselregen";
      if (code <= 67) return "Regen";
      if (code <= 77) return "Schnee";
      if (code <= 82) return "Regenschauer";
      if (code <= 86) return "Schneeschauer";
      if (code <= 99) return "Gewitter";
      return "Unbekannt";
    };

    const weatherDesc = wmoToDescription(weatherCode);
    const isRainy = weatherCode >= 51 && weatherCode <= 99;
    const isStormy = windMax > 50;
    const isSnowy = weatherCode >= 70 && weatherCode <= 86;

    // Determine weather-based message
    let weatherAdvice = "";
    if (isRainy) {
      weatherAdvice = "Regen angesagt. Bitte sorge für trockene Hufe und einen sauberen Platz für die Bearbeitung.";
    } else if (isSnowy) {
      weatherAdvice = "Schnee erwartet. Bitte halte einen geschützten, trockenen Platz bereit.";
    } else if (isStormy) {
      weatherAdvice = "Starker Wind erwartet. Bitte sichere lose Gegenstände und halte einen windgeschützten Platz bereit.";
    } else if (precipProb > 60) {
      weatherAdvice = "Es könnte regnen. Bitte halte vorsichtshalber einen trockenen Platz bereit.";
    } else {
      weatherAdvice = "Gutes Wetter erwartet. Bis morgen!";
    }

    // Fetch tomorrow's appointments with horse and customer info
    const { data: appointments, error: aptError } = await supabase
      .from("appointments")
      .select("id, date, time, type, notes, horse_id, horses(id, name)")
      .eq("user_id", user.id)
      .eq("date", nextDayStr);

    if (aptError) throw new Error("Termine konnten nicht geladen werden");

    // Get customer names linked to horses
    const horseIds = (appointments || [])
      .map((a: any) => a.horse_id)
      .filter(Boolean);

    let customerMap: Record<string, string> = {};
    if (horseIds.length > 0) {
      const { data: customerHorses } = await supabase
        .from("customer_horses")
        .select("horse_id, customers(name, phone)")
        .in("horse_id", horseIds);

      if (customerHorses) {
        for (const ch of customerHorses as any[]) {
          if (ch.customers?.name) {
            customerMap[ch.horse_id] = ch.customers.name;
          }
        }
      }
    }

    // Generate personalized messages
    const messages = (appointments || []).map((apt: any) => {
      const horseName = apt.horses?.name || "Pferd";
      const customerName = apt.horse_id ? customerMap[apt.horse_id] || null : null;
      const recipientName = customerName || horseName;

      const message = `Hallo ${recipientName}, morgen ist ${weatherDesc.toLowerCase()} angesagt. ${weatherAdvice} Danke, ${userName}.`;

      return {
        appointmentId: apt.id,
        horseName,
        customerName,
        time: apt.time,
        type: apt.type,
        message,
      };
    });

    const dateFormatted = nextDay.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // Build summary
    const count = messages.length;
    const summary = count > 0
      ? `Huufi hat ${count} ${count === 1 ? "Kunden" : "Kunden"} für ${dateFormatted} informiert. Wetter: ${weatherDesc}, ${tempMin}–${tempMax}°C, Regenwahrscheinlichkeit ${precipProb}%, Wind ${windMax} km/h.`
      : `Keine Termine für ${dateFormatted} gefunden. Wetter: ${weatherDesc}, ${tempMin}–${tempMax}°C.`;

    return new Response(
      JSON.stringify({
        success: true,
        date: nextDayStr,
        dateFormatted,
        weather: {
          description: weatherDesc,
          code: weatherCode,
          tempMax,
          tempMin,
          precipitationProbability: precipProb,
          windMax,
          isRainy,
          isStormy,
          isSnowy,
        },
        messages,
        count,
        summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Stallmodus error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
