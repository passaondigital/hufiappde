import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, FileText, Calendar, FolderLock, Sparkles, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const steps = [
  { icon: Sparkles, title: "Willkommen bei HuufiApp!", text: "Schön, dass du da bist! In wenigen Schritten zeige ich dir, wie du das Beste aus deiner App herausholst.", color: "text-primary" },
  { icon: Heart, title: "Deine Pferde verwalten", text: "Lege deine Pferde an – mit Foto, Rasse und Gesundheitsnotizen. So hast du alles im Blick.", color: "text-primary" },
  { icon: FileText, title: "Notizen & Sprachnotizen", text: "Halte Beobachtungen fest – per Text oder Sprachaufnahme. Die KI kategorisiert automatisch.", color: "text-primary" },
  { icon: Calendar, title: "Termine im Überblick", text: "Verwalte Hufbearbeitungs-, Tierarzt- und Osteopath-Termine an einem Ort.", color: "text-primary" },
  { icon: MessageCircle, title: "Dein KI-Assistent", text: "Frag deinen persönlichen Assistenten alles rund ums Pferd – oder nutze die Sprachsteuerung.", color: "text-primary" },
  { icon: FolderLock, title: "Dokumenten-Tresor", text: "Speichere sensible Dokumente wie Impfpässe und Equidenpässe sicher hinter deinem Passwort.", color: "text-primary" },
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data && !data.onboarding_completed) setShow(true);
    });
  }, [user]);

  const finish = async () => {
    setShow(false);
    if (user) {
      await supabase.from("profiles").update({ onboarding_completed: true }).eq("user_id", user.id);
    }
  };

  if (!show) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
        <motion.div key={step} initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: "spring", damping: 25 }}
          className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex justify-between items-start mb-6">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all ${i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-secondary"}`} />
              ))}
            </div>
            <button onClick={finish} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <current.icon size={28} className={current.color} />
            </div>
            <h3 className="text-xl font-bold text-foreground">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.text}</p>
          </div>

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                Zurück
              </button>
            )}
            <button onClick={isLast ? finish : () => setStep(step + 1)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              {isLast ? "Los geht's!" : "Weiter"} {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
