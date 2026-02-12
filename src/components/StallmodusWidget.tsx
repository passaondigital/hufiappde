import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CloudRain, Sun, Wind, Snowflake, Volume2, Loader2, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StallmodusMessage {
  appointmentId: string;
  horseName: string;
  customerName: string | null;
  time: string | null;
  type: string;
  message: string;
}

interface StallmodusResult {
  success: boolean;
  dateFormatted: string;
  weather: {
    description: string;
    code: number;
    tempMax: number;
    tempMin: number;
    precipitationProbability: number;
    windMax: number;
    isRainy: boolean;
    isStormy: boolean;
    isSnowy: boolean;
  };
  messages: StallmodusMessage[];
  count: number;
  summary: string;
}

export default function StallmodusWidget() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StallmodusResult | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState("");

  const runStallmodus = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stallmodus`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Stallmodus fehlgeschlagen");
      }

      const data: StallmodusResult = await res.json();
      setResult(data);
      toast.success(data.summary);

      // Auto-play TTS
      await speakSummary(data.summary);
    } catch (e: any) {
      console.error("Stallmodus error:", e);
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const speakSummary = async (text: string) => {
    setSpeaking(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!res.ok) throw new Error("TTS fehlgeschlagen");

      const data = await res.json();
      const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      await audio.play();
    } catch (e) {
      console.error("TTS error:", e);
      setSpeaking(false);
    }
  };

  const WeatherIcon = ({ code }: { code: number }) => {
    if (code >= 70 && code <= 86) return <Snowflake size={20} className="text-primary" />;
    if (code >= 51) return <CloudRain size={20} className="text-primary" />;
    if (code <= 3) return <Sun size={20} className="text-primary" />;
    return <Wind size={20} className="text-muted-foreground" />;
  };

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Agent Stallmodus</h3>
            <p className="text-xs text-muted-foreground">Kunden für morgen benachrichtigen</p>
          </div>
        </div>
        <button
          onClick={runStallmodus}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={14} className="animate-spin" /> Läuft…</>
          ) : (
            <><Zap size={14} /> Aktivieren</>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            {/* Weather summary */}
            <div className="p-5 bg-secondary/30">
              <div className="flex items-center gap-3 mb-3">
                <WeatherIcon code={result.weather.code} />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {result.dateFormatted} – {result.weather.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.weather.tempMin}–{result.weather.tempMax}°C · Regen {result.weather.precipitationProbability}% · Wind {result.weather.windMax} km/h
                  </p>
                </div>
              </div>

              {/* Confirmation banner */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 text-primary">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">
                  Huufi hat {result.count} {result.count === 1 ? "Kunden" : "Kunden"} informiert
                </span>
                {speaking && (
                  <Volume2 size={14} className="ml-auto animate-pulse" />
                )}
              </div>
            </div>

            {/* Messages */}
            {result.messages.length > 0 && (
              <div className="p-5 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nachrichten</p>
                {result.messages.map((msg, i) => (
                  <motion.div
                    key={msg.appointmentId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users size={14} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {msg.customerName || msg.horseName}
                        </span>
                        {msg.time && (
                          <span className="text-xs text-muted-foreground">{msg.time}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{msg.message}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Replay button */}
            <div className="px-5 pb-5">
              <button
                onClick={() => result && speakSummary(result.summary)}
                disabled={speaking}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Volume2 size={12} /> {speaking ? "Spricht…" : "Nochmal vorlesen"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
