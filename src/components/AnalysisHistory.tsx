import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { History, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface MotionAnalysis {
  id: string;
  horse_name: string | null;
  owner_name: string | null;
  symmetry_score: number;
  lameness_index: number;
  beat_clarity: number;
  symmetry_desc: string | null;
  lameness_desc: string | null;
  beat_desc: string | null;
  ai_note: string | null;
  created_at: string;
}

export default function AnalysisHistory() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<MotionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalyses = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("motion_analyses")
      .select("id, horse_name, owner_name, symmetry_score, lameness_index, beat_clarity, symmetry_desc, lameness_desc, beat_desc, ai_note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching analyses:", error);
    } else {
      setAnalyses(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalyses();
  }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("motion_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Fehler beim Löschen");
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analyse gelöscht");
    }
  };

  const getTrend = (current: MotionAnalysis, index: number) => {
    if (index >= analyses.length - 1) return null;
    const prev = analyses[index + 1];
    const diff = current.symmetry_score - prev.symmetry_score;
    if (diff > 2) return "up";
    if (diff < -2) return "down";
    return "stable";
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">
        Verlauf wird geladen...
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="p-8 text-center space-y-2">
        <History size={32} className="mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t("videoAnalysis.noHistory", "Noch keine Analysen gespeichert.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {analyses.map((a, i) => {
          const trend = getTrend(a, i);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 rounded-xl bg-card border border-border space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {a.horse_name || t("videoAnalysis.unknownHorse", "Unbekannt")}
                    </span>
                    {a.owner_name && (
                      <span className="text-xs text-muted-foreground">· {a.owner_name}</span>
                    )}
                    {trend && (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        trend === "up" ? "bg-primary/10 text-primary" : trend === "down" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                      }`}>
                        {trend === "up" && <TrendingUp size={10} />}
                        {trend === "down" && <TrendingDown size={10} />}
                        {trend === "stable" && <Minus size={10} />}
                        {trend === "up" ? "↑" : trend === "down" ? "↓" : "="}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(a.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                  title="Löschen"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground">{t("videoAnalysis.symmetryScore", "Symmetrie")}</p>
                  <p className={`text-sm font-bold ${a.symmetry_score < 85 ? "text-destructive" : "text-primary"}`}>
                    {a.symmetry_score}%
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground">{t("videoAnalysis.lamenessIndex", "Lahmheit")}</p>
                  <p className={`text-sm font-bold ${Number(a.lameness_index) > 1.5 ? "text-destructive" : "text-primary"}`}>
                    {a.lameness_index}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <p className="text-[10px] text-muted-foreground">{t("videoAnalysis.beatClarity", "Taktklarheit")}</p>
                  <p className="text-sm font-bold text-primary">{a.beat_clarity}%</p>
                </div>
              </div>

              {a.ai_note && (
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{a.ai_note}</p>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
