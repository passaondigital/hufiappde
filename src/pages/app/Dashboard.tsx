import { useEffect, useState } from "react";
import { Calendar, Heart, FileText, MessageCircle, Plus, FolderLock, Users, Briefcase, Link2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingTour from "@/components/OnboardingTour";
import WeatherWidget from "@/components/WeatherWidget";
import MvpQuestionPrompt from "@/components/MvpQuestionPrompt";

type UserMode = "personal" | "horse" | "business" | null;

export default function Dashboard() {
  const { user } = useAuth();
  const [horsesCount, setHorsesCount] = useState(0);
  const [notesCount, setNotesCount] = useState(0);
  const [customersCount, setCustomersCount] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [userMode, setUserMode] = useState<UserMode>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [horses, notes, apts, recent, profile, customers, recentCust] = await Promise.all([
        supabase.from("horses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("appointments").select("*, horses(name)").eq("user_id", user.id).gte("date", new Date().toISOString().split("T")[0]).order("date").limit(3),
        supabase.from("notes").select("*, horses(name)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("display_name, user_type").eq("user_id", user.id).maybeSingle(),
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("customers").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      ]);
      setDisplayName(profile.data?.display_name || "");
      setUserMode((profile.data?.user_type as UserMode) || null);
      setHorsesCount(horses.count || 0);
      setNotesCount(notes.count || 0);
      setCustomersCount(customers.count || 0);
      setUpcomingAppointments(apts.data || []);
      setRecentNotes(recent.data || []);
      setRecentCustomers(recentCust.data || []);
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

  const modeSubtitle: Record<string, string> = {
    personal: "Dein persönlicher Überblick",
    horse: "Alles rund um deine Pferde",
    business: "Dein Business auf einen Blick",
  };

  // Mode-adaptive stats
  const getStats = () => {
    const base = [
      { label: "Pferde", value: horsesCount.toString(), icon: Heart, path: "/app/pferde" },
      { label: "Nächste Termine", value: upcomingAppointments.length.toString(), icon: Calendar, path: "/app/termine" },
      { label: "Notizen", value: notesCount.toString(), icon: FileText, path: "/app/notizen" },
    ];

    if (userMode === "business") {
      return [
        { label: "Kunden", value: customersCount.toString(), icon: Users, path: "/app/kunden" },
        ...base,
        { label: "Connect", value: "🔗", icon: Link2, path: "/app/connect" },
        { label: "Tresor", value: "🔒", icon: FolderLock, path: "/app/tresor" },
      ];
    }

    if (userMode === "horse") {
      return [
        ...base,
        { label: "Assistent", value: "KI", icon: MessageCircle, path: "/app/chat" },
        { label: "Tresor", value: "🔒", icon: FolderLock, path: "/app/tresor" },
      ];
    }

    // personal or default
    return [
      ...base,
      { label: "Tresor", value: "🔒", icon: FolderLock, path: "/app/tresor" },
      { label: "Assistent", value: "KI", icon: MessageCircle, path: "/app/chat" },
    ];
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });

  const modeIcon = userMode === "business" ? Briefcase : userMode === "horse" ? Heart : User;
  const ModeIcon = modeIcon;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <OnboardingTour />
      <MvpQuestionPrompt />

      {/* Header with mode badge */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-2xl font-bold text-foreground">
            {greeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h2>
          {userMode && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <ModeIcon size={12} />
              {userMode === "personal" ? "Persönlich" : userMode === "horse" ? "Pferd" : "Business"}
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1">
          {modeSubtitle[userMode || "personal"] || "Hier ist dein persönlicher Überblick."}
        </p>
      </div>

      <WeatherWidget />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {getStats().map((stat, i) => (
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

      {/* Business Mode: Customer overview first */}
      {userMode === "business" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Letzte Kunden</h3>
            <Link to="/app/kunden" className="text-sm text-primary hover:underline">Alle anzeigen</Link>
          </div>
          {recentCustomers.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-card border border-border">
              <Users size={32} className="text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Noch keine Kunden angelegt.</p>
              <Link to="/app/kunden" className="mt-2 inline-block text-sm text-primary hover:underline">Ersten Kunden anlegen</Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentCustomers.map((c: any, i: number) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link to="/app/kunden" className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{c.phone || "Keine Telefonnr."}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main content: Appointments + Notes/Horses */}
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
          <h3 className="text-lg font-semibold text-foreground">
            {userMode === "horse" ? "Letzte Pferde-Notizen" : "Letzte Notizen"}
          </h3>
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

      {/* Quick actions – mode-adaptive */}
      <div className="flex flex-wrap gap-3">
        {userMode === "business" && (
          <Link to="/app/kunden" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Kunde anlegen
          </Link>
        )}
        <Link to="/app/pferde" className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity ${userMode === "business" ? "bg-secondary text-secondary-foreground hover:bg-secondary/80" : "bg-primary text-primary-foreground"}`}>
          <Plus size={16} /> Pferd anlegen
        </Link>
        <Link to="/app/notizen" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
          <FileText size={16} /> Notiz erstellen
        </Link>
        <Link to="/app/chat" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
          <MessageCircle size={16} /> Assistent fragen
        </Link>
      </div>

      {/* Mode hint if not set */}
      {!userMode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Nutzungsmodus wählen</p>
            <p className="text-xs text-muted-foreground">Passe dein Dashboard an: Persönlich, Pferd oder Business.</p>
          </div>
          <Link to="/app/einstellungen" className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            Wählen
          </Link>
        </motion.div>
      )}
    </div>
  );
}
