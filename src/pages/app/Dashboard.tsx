import { useEffect, useState } from "react";
import { Calendar, Heart, FileText, MessageCircle, Plus, FolderLock } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingTour from "@/components/OnboardingTour";

export default function Dashboard() {
  const { user } = useAuth();
  const [horsesCount, setHorsesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [horses, notes, apts, recent, profile] = await Promise.all([
        supabase.from("horses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("appointments").select("*, horses(name)").eq("user_id", user.id).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(3),
        supabase.from("notes").select("*, horses(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
      ]);
      setDisplayName(profile.data?.display_name || "");
      setHorsesCount(horses.count || 0);
      setNotesCount(notes.count || 0);
      setUpcomingAppointments(apts.data || []);
      setRecentNotes(recent.data || []);
    };
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Guten Morgen";
    if (h < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const firstName = displayName?.split(" ")[0] || "";

  const stats = [
    { label: "Pferde", value: horsesCount.toString(), icon: Heart, path: "/app/pferde" },
    { label: "Nächste Termine", value: upcomingAppointments.length.toString(), icon: Calendar, path: "/app/termine" },
    { label: "Notizen", value: notesCount.toString(), icon: FileText, path: "/app/notizen" },
    { label: "Tresor", value: "🔒", icon: FolderLock, path: "/app/tresor" },
    { label: "Assistent", value: "KI", icon: MessageCircle, path: "/app/chat" },
  ];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <OnboardingTour />
      <div>
        <h2 className="text-2xl font-bold text-foreground">{greeting()}{firstName ? `, ${firstName}` : ""} 👋</h2>
        <p className="text-muted-foreground mt-1">Hier ist dein persönlicher Überblick.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={stat.path} className="flex flex-col gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors">
              <stat.icon size={22} className="text-primary" />
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Nächste Termine</h3>
            <Link to="/app/termine" className="text-sm text-primary hover:underline">Alle</Link>
          </div>
          {upcomingAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 rounded-xl bg-card border border-border">Keine anstehenden Termine</p>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border">
                  <div className="w-2 h-10 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{apt.horses?.name || "–"}</p>
                    <p className="text-sm text-muted-foreground">{apt.type}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{formatDate(apt.date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Letzte Notizen</h3>
          {recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 rounded-xl bg-card border border-border">Noch keine Notizen</p>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.horses?.name || "Allgemein"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/app/pferde" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"><Plus size={16} /> Pferd anlegen</Link>
        <Link to="/app/notizen" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"><FileText size={16} /> Notiz erstellen</Link>
        <Link to="/app/chat" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"><MessageCircle size={16} /> Assistent fragen</Link>
      </div>
    </div>
  );
}
