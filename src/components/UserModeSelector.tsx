import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Heart, Briefcase, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const modes = [
  {
    value: "personal",
    label: "Persönlich",
    description: "Für private Pferdebesitzer",
    icon: User,
  },
  {
    value: "horse",
    label: "Pferd",
    description: "Fokus auf Pferdepflege & Gesundheit",
    icon: Heart,
  },
  {
    value: "business",
    label: "Business",
    description: "Für Hufpfleger, Tierärzte & Trainer",
    icon: Briefcase,
  },
];

export default function UserModeSelector() {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("user_type")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.user_type) setCurrentMode(data.user_type);
      });
  }, [user]);

  const selectMode = async (mode: string) => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ user_type: mode })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Fehler beim Speichern");
    } else {
      setCurrentMode(mode);
      toast.success(`Modus "${modes.find((m) => m.value === mode)?.label}" aktiviert`);
    }
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <User size={18} className="text-primary" />
        <h3 className="font-semibold text-foreground">Nutzungsmodus</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Wähle, wie du die App nutzen möchtest. Du kannst den Modus jederzeit ändern.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const isActive = currentMode === mode.value;
          return (
            <motion.button
              key={mode.value}
              whileTap={{ scale: 0.97 }}
              onClick={() => selectMode(mode.value)}
              disabled={saving}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                isActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 bg-card"
              } disabled:opacity-50`}
            >
              {isActive && (
                <div className="absolute top-2 right-2">
                  <Check size={14} className="text-primary" />
                </div>
              )}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isActive ? "bg-primary/10" : "bg-secondary"
                }`}
              >
                <mode.icon
                  size={20}
                  className={isActive ? "text-primary" : "text-muted-foreground"}
                />
              </div>
              <p className="text-sm font-medium text-foreground">{mode.label}</p>
              <p className="text-xs text-muted-foreground">{mode.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
