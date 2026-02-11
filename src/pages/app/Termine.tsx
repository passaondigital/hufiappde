import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, X, ChevronLeft, ChevronRight, Download, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { generateICS, downloadICS } from "@/utils/calendarExport";

interface Appointment {
  id: string;
  horse_id: string | null;
  type: string;
  date: string;
  time: string | null;
  notes: string | null;
  horses?: { name: string } | null;
}

interface Horse { id: string; name: string; }

export default function Termine() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ horse_id: "", type: "", date: "", time: "", notes: "" });
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase.from("appointments").select("*, horses(name)").eq("user_id", user.id).order("date");
    setAppointments((data || []) as Appointment[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchAppointments();
    supabase.from("horses").select("id, name").eq("user_id", user.id).then(({ data }) => setHorses(data || []));
  }, [user]);

  const handleAdd = async () => {
    if (!form.type || !form.date || !user) return;
    const { error } = await supabase.from("appointments").insert({
      user_id: user.id,
      horse_id: form.horse_id || null,
      type: form.type,
      date: form.date,
      time: form.time || null,
      notes: form.notes || null,
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Termin angelegt");
    setForm({ horse_id: "", type: "", date: "", time: "", notes: "" });
    setShowForm(false);
    fetchAppointments();
  };

  const exportToCalendar = (apt: Appointment) => {
    const ics = generateICS({
      type: apt.type,
      date: apt.date,
      time: apt.time,
      notes: apt.notes,
      horseName: apt.horses?.name,
    });
    downloadICS(ics, `huufi-${apt.type}-${apt.date}.ics`);
    toast.success("Termin als .ics exportiert – öffne die Datei, um ihn deinem Kalender hinzuzufügen");
  };

  const exportAllToCalendar = () => {
    appointments.forEach((apt) => {
      const ics = generateICS({
        type: apt.type,
        date: apt.date,
        time: apt.time,
        notes: apt.notes,
        horseName: apt.horses?.name,
      });
      downloadICS(ics, `huufi-${apt.type}-${apt.date}.ics`);
    });
    toast.success(`${appointments.length} Termine exportiert`);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" });

  const typeColors: Record<string, string> = { Hufbearbeitung: "bg-primary", Tierarzt: "bg-accent", Osteopath: "bg-muted-foreground" };

  // Calendar helpers
  const daysInMonth = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday start
    const days: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    return days;
  }, [viewMonth]);

  const getAptsForDay = (day: number) => {
    const dateStr = `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return appointments.filter(a => a.date === dateStr);
  };

  const monthName = viewMonth.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const today = new Date();
  const isToday = (day: number) => today.getDate() === day && today.getMonth() === viewMonth.getMonth() && today.getFullYear() === viewMonth.getFullYear();

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-foreground">Deine Termine</h2>
        <div className="flex gap-2 flex-wrap">
          {appointments.length > 0 && (
            <button onClick={exportAllToCalendar} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
              <CalendarPlus size={16} /> Alle exportieren
            </button>
          )}
          <div className="flex bg-secondary/30 rounded-lg p-0.5">
            <button onClick={() => setViewMode("calendar")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Kalender
            </button>
            <button onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Liste
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Termin
          </button>
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Neuer Termin</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.horse_id} onChange={(e) => setForm({ ...form, horse_id: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Pferd zuordnen</option>
              {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
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

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <div className="rounded-xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1))}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronLeft size={18} />
            </button>
            <h3 className="font-semibold text-foreground capitalize">{monthName}</h3>
            <button onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1))}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
              <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
            ))}
            {daysInMonth.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dayApts = getAptsForDay(day);
              return (
                <button key={i}
                  onClick={() => { setForm({ ...form, date: `${viewMonth.getFullYear()}-${String(viewMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` }); setShowForm(true); }}
                  className={`relative p-1.5 sm:p-2 min-h-[3rem] sm:min-h-[4rem] rounded-lg text-left transition-colors hover:bg-secondary/50 ${isToday(day) ? "bg-primary/10 border border-primary/30" : ""}`}>
                  <span className={`text-xs font-medium ${isToday(day) ? "text-primary" : "text-foreground"}`}>{day}</span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayApts.slice(0, 2).map(a => (
                      <div key={a.id} className={`h-1.5 rounded-full ${typeColors[a.type] || "bg-muted-foreground"}`} title={`${a.type} – ${a.horses?.name || ""}`} />
                    ))}
                    {dayApts.length > 2 && <span className="text-[8px] text-muted-foreground">+{dayApts.length - 2}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          <div className="space-y-3">
            {appointments.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
              >
                <div className={`w-1.5 h-12 rounded-full ${typeColors[apt.type] || "bg-muted-foreground"}`} />
                <div className="w-12 h-12 rounded-lg bg-secondary flex flex-col items-center justify-center">
                  <Calendar size={14} className="text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground mt-0.5">{new Date(apt.date).getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{apt.type}</p>
                  <p className="text-xs text-muted-foreground">{apt.horses?.name || "–"} · {formatDate(apt.date)}{apt.time ? ` · ${apt.time.slice(0, 5)}` : ""}</p>
                  {apt.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{apt.notes}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); exportToCalendar(apt); }}
                  className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Zum Kalender hinzufügen">
                  <Download size={16} />
                </button>
              </motion.div>
            ))}
          </div>
          {appointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar size={40} className="text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">Noch keine Termine angelegt.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
