import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircleQuestion, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MvpQuestion {
  key: string;
  question: string;
  triggerDays?: number;
  triggerEvent?: string;
}

const MVP_QUESTIONS: MvpQuestion[] = [
  { key: "after_3_days", question: "Hilft dir Huufi aktuell im Alltag mit deinem Pferd?", triggerDays: 3 },
  { key: "after_first_chat", question: "Hat dir der KI-Assistent geholfen?", triggerEvent: "first_chat" },
  { key: "after_7_days", question: "Was fehlt dir gerade am meisten in Huufi?", triggerDays: 7 },
  { key: "after_14_days", question: "Würdest du Huufi weiterempfehlen?", triggerDays: 14 },
  { key: "after_30_days", question: "Hat Huufi deinen Alltag mit Pferden verbessert?", triggerDays: 30 },
];

export default function MvpQuestionPrompt() {
  const { user } = useAuth();
  const [activeQuestion, setActiveQuestion] = useState<MvpQuestion | null>(null);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    checkForQuestion();
  }, [user]);

  const checkForQuestion = async () => {
    if (!user) return;

    // Get user profile to know registration date
    const { data: profile } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile) return;

    // Get already answered questions
    const { data: answered } = await supabase
      .from("mvp_question_responses")
      .select("question_key")
      .eq("user_id", user.id);
    const answeredKeys = new Set((answered || []).map(a => a.question_key));

    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check if first chat happened
    const { count: chatCount } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user");

    // Find first unanswered applicable question
    for (const q of MVP_QUESTIONS) {
      if (answeredKeys.has(q.key)) continue;
      if (q.triggerDays && daysSinceSignup >= q.triggerDays) {
        setActiveQuestion(q);
        return;
      }
      if (q.triggerEvent === "first_chat" && (chatCount || 0) >= 1) {
        setActiveQuestion(q);
        return;
      }
    }
  };

  const submit = async () => {
    if (!user || !activeQuestion) return;
    setSubmitting(true);
    await supabase.from("mvp_question_responses").upsert({
      user_id: user.id,
      question_key: activeQuestion.key,
      response_rating: rating || null,
      response_text: text.trim() || null,
    });
    setActiveQuestion(null);
    setRating(0);
    setText("");
    setSubmitting(false);
  };

  const dismiss = () => {
    // Just hide for now, will show again next session
    setActiveQuestion(null);
  };

  if (!activeQuestion) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="mb-6 p-5 rounded-xl bg-primary/5 border border-primary/20 space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <MessageCircleQuestion size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">{activeQuestion.question}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Deine Meinung hilft uns, Huufi besser zu machen</p>
            </div>
          </div>
          <button onClick={dismiss} className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Star rating */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              className="p-1 transition-colors"
            >
              <Star
                size={22}
                className={n <= rating ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground/30"}
              />
            </button>
          ))}
        </div>

        {/* Optional text */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Optional: Erzähl uns mehr…"
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />

        <div className="flex gap-2">
          <button onClick={dismiss} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-secondary transition-colors">
            Später
          </button>
          <button
            onClick={submit}
            disabled={rating === 0 || submitting}
            className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Absenden
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
