import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Heart, X } from "lucide-react";

interface Horse {
  id: string;
  name: string;
  age: number;
  breed: string;
  use: string;
  notes: string;
}

const initialHorses: Horse[] = [
  { id: "1", name: "Luna", age: 12, breed: "Warmblut", use: "Dressur", notes: "Empfindliche Hufe, regelmäßige Bearbeitung nötig" },
  { id: "2", name: "Nero", age: 8, breed: "Friese", use: "Freizeit", notes: "Allergisch auf bestimmte Insektenarten" },
  { id: "3", name: "Stella", age: 15, breed: "Haflinger", use: "Therapiepferd", notes: "Arthrose im rechten Vorderbein" },
];

export default function Pferde() {
  const [horses, setHorses] = useState<Horse[]>(initialHorses);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Horse | null>(null);
  const [form, setForm] = useState({ name: "", age: "", breed: "", use: "", notes: "" });

  const handleAdd = () => {
    if (!form.name) return;
    const newHorse: Horse = {
      id: Date.now().toString(),
      name: form.name,
      age: parseInt(form.age) || 0,
      breed: form.breed,
      use: form.use,
      notes: form.notes,
    };
    setHorses([...horses, newHorse]);
    setForm({ name: "", age: "", breed: "", use: "", notes: "" });
    setShowForm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meine Pferde</h2>
          <p className="text-muted-foreground mt-1">{horses.length} Pferde registriert</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Pferd anlegen
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Neues Pferd anlegen</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  placeholder="Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="Alter"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="Rasse"
                  value={form.breed}
                  onChange={(e) => setForm({ ...form, breed: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <input
                  placeholder="Nutzung (z.B. Dressur, Freizeit)"
                  value={form.use}
                  onChange={(e) => setForm({ ...form, use: e.target.value })}
                  className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <textarea
                placeholder="Besonderheiten / Gesundheitsnotizen"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
              <button
                onClick={handleAdd}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Speichern
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horse List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {horses.map((horse, i) => (
          <motion.button
            key={horse.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(selected?.id === horse.id ? null : horse)}
            className={`text-left p-5 rounded-xl border transition-colors ${
              selected?.id === horse.id
                ? "bg-primary/5 border-primary/30"
                : "bg-card border-border hover:border-primary/20"
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{horse.name}</p>
                <p className="text-xs text-muted-foreground">{horse.breed} · {horse.age} Jahre</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{horse.use}</p>
          </motion.button>
        ))}
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="p-6 rounded-xl bg-card border border-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <X size={18} />
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Rasse</p>
                <p className="font-medium text-foreground">{selected.breed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Alter</p>
                <p className="font-medium text-foreground">{selected.age} Jahre</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nutzung</p>
                <p className="font-medium text-foreground">{selected.use}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Besonderheiten</p>
              <p className="text-sm text-foreground">{selected.notes}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
