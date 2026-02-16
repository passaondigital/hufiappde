import { useEffect, useState } from "react";
import { Calendar, Heart, MessageCircle, Mic, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingTour from "@/components/OnboardingTour";
import MvpQuestionPrompt from "@/components/MvpQuestionPrompt";
import huufiLogo from "@/assets/huufi-logo.png";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [horsesCount, setHorsesCount] = useState(0);
  const [omniQuery, setOmniQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [profile, apts, horses] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("appointments").select("*, horses(name)").eq("user_id", user.id)
          .gte("date", new Date().toISOString().split("T")[0]).order("date").limit(3),
        supabase.from("horses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setDisplayName(profile.data?.display_name || "");
      setUpcomingAppointments(apts.data || []);
      setHorsesCount(horses.count || 0);
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

  const handleOmniSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (omniQuery.trim()) {
      navigate(`/app/chat?q=${encodeURIComponent(omniQuery.trim())}`);
      setOmniQuery("");
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short" });

  const minutesUntil = (dateStr: string, timeStr?: string | null) => {
    const now = new Date();
    const target = new Date(`${dateStr}T${timeStr || "12:00"}`);
    return Math.round((target.getTime() - now.getTime()) / 60000);
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-8 space-y-8">
      <OnboardingTour />
      <MvpQuestionPrompt />

      {/* Greeting – minimal */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-1"
      >
        <img src={huufiLogo} alt="" className="h-12 w-12 mx-auto rounded-2xl object-contain mb-3" />
        <h1 className="text-xl font-bold text-foreground">
          {greeting()}{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">Was steht heute an?</p>
      </motion.div>

      {/* Omnibox */}
      <motion.form
        onSubmit={handleOmniSubmit}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-card border border-border shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
          <Search size={20} className="text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={omniQuery}
            onChange={(e) => setOmniQuery(e.target.value)}
            placeholder="Wie kann ich dir heute helfen?"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="button"
            onClick={() => navigate("/app/chat")}
            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          >
            <Mic size={18} />
          </button>
        </div>
      </motion.form>

      {/* Smart Cards */}
      <div className="space-y-3">
        {/* Upcoming appointments as smart cards */}
        {upcomingAppointments.map((apt, i) => {
          const mins = minutesUntil(apt.date, apt.time);
          const isUrgent = mins > 0 && mins < 120;
          return (
            <motion.div
              key={apt.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Link
                to="/app/termine"
                className={`block p-4 rounded-2xl border transition-all ${
                  isUrgent
                    ? "bg-primary/5 border-primary/20 shadow-sm"
                    : "bg-card border-border hover:border-primary/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${isUrgent ? "bg-primary/10" : "bg-secondary"}`}>
                    <Calendar size={18} className={isUrgent ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {isUrgent
                        ? `In ${mins} Min: ${apt.type}`
                        : `${apt.type} – ${formatDate(apt.date)}`
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {apt.horses?.name || "Allgemein"}
                      {isUrgent && " · Soll ich die Akte öffnen?"}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {/* Horses summary card */}
        {horsesCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link
              to="/app/pferde"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all"
            >
              <div className="p-2 rounded-xl bg-secondary">
                <Heart size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{horsesCount} Pferd{horsesCount !== 1 ? "e" : ""} registriert</p>
                <p className="text-xs text-muted-foreground">Tippe um Details zu sehen</p>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Empty state */}
        {upcomingAppointments.length === 0 && horsesCount === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-12 space-y-4"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-secondary flex items-center justify-center">
              <MessageCircle size={24} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Alles ruhig heute</p>
              <p className="text-xs text-muted-foreground mt-1">Frag den Assistenten, was du als nächstes tun kannst.</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
