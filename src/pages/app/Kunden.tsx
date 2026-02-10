import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Users, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
}

export default function Kunden() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    if (!user) return;
    const { data } = await supabase.from("customers").select("*").eq("user_id", user.id).order("name");
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, [user]);

  const handleAdd = async () => {
    if (!form.name || !user) return;
    const { error } = await supabase.from("customers").insert({
      user_id: user.id,
      name: form.name,
      phone: form.phone || null,
      notes: form.notes || null,
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Kunde angelegt");
    setForm({ name: "", phone: "", notes: "" });
    setShowForm(false);
    fetchCustomers();
  };

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Kunden</h2>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Kunde anlegen
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Neuer Kunde</h3>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <input placeholder="Telefon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <textarea placeholder="Notizen" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
        </motion.div>
      )}

      <div className="space-y-3">
        {customers.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">{c.name}</p>
              {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
              {c.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{c.notes}</p>}
            </div>
            <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
          </motion.div>
        ))}
      </div>

      {customers.length === 0 && (
        <div className="text-center py-12">
          <Users size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Kunden angelegt.</p>
        </div>
      )}
    </div>
  );
}
