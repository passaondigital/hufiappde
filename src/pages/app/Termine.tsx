import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, X } from "lucide-react";

interface Appointment {
  id: string;
  horse: string;
  type: string;
  date: string;
  time: string;
  notes: string;
}

const initialAppointments: Appointment[] = [
  { id: "1", horse: "Luna", type: "Hufbearbeitung", date: "2026-02-13", time: "10:00", notes: "Hufpfleger Herr Müller" },
  { id: "2", horse: "Nero", type: "Tierarzt", date: "2026-02-18", time: "14:30", notes: "Jährliche Impfung + Zahnkontrolle" },
  { id: "3", horse: "Stella", type: "Tierarzt", date: "2026-03-05", time: "09:00", notes: "Arthrose-Kontrolle" },
  { id: "4", horse: "Luna", type: "Osteopath", date: "2026-02-25", time: "11:00", notes: "Rückenprobleme überprüfen" },
];

const typeColors: Record<string, string> = {
  Hufbearbeitung: "bg-primary",
  Tierarzt: "bg-accent",
  Osteopath: "bg-muted-foreground",
};

export default function Termine() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ horse: "", type: "", date: "", time: "", notes: "" });

  const sorted = [...appointments].sort((a, b) => a.date.localeCompare(b.date));

  const handleAdd = () => {
    if (!form.horse || !form.type || !form.date) return;
    setAppointments([...appointments, { id: Date.now().toString(), ...form }]);
    setForm({ horse: "", type: "", date: "", time: "", notes: "" });
    setShowForm(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Termine</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Termin anlegen
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Neuer Termin</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Pferd *" value={form.horse} onChange={(e) => setForm({ ...form, horse: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Typ wählen *</option>
              <option>Hufbearbeitung</option>
              <option>Tierarzt</option>
              <option>Osteopath</option>
              <option>Sonstiges</option>
            </select>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <input placeholder="Notizen" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
        </motion.div>
      )}

      <div className="space-y-3">
        {sorted.map((apt, i) => (
          <motion.div
            key={apt.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className={`w-1.5 h-12 rounded-full ${typeColors[apt.type] || "bg-muted-foreground"}`} />
            <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-xs font-bold text-foreground mt-0.5">
                {new Date(apt.date).getDate()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{apt.type}</p>
              <p className="text-xs text-muted-foreground">{apt.horse} · {formatDate(apt.date)}{apt.time ? ` · ${apt.time}` : ""}</p>
              {apt.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{apt.notes}</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
