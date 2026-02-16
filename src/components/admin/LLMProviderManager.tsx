import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Bot, Trash2, Check, X, ToggleLeft, ToggleRight, DollarSign, Globe, ArrowUp, ArrowDown, Pencil } from "lucide-react";
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
  api_endpoint: string;
  priority: number;
}

const PROVIDER_PRESETS = [
  { provider: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo", "gpt-5", "gpt-5-mini"], defaultCostIn: 2.50, defaultCostOut: 10.00, endpoint: "https://api.openai.com/v1/chat/completions" },
  { provider: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-opus-4-20250514"], defaultCostIn: 3.00, defaultCostOut: 15.00, endpoint: "https://api.anthropic.com/v1/messages" },
  { provider: "google", label: "Google Gemini", models: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash-preview"], defaultCostIn: 0.10, defaultCostOut: 0.40, endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" },
  { provider: "mistral", label: "Mistral AI", models: ["mistral-large-latest", "mistral-medium-latest", "codestral-latest"], defaultCostIn: 2.00, defaultCostOut: 6.00, endpoint: "https://api.mistral.ai/v1/chat/completions" },
  { provider: "openrouter", label: "OpenRouter", models: ["meta-llama/llama-3.1-405b", "meta-llama/llama-3.1-70b", "deepseek/deepseek-r1"], defaultCostIn: 0.50, defaultCostOut: 1.50, endpoint: "https://openrouter.ai/api/v1/chat/completions" },
  { provider: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"], defaultCostIn: 0.05, defaultCostOut: 0.10, endpoint: "https://api.groq.com/openai/v1/chat/completions" },
  { provider: "perplexity", label: "Perplexity", models: ["llama-3.1-sonar-large-128k-online"], defaultCostIn: 1.00, defaultCostOut: 1.00, endpoint: "https://api.perplexity.ai/chat/completions" },
  { provider: "custom", label: "Eigener Endpoint", models: [], defaultCostIn: 0, defaultCostOut: 0, endpoint: "" },
];

export default function LLMProviderManager() {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", provider: "openai", api_key_secret_name: "", model_name: "",
    cost_per_1m_input: 0, cost_per_1m_output: 0, api_endpoint: "https://api.openai.com/v1/chat/completions",
  });

  useEffect(() => { fetchProviders(); }, []);

  const fetchProviders = async () => {
    const { data } = await supabase.from("llm_providers").select("*").order("priority", { ascending: false });
    setProviders((data || []) as LLMProvider[]);
  };

  const resetForm = () => {
    setForm({ name: "", provider: "openai", api_key_secret_name: "", model_name: "", cost_per_1m_input: 0, cost_per_1m_output: 0, api_endpoint: "https://api.openai.com/v1/chat/completions" });
    setShowForm(false);
    setEditingId(null);
  };

  const saveProvider = async () => {
    if (!form.name || !form.api_key_secret_name || !form.model_name || !form.api_endpoint) {
      toast.error("Bitte alle Felder ausfüllen");
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("llm_providers").update({
        name: form.name, provider: form.provider, api_key_secret_name: form.api_key_secret_name,
        model_name: form.model_name, cost_per_1m_input: form.cost_per_1m_input,
        cost_per_1m_output: form.cost_per_1m_output, api_endpoint: form.api_endpoint,
      }).eq("id", editingId);
      if (error) { toast.error("Fehler: " + error.message); return; }
      toast.success("Provider aktualisiert");
    } else {
      const { error } = await supabase.from("llm_providers").insert({
        name: form.name, provider: form.provider, api_key_secret_name: form.api_key_secret_name,
        model_name: form.model_name, cost_per_1m_input: form.cost_per_1m_input,
        cost_per_1m_output: form.cost_per_1m_output, api_endpoint: form.api_endpoint,
        is_active: false, priority: providers.length,
      });
      if (error) { toast.error("Fehler: " + error.message); return; }
      toast.success("Provider hinzugefügt");
    }
    resetForm();
    fetchProviders();
  };

  const startEdit = (p: LLMProvider) => {
    setEditingId(p.id);
    setForm({
      name: p.name, provider: p.provider, api_key_secret_name: p.api_key_secret_name,
      model_name: p.model_name, cost_per_1m_input: p.cost_per_1m_input || 0,
      cost_per_1m_output: p.cost_per_1m_output || 0, api_endpoint: p.api_endpoint || "",
    });
    setShowForm(true);
  };

  const toggleActive = async (p: LLMProvider) => {
    await supabase.from("llm_providers").update({ is_active: !p.is_active }).eq("id", p.id);
    toast.success(p.is_active ? "Deaktiviert" : "Aktiviert");
    fetchProviders();
  };

  const changePriority = async (p: LLMProvider, direction: "up" | "down") => {
    const newPriority = direction === "up" ? p.priority + 1 : Math.max(0, p.priority - 1);
    await supabase.from("llm_providers").update({ priority: newPriority }).eq("id", p.id);
    fetchProviders();
  };

  const deleteProvider = async (id: string) => {
    await supabase.from("llm_providers").delete().eq("id", id);
    toast.success("Provider gelöscht");
    fetchProviders();
  };

  const selectedPreset = PROVIDER_PRESETS.find(p => p.provider === form.provider);
  const activeCount = providers.filter(p => p.is_active).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-primary" />
            <h3 className="font-semibold text-foreground text-sm">LLM-Provider Verwaltung</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {providers.length} Provider konfiguriert · {activeCount} aktiv
          </p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
          <Plus size={12} /> Provider
        </button>
      </div>

      <p className="text-xs text-muted-foreground bg-secondary/20 p-3 rounded-lg">
        💡 Füge beliebig viele LLM-APIs hinzu (OpenAI, Anthropic, Mistral, Groq, OpenRouter oder eigene Endpoints). 
        Der Provider mit der höchsten Priorität und Status "aktiv" wird vom Chat verwendet.
        API-Keys werden sicher als Backend-Secrets gespeichert.
      </p>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-secondary/20 border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-foreground">{editingId ? "Provider bearbeiten" : "Neuer Provider"}</h4>
            <button onClick={resetForm} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
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
                api_endpoint: preset?.endpoint || "",
              });
            }}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring">
              {PROVIDER_PRESETS.map(p => <option key={p.provider} value={p.provider}>{p.label}</option>)}
            </select>
            {selectedPreset && selectedPreset.models.length > 0 ? (
              <select value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Modell wählen</option>
                {selectedPreset.models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            ) : (
              <input placeholder="Modell-Name (z.B. 'my-model-v1')" value={form.model_name} onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            )}
            <input placeholder="Secret-Name (z.B. OPENAI_API_KEY)" value={form.api_key_secret_name} onChange={(e) => setForm({ ...form, api_key_secret_name: e.target.value })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-1">
                <Globe size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">API-Endpoint URL</span>
              </div>
              <input placeholder="https://api.example.com/v1/chat/completions" value={form.api_endpoint} onChange={(e) => setForm({ ...form, api_endpoint: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <input type="number" step="0.01" placeholder="Kosten/1M Input ($)" value={form.cost_per_1m_input || ""} onChange={(e) => setForm({ ...form, cost_per_1m_input: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
            <input type="number" step="0.01" placeholder="Kosten/1M Output ($)" value={form.cost_per_1m_output || ""} onChange={(e) => setForm({ ...form, cost_per_1m_output: parseFloat(e.target.value) || 0 })}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button onClick={saveProvider}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity">
            <Check size={12} /> {editingId ? "Aktualisieren" : "Speichern"}
          </button>
        </motion.div>
      )}

      <div className="space-y-2">
        {providers.map((p) => (
          <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${p.is_active ? "bg-card border-primary/20" : "bg-card border-border opacity-60"}`}>
            <button onClick={() => toggleActive(p)} className="flex-shrink-0" title={p.is_active ? "Deaktivieren" : "Aktivieren"}>
              {p.is_active ? <ToggleRight size={20} className="text-primary" /> : <ToggleLeft size={20} className="text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                {p.is_active && providers.filter(x => x.is_active).indexOf(p) === 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-primary text-primary-foreground">Primär</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{p.provider} · {p.model_name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{p.api_endpoint}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign size={10} />{p.cost_per_1m_input}/{p.cost_per_1m_output}</p>
              <p className="text-[10px] text-muted-foreground">$/1M In/Out</p>
            </div>
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => changePriority(p, "up")} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Priorität erhöhen">
                <ArrowUp size={12} />
              </button>
              <button onClick={() => changePriority(p, "down")} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Priorität senken">
                <ArrowDown size={12} />
              </button>
            </div>
            <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Bearbeiten">
              <Pencil size={14} />
            </button>
            <button onClick={() => deleteProvider(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Löschen">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {providers.length === 0 && !showForm && (
        <div className="text-center py-8 space-y-2">
          <Bot size={32} className="mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Noch keine LLM-Provider konfiguriert.</p>
          <p className="text-xs text-muted-foreground">Füge deinen ersten Provider hinzu, um den KI-Chat zu aktivieren.</p>
        </div>
      )}
    </div>
  );
}
