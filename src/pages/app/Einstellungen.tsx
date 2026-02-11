import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings, Mail, Lock, User, Check, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PushNotificationToggle } from "@/hooks/usePushNotifications";
import FeedbackSection from "@/components/FeedbackSection";
import UserModeSelector from "@/components/UserModeSelector";

export default function Einstellungen() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || "");
    supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setDisplayName(data.display_name || "");
    });
  }, [user]);

  const updateProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("user_id", user.id);
    if (error) toast.error("Fehler beim Speichern");
    else toast.success("Profil aktualisiert!");
    setSaving(false);
  };

  const updateEmail = async () => {
    if (!email || !user) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast.error(error.message);
    else toast.success("Bestätigungs-E-Mail gesendet! Bitte prüfe dein Postfach.");
    setSaving(false);
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Passwort muss mindestens 6 Zeichen lang sein"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwörter stimmen nicht überein"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Passwort geändert!"); setNewPassword(""); setConfirmPassword(""); }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={24} className="text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Einstellungen</h2>
      </div>
      {/* User Mode */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="p-5 rounded-xl bg-card border border-border">
        <UserModeSelector />
      </motion.div>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <User size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Profil</h3>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Anzeigename</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Dein Name"
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={updateProfile} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          <Check size={14} /> Speichern
        </button>
      </motion.div>

      {/* Email */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">E-Mail ändern</h3>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Neue E-Mail-Adresse</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={updateEmail} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          <Check size={14} /> E-Mail aktualisieren
        </button>
      </motion.div>

      {/* Password */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Lock size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Passwort ändern</h3>
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Neues Passwort</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mindestens 6 Zeichen"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Passwort bestätigen</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Passwort wiederholen"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </div>
        <button onClick={updatePassword} disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
          <Check size={14} /> Passwort ändern
        </button>
      </motion.div>

      {/* Push Notifications */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="p-5 rounded-xl bg-card border border-border space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground">Benachrichtigungen</h3>
        </div>
        <p className="text-xs text-muted-foreground">Erhalte Erinnerungen für anstehende Termine direkt auf dein Gerät.</p>
        <PushNotificationToggle />
      </motion.div>

      {/* Feedback Section */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-5 rounded-xl bg-card border border-border">
        <FeedbackSection />
      </motion.div>
    </div>
  );
}
