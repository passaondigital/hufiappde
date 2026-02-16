import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Zap, TrendingUp, Calendar, Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

interface Trigger {
  id: string;
  icon: React.ReactNode;
  text: string;
  action: string;
  path?: string;
  prompt?: string;
  type: "upsell" | "tip" | "reminder";
}

interface SmartTriggersProps {
  onSendMessage?: (text: string) => void;
}

export default function SmartTriggers({ onSendMessage }: SmartTriggersProps) {
  const { user } = useAuth();
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    generateTriggers();
  }, [user]);

  const generateTriggers = async () => {
    if (!user) return;

    const [subRes, balRes, horsesRes, aptsRes] = await Promise.all([
      supabase.from("user_subscriptions").select("plan, ai_requests_today").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_balances").select("ai_tokens_remaining").eq("user_id", user.id).maybeSingle(),
      supabase.from("horses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("user_id", user.id)
        .gte("date", new Date().toISOString().split("T")[0]),
    ]);

    const plan = subRes.data?.plan || "free";
    const aiToday = subRes.data?.ai_requests_today || 0;
    const tokens = balRes.data?.ai_tokens_remaining || 0;
    const horseCount = horsesRes.count || 0;
    const aptCount = aptsRes.count || 0;

    const newTriggers: Trigger[] = [];

    // Upsell: Free user near limit
    if (plan === "free" && aiToday >= 7) {
      newTriggers.push({
        id: "upsell_limit",
        icon: <Zap size={14} className="text-primary" />,
        text: `${10 - aiToday} Anfragen übrig – mit Premium bis zu 100 pro Tag`,
        action: "Upgraden",
        path: "/app/abonnement",
        type: "upsell",
      });
    }

    // Upsell: Low tokens
    if (tokens > 0 && tokens < 100) {
      newTriggers.push({
        id: "upsell_tokens",
        icon: <Sparkles size={14} className="text-primary" />,
        text: `Nur noch ${tokens} Bonus-Tokens – jetzt nachfüllen`,
        action: "Tokens kaufen",
        path: "/app/abonnement",
        type: "upsell",
      });
    }

    // Tip: No horses yet
    if (horseCount === 0) {
      newTriggers.push({
        id: "tip_horse",
        icon: <Heart size={14} className="text-primary" />,
        text: "Leg dein erstes Pferd an für personalisierte Tipps",
        action: "Pferd anlegen",
        path: "/app/pferde",
        type: "tip",
      });
    }

    // Tip: Suggest using analysis
    if (horseCount > 0 && plan === "free") {
      newTriggers.push({
        id: "tip_analysis",
        icon: <TrendingUp size={14} className="text-primary" />,
        text: "Teste die Video-Bewegungsanalyse für deine Pferde",
        action: "Ausprobieren",
        path: "/app/video-analyse",
        type: "tip",
      });
    }

    // Reminder: No upcoming appointments
    if (aptCount === 0 && horseCount > 0) {
      newTriggers.push({
        id: "reminder_apt",
        icon: <Calendar size={14} className="text-primary" />,
        text: "Kein Termin geplant – soll ich einen vorschlagen?",
        action: "Termin fragen",
        prompt: "Welche Termine sollte ich für mein Pferd als nächstes einplanen?",
        type: "reminder",
      });
    }

    setTriggers(newTriggers.slice(0, 3));
  };

  const handleAction = (trigger: Trigger) => {
    if (trigger.prompt && onSendMessage) {
      onSendMessage(trigger.prompt);
    }
    dismiss(trigger.id);
  };

  const dismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const visibleTriggers = triggers.filter((t) => !dismissed.has(t.id));
  if (visibleTriggers.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {visibleTriggers.map((trigger) => (
          <motion.div
            key={trigger.id}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            layout
            className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
              trigger.type === "upsell"
                ? "bg-primary/5 border-primary/15"
                : "bg-card border-border"
            }`}
          >
            <div className="flex-shrink-0">{trigger.icon}</div>
            <p className="flex-1 text-xs text-foreground leading-snug">{trigger.text}</p>
            {trigger.path && !trigger.prompt ? (
              <Link
                to={trigger.path}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex-shrink-0"
              >
                {trigger.action} <ArrowRight size={10} />
              </Link>
            ) : (
              <button
                onClick={() => handleAction(trigger)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-medium hover:opacity-90 transition-opacity flex-shrink-0"
              >
                {trigger.action} <ArrowRight size={10} />
              </button>
            )}
            <button onClick={() => dismiss(trigger.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
