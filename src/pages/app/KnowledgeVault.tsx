import { useState, useEffect } from "react";
import { Search, Mic, MessageCircle, Brain, Lightbulb, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type KnowledgeEntry = {
  id: string;
  content: string;
  category: string;
  source: string;
  metadata: any;
  created_at: string;
};

const categoryConfig: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  transcript: { label: "Transkript", icon: Mic, color: "bg-blue-500/10 text-blue-600" },
  chat: { label: "Chat", icon: MessageCircle, color: "bg-primary/10 text-primary" },
  wissen: { label: "Wissen", icon: Brain, color: "bg-purple-500/10 text-purple-600" },
  idee: { label: "Idee", icon: Lightbulb, color: "bg-yellow-500/10 text-yellow-700" },
  todo: { label: "To-Do", icon: CheckSquare, color: "bg-green-500/10 text-green-600" },
  befund: { label: "Huf-Befund", icon: Brain, color: "bg-red-500/10 text-red-600" },
};

const sourceLabels: Record<string, string> = {
  voice: "🎙️ Voice",
  text: "💬 Text",
  manual: "✍️ Manuell",
};

export default function KnowledgeVault() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      let query = supabase
        .from("knowledge_vault")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filterCategory) query = query.eq("category", filterCategory);
      if (filterSource) query = query.eq("source", filterSource);

      const { data } = await query;
      setEntries(data || []);
      setLoading(false);
    };
    load();
  }, [user, filterCategory, filterSource]);

  const filtered = entries.filter((e) =>
    !search || e.content.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Knowledge Vault</h2>
        <p className="text-sm text-muted-foreground">Alle Einträge aus Voice & Text – dein gesammeltes Wissen.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suche im Wissen…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-card border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-card border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle Kategorien</option>
            {Object.entries(categoryConfig).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2.5 rounded-lg bg-card border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Alle Quellen</option>
            <option value="voice">Voice</option>
            <option value="text">Text</option>
            <option value="manual">Manuell</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>{filtered.length} Einträge</span>
        <span>·</span>
        <span>{entries.filter(e => e.source === "voice").length} Voice</span>
        <span>·</span>
        <span>{entries.filter(e => e.source === "text").length} Text</span>
      </div>

      {/* Entries */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Laden…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Brain size={40} className="text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {search ? "Keine Ergebnisse gefunden." : "Noch keine Einträge. Starte einen Voice- oder Text-Chat!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => {
            const cat = categoryConfig[entry.category] || categoryConfig.wissen;
            const CatIcon = cat.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                    <CatIcon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">{entry.content}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      <span className="text-xs text-muted-foreground">{sourceLabels[entry.source] || entry.source}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
