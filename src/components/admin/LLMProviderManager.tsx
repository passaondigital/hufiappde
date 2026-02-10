import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Bot, Trash2, Check, X, ToggleLeft, ToggleRight, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LLMProvider {
  id: string;
  name: string;
  provider: string;
  api_key_secret_name: string;
  model_name: string;
  is_active: boolean;
  cost_per_1m_input: number;
  cost_per_1m_output: number;
}

const PROVIDER_PRESETS = [
  { provider: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"], defaultCostIn: 2.50, defaultCostOut: 10.00 },
  { provider: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"], defaultCostIn: 3.00, defaultCostOut: 15.00 },
  { provider: "google", label: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro"], defaultCostIn: 0.10, defaultCostOut: 0.40 },
];

export default function LLMProviderManager() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", provider: "openai", api_key_secret_name: "", model_name: "",
    cost_per_1m_input: 0, cost_per_1m_output: 0,
  });

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    const { data } = await supabase.from("llm_providers").select("*").order("created_at");
    setProviders((data || []) as LLMProvider[]);
  };

  const addProvider = async () => {
    if (!form.name || !form.api_key_secret_name || !form.model_name) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }
    const { error } = await supabase.from("llm_providers").insert({
      name: form.name,
      provider: form.provider,
      api_key_secret_name: form.api_key_secret_name,
      model_name: form.model_name,
      cost_per_1m_input: form.cost_per_1m_input,
      cost_per_1m_output: form.cost_per_1m_output,
      is_active: false,
    });
    if (error) { toast.error("Fehler: " + error.message); return; }
    toast.success("LLM-Provider hinzugefügt");
    setForm({ name: "", provider: "openai", api_key_secret_name: "", model_name: "", cost_per_1m_input: 0, cost_per_1m_output: 0 });
    setShowForm(false);
    fetchProviders();
  };

  const toggleActive = async (p: LLMProvider) => {
    await supabase.from("llm_providers").update({ is_active: !p.is_active }).eq("id", p.id);
    fetchProviders();
  };

  const deleteProvider = async (id: string) => {
    await supabase.from("llm_providers").delete().eq("id", id);
    toast.success("Provider gelöscht");
    fetchProviders();
  };

  const selectedPreset = PROVIDER_PRESETS.find(p => p.provider === form.provider);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-primary" />
          <h3 className="font-semibold text-foreground text-sm">LLM-Provider Verwaltung</h3>
        </div>
        {providers.length < 3 && (
          <button onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            <Plus size={12} /> Provider
          </button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Konfiguriere bis zu 3 verschiedene Sprachmodell-APIs. Die API-Keys werden als Secrets gespeichert und sind nur in Backend-Funktionen verfügbar.
      </p>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl bg-secondary/20 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">Neuer Provider</h4>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Name (z.B. 'Haupt-GPT')" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            <select value={form.provider} onChange={(e) => {
              const preset = PROVIDER_PRESETS.find(p => p.provider === e.target.value);
              setForm({
                ...form, provider: e.target.value,
                model_name: preset?.models[0] || "",
                cost_per_1m_input: preset?.defaultCostIn || 0,
                cost_per_1m_output: preset?.defaultCostOut || 0,
              });
            }}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring">
              {PROVIDER_PRESETS.map(p => <option key={p.provider} value={p.provider}>{p.label}</option>)}
            </select>
            <select value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Modell wählen</option>
              {selectedPreset?.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <input placeholder="Secret-Name (z.B. OPENAI_API_KEY)" value={form.api_key_secret_name} onChange={(e) => setForm({ ...form, api_key_secret_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="number" step="0.01" placeholder="Kosten/1M Input ($)" value={form.cost_per_1m_input || ""} onChange={(e) => setForm({ ...form, cost_per_1m_input: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="number" step="0.01" placeholder="Kosten/1M Output ($)" value={form.cost_per_1m_output || ""} onChange={(e) => setForm({ ...form, cost_per_1m_output: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={addProvider}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            <Check size={12} /> Speichern
          </button>
        </motion.div>
      )}

      <div className="space-y-2">
        {providers.map((p) => (
          <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <button onClick={() => toggleActive(p)} className="flex-shrink-0">
              {p.is_active ? <ToggleRight size={20} className="text-primary" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.provider} · {p.model_name}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign size={10} />{p.cost_per_1m_input}/{p.cost_per_1m_output}</p>
              <p className="text-[10px] text-muted-foreground">$/1M In/Out</p>
            </div>
            <button onClick={() => deleteProvider(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {providers.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-4">Noch keine LLM-Provider konfiguriert.</p>
      )}
    </div>
  );
}
