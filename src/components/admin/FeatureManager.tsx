import { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical, Eye, EyeOff, Pencil, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function FeatureManager() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", icon: "Sparkles", badge: "" });
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("app_features").select("*").order("sort_order");
    setFeatures((data || []) as Feature[]);
  };

  const save = async () => {
    if (!form.title.trim()) return;
    const { error } = await supabase.from("app_features").insert({
      title: form.title,
      description: form.description,
      icon: form.icon,
      badge: form.badge || null,
      sort_order: features.length + 1,
    });
    if (error) { toast.error("Fehler"); return; }
    toast.success("Feature hinzugefügt");
    setAdding(false);
    setForm({ title: "", description: "", icon: "Sparkles", badge: "" });
    load();
  };

  const update = async (id: string) => {
    const { error } = await supabase.from("app_features").update({
      title: form.title,
      description: form.description,
      icon: form.icon,
      badge: form.badge || null,
    }).eq("id", id);
    if (error) { toast.error("Fehler"); return; }
    toast.success("Aktualisiert");
    setEditing(null);
    load();
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("app_features").update({ is_active: !current }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("app_features").delete().eq("id", id);
    toast.success("Gelöscht");
    load();
  };

  const startEdit = (f: Feature) => {
    setEditing(f.id);
    setForm({ title: f.title, description: f.description, icon: f.icon, badge: f.badge || "" });
  };

  const iconOptions = ["Heart", "MessageCircle", "Calendar", "Mic", "Link2", "CloudSun", "FolderLock", "QrCode", "Shield", "Sparkles", "Star", "Zap", "Bell"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">Feature-Verwaltung ({features.length})</h3>
        <button onClick={() => setAdding(!adding)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          <Plus size={14} /> Hinzufügen
        </button>
      </div>

      {adding && (
        <div className="p-4 rounded-xl bg-secondary/10 border border-border space-y-3">
          <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Titel"
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Beschreibung" rows={2}
            className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <div className="flex gap-2">
            <select value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm">
              {iconOptions.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="Badge (optional)"
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium"><Save size={12} className="inline mr-1" />Speichern</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-xs">Abbrechen</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {features.map(f => (
          <div key={f.id} className={`flex items-center gap-3 p-3 rounded-xl border ${f.is_active ? "bg-card border-border" : "bg-secondary/10 border-border/50 opacity-60"}`}>
            {editing === f.id ? (
              <div className="flex-1 space-y-2">
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-sm" />
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-input text-foreground text-sm resize-none" />
                <div className="flex gap-2">
                  <button onClick={() => update(f.id)} className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs"><Save size={12} /></button>
                  <button onClick={() => setEditing(null)} className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs"><X size={12} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{f.title}</p>
                    {f.badge && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground">{f.badge}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{f.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(f)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"><Pencil size={14} /></button>
                  <button onClick={() => toggleActive(f.id, f.is_active)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                    {f.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button onClick={() => remove(f.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
