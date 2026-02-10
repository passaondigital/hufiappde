import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Heart, X, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";

interface Horse {
  id: string;
  name: string;
  age: number | null;
  breed: string | null;
  use_type: string | null;
  notes: string | null;
  image_url: string | null;
}

export default function Pferde() {
  const { user } = useAuth();
  const [horses, setHorses] = useState<Horse[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Horse | null>(null);
  const [form, setForm] = useState({ name: "", age: "", breed: "", use_type: "", notes: "", image_url: "" });
  const [loading, setLoading] = useState(true);

  const fetchHorses = async () => {
    if (!user) return;
    const { data } = await supabase.from("horses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setHorses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchHorses(); }, [user]);

  const handleAdd = async () => {
    if (!form.name || !user) return;
    const { error } = await supabase.from("horses").insert({
      user_id: user.id,
      name: form.name,
      age: form.age ? parseInt(form.age) : null,
      breed: form.breed || null,
      use_type: form.use_type || null,
      notes: form.notes || null,
      image_url: form.image_url || null,
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Pferd angelegt");
    setForm({ name: "", age: "", breed: "", use_type: "", notes: "", image_url: "" });
    setShowForm(false);
    fetchHorses();
  };

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Meine Pferde</h2>
          <p className="text-muted-foreground mt-1 text-sm">{horses.length} Pferde registriert</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Pferd anlegen
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 sm:p-6 rounded-xl bg-card border border-border space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Neues Pferd anlegen</h3>
                <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <ImageUpload
                currentUrl={form.image_url || null}
                onUpload={(url) => setForm({ ...form, image_url: url })}
                folder="horses"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input placeholder="Alter" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input placeholder="Rasse" value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <input placeholder="Nutzung" value={form.use_type} onChange={(e) => setForm({ ...form, use_type: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <textarea placeholder="Besonderheiten / Gesundheitsnotizen" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
              <button onClick={handleAdd} className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {horses.map((horse, i) => (
          <motion.button key={horse.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => setSelected(selected?.id === horse.id ? null : horse)}
            className={`text-left rounded-xl border transition-colors overflow-hidden ${selected?.id === horse.id ? "bg-primary/5 border-primary/30" : "bg-card border-border hover:border-primary/20"}`}
          >
            {horse.image_url && (
              <div className="w-full h-32 sm:h-36 overflow-hidden">
                <img src={horse.image_url} alt={horse.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3 mb-2">
                {!horse.image_url && (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Heart size={18} className="text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{horse.name}</p>
                  <p className="text-xs text-muted-foreground">{horse.breed || "–"} · {horse.age ? `${horse.age} Jahre` : "–"}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{horse.use_type || "–"}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="p-5 sm:p-6 rounded-xl bg-card border border-border space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            {selected.image_url && (
              <img src={selected.image_url} alt={selected.name} className="w-full h-48 sm:h-64 object-cover rounded-xl" />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted-foreground">Rasse</p><p className="font-medium text-foreground">{selected.breed || "–"}</p></div>
              <div><p className="text-muted-foreground">Alter</p><p className="font-medium text-foreground">{selected.age ? `${selected.age} Jahre` : "–"}</p></div>
              <div><p className="text-muted-foreground">Nutzung</p><p className="font-medium text-foreground">{selected.use_type || "–"}</p></div>
            </div>
            {selected.notes && <div><p className="text-sm text-muted-foreground mb-1">Besonderheiten</p><p className="text-sm text-foreground">{selected.notes}</p></div>}
          </motion.div>
        )}
      </AnimatePresence>

      {horses.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Heart size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Pferde angelegt.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary hover:underline">Erstes Pferd anlegen</button>
        </div>
      )}
    </div>
  );
}
