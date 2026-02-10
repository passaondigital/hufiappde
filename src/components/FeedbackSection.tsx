import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Lightbulb, AlertTriangle, HelpCircle, Send, Star, ChevronDown, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "problem", label: "Problem melden", icon: AlertTriangle, color: "text-destructive" },
  { key: "wunsch", label: "Idee einreichen", icon: Lightbulb, color: "text-yellow-500" },
  { key: "frage", label: "Frage stellen", icon: HelpCircle, color: "text-blue-500" },
  { key: "feedback", label: "Feedback geben", icon: MessageSquarePlus, color: "text-primary" },
];

const PRIORITIES = [
  { key: "low", label: "Niedrig" },
  { key: "normal", label: "Normal" },
  { key: "high", label: "Dringend" },
];

interface FeedbackEntry {
  id: string;
  category: string;
  content: string;
  priority: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

export default function FeedbackSection() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("feedback");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("normal");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadFeedbacks();
  }, [user]);

  const loadFeedbacks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setFeedbacks((data || []) as FeedbackEntry[]);
  };

  const submit = async () => {
    if (!content.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("user_feedback").insert({
      user_id: user.id,
      category,
      content: content.trim(),
      priority,
      context: "manual",
    });
    if (error) toast.error("Fehler beim Senden");
    else {
      toast.success("Danke für dein Feedback!");
      setContent("");
      setShowForm(false);
      loadFeedbacks();

      // Notify admin via email (fire and forget)
      const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
      supabase.functions.invoke("notify-admin-feedback", {
        body: { category, content: content.trim(), userName: profile?.display_name || "Unbekannt" },
      }).catch(() => {});
    }
    setSending(false);
  };

  const statusLabel = (s: string) => {
    if (s === "offen") return { text: "Offen", cls: "bg-yellow-500/10 text-yellow-600" };
    if (s === "geprueft") return { text: "Geprüft", cls: "bg-blue-500/10 text-blue-600" };
    return { text: "Erledigt", cls: "bg-green-500/10 text-green-600" };
  };

  const catIcon = (c: string) => CATEGORIES.find(x => x.key === c) || CATEGORIES[3];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Huufi verbessern</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          {showForm ? "Abbrechen" : "Neues Feedback"}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              {/* Category selection */}
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`flex items-center gap-2 p-3 rounded-lg text-xs font-medium transition-colors border ${
                      category === cat.key
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <cat.icon size={14} className={cat.color} />
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Beschreibe dein Anliegen…"
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />

              {/* Priority */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Dringlichkeit:</span>
                {PRIORITIES.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPriority(p.key)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                      priority === p.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                onClick={submit}
                disabled={!content.trim() || sending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={14} /> Absenden
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Existing feedbacks */}
      <div className="space-y-2">
        {feedbacks.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground text-center py-6">
            Du hast noch kein Feedback gegeben. Hilf uns, Huufi besser zu machen! 💬
          </p>
        )}
        {feedbacks.map(fb => {
          const cat = catIcon(fb.category);
          const st = statusLabel(fb.status);
          return (
            <div key={fb.id} className="p-4 rounded-xl bg-card border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <cat.icon size={14} className={cat.color} />
                  <span className="text-xs font-medium text-foreground">{cat.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
              </div>
              <p className="text-sm text-foreground">{fb.content}</p>
              {fb.admin_response && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-[10px] text-muted-foreground mb-1">Antwort vom Team:</p>
                  <p className="text-xs text-foreground">{fb.admin_response}</p>
                </div>
              )}
              <p className="text-[10px] text-muted-foreground">
                {new Date(fb.created_at).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
