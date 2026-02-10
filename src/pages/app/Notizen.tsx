import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Mic, Search, X } from "lucide-react";

interface Note {
  id: string;
  horse: string;
  title: string;
  content: string;
  type: "text" | "voice";
  date: string;
}

const initialNotes: Note[] = [
  { id: "1", horse: "Luna", title: "Hufzustand kontrolliert", content: "Linker Vorderhuf leicht ausgebrochen. Hufpfleger informiert, nächster Termin vorgezogen auf Freitag.", type: "text", date: "10. Feb 2026" },
  { id: "2", horse: "Nero", title: "Sprachnotiz – Reiteinheit", content: "Nero war heute sehr motiviert, hat gut auf Schenkelruf reagiert. Leichte Steifheit im rechten Hinterbein beim Antraben bemerkt.", type: "voice", date: "9. Feb 2026" },
  { id: "3", horse: "Stella", title: "Tierarzt-Feedback", content: "Arthrose stabil. Weiterhin MSM und Teufelskralle geben. Nächste Kontrolle in 3 Monaten.", type: "text", date: "7. Feb 2026" },
  { id: "4", horse: "Luna", title: "Sprachnotiz – Fütterung", content: "Luna frisst seit 2 Tagen weniger Heu. Evtl. Zahnproblem? Zahnarzt-Termin ausmachen.", type: "voice", date: "5. Feb 2026" },
];

export default function Notizen() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ horse: "", title: "", content: "" });

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.horse.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!form.title || !form.content) return;
    setNotes([
      { id: Date.now().toString(), horse: form.horse || "Allgemein", title: form.title, content: form.content, type: "text", date: "Heute" },
      ...notes,
    ]);
    setForm({ horse: "", title: "", content: "" });
    setShowForm(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Notizen</h2>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">
            <Mic size={16} /> Sprachnotiz
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Neu
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Notizen durchsuchen..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden"
        >
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Neue Notiz</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Pferd" value={form.horse} onChange={(e) => setForm({ ...form, horse: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              <input placeholder="Titel *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <textarea placeholder="Inhalt *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
          </div>
        </motion.div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {filtered.map((note, i) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {note.type === "voice" ? (
                  <Mic size={14} className="text-primary" />
                ) : (
                  <FileText size={14} className="text-muted-foreground" />
                )}
                <h4 className="font-medium text-foreground text-sm">{note.title}</h4>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{note.date}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
            <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
              {note.horse}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
