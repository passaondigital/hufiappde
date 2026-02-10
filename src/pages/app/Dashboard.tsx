import { Calendar, Heart, FileText, MessageCircle, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const stats = [
  { label: "Pferde", value: "3", icon: Heart, path: "/app/pferde" },
  { label: "Termine diese Woche", value: "2", icon: Calendar, path: "/app/termine" },
  { label: "Notizen", value: "12", icon: FileText, path: "/app/notizen" },
  { label: "Nachrichten", value: "5", icon: MessageCircle, path: "/app/chat" },
];

const recentActivity = [
  { text: "Hufbearbeitung für Luna – nächster Termin in 3 Tagen", time: "Heute" },
  { text: "Gesundheitsnotiz für Stella hinzugefügt", time: "Gestern" },
  { text: "Tierarzttermin für Nero bestätigt", time: "vor 2 Tagen" },
  { text: "Sprachnotiz transkribiert und Luna zugeordnet", time: "vor 3 Tagen" },
];

const upcomingAppointments = [
  { horse: "Luna", type: "Hufbearbeitung", date: "13. Feb 2026", color: "bg-primary" },
  { horse: "Nero", type: "Tierarzt (Impfung)", date: "18. Feb 2026", color: "bg-accent" },
];

export default function Dashboard() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Guten Morgen 👋</h2>
        <p className="text-muted-foreground mt-1">Hier ist dein Überblick für heute.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              to={stat.path}
              className="flex flex-col gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group"
            >
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
        {/* Upcoming */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Nächste Termine</h3>
            <Link to="/app/termine" className="text-sm text-primary hover:underline">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <div
                key={apt.horse + apt.type}
                className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
              >
                <div className={`w-2 h-10 rounded-full ${apt.color}`} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{apt.horse}</p>
                  <p className="text-sm text-muted-foreground">{apt.type}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">{apt.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Letzte Aktivitäten</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link
          to="/app/pferde"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Pferd anlegen
        </Link>
        <Link
          to="/app/notizen"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <FileText size={16} /> Notiz erstellen
        </Link>
        <Link
          to="/app/chat"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
        >
          <MessageCircle size={16} /> Assistent fragen
        </Link>
      </div>
    </div>
  );
}
