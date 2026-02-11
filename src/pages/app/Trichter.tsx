import { useState, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Filter, AlertTriangle, Sparkles, FolderOpen, Plus, ExternalLink, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import VoiceAgent from "@/components/VoiceAgent";

interface Project {
  id: string;
  name: string;
  status: string;
  assets_list: any[];
  last_logic_update: string;
  created_at: string;
}

interface TrichterResult {
  classification: {
    type: string;
    project: string | null;
    asset: string | null;
    summary: string;
    duplicate: boolean;
  };
  results: Record<string, any>;
  duplicateWarning: string | null;
}

export default function Trichter() {
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastResult, setLastResult] = useState<TrichterResult | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("alle");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("projects_master")
      .select("*")
      .eq("user_id", user.id)
      .order("last_logic_update", { ascending: false });
    setProjects((data as any) || []);
  }, [user]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  const processInput = async (text: string, source: string = "text") => {
    if (!text.trim() || !user) return;
    setIsProcessing(true);
    setLastResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trichter-route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, source }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Verarbeitungsfehler");
      }

      const result: TrichterResult = await resp.json();
      setLastResult(result);

      if (result.duplicateWarning) {
        toast.warning(result.duplicateWarning, { duration: 6000 });
      } else {
        const typeLabels: Record<string, string> = {
          project: "📁 Projekt",
          knowledge: "🧠 Wissen",
          todo: "✅ To-Do",
          befund: "🩺 Befund",
        };
        toast.success(`${typeLabels[result.classification.type] || "✓"} erfolgreich verarbeitet`);
      }

      setInput("");
      loadProjects();
    } catch (e: any) {
      toast.error(e.message || "Fehler bei der Verarbeitung");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = () => processInput(input, "text");

  const handleSpeechInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Spracherkennung nicht unterstützt"); return; }
    if (isRecording) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + " " : "") + transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => { setIsRecording(false); toast.error("Spracherkennung fehlgeschlagen"); };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);
  };

  const typeColors: Record<string, string> = {
    project: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    knowledge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    todo: "bg-green-500/10 text-green-400 border-green-500/20",
    befund: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  const filteredProjects = filterStatus === "alle"
    ? projects
    : projects.filter(p => p.status === filterStatus);

  const sendToN8n = async (project: Project) => {
    toast.info("n8n-Webhook wird vorbereitet… Bitte konfiguriere die Webhook-URL in den Einstellungen.", { duration: 5000 });
    // Placeholder: will send to n8n when URL is configured
    console.log("n8n payload:", { project_id: project.id, name: project.name, assets: project.assets_list });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Filter size={24} className="text-primary" />
          Huufi Trichter
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Zentrale Eingabe für Text &amp; Voice – automatisches Routing in Projekte, Wissen &amp; mehr.
        </p>
      </div>

      {/* Input Section */}
      <div className="rounded-xl bg-card border border-border p-4 space-y-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Idee, Notiz, Befund oder Projektupdate eingeben…"
            rows={3}
            className="flex-1 px-4 py-3 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSpeechInput}
              className={`p-2.5 rounded-lg transition-all ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowVoice(true)}
            className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
          >
            <Mic size={12} /> ElevenLabs Voice
          </button>
          <span className="text-xs text-muted-foreground">oder tippe deinen Input ein</span>
        </div>
      </div>

      {/* Last Result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`rounded-xl border p-4 ${lastResult.duplicateWarning ? "border-yellow-500/30 bg-yellow-500/5" : "border-primary/20 bg-primary/5"}`}
          >
            {lastResult.duplicateWarning && (
              <div className="flex items-center gap-2 mb-3 text-yellow-400">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">{lastResult.duplicateWarning}</span>
              </div>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs px-2 py-1 rounded-full border ${typeColors[lastResult.classification.type] || "bg-muted text-muted-foreground"}`}>
                {lastResult.classification.type}
              </span>
              {lastResult.classification.project && (
                <span className="text-sm text-foreground font-medium">
                  → {lastResult.classification.project}
                </span>
              )}
              {lastResult.classification.asset && (
                <span className="text-xs text-muted-foreground">
                  ({lastResult.classification.asset})
                </span>
              )}
            </div>
            {lastResult.classification.summary && (
              <p className="text-sm text-muted-foreground mt-2">{lastResult.classification.summary}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Projects Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <FolderOpen size={18} className="text-primary" />
            Projekte ({filteredProjects.length})
          </h3>
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-secondary">
            {["alle", "aktiv", "archiviert"].map(s => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                  filterStatus === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 rounded-xl bg-card border border-border">
            <FolderOpen size={40} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {filterStatus === "alle" ? "Noch keine Projekte. Gib oben deinen ersten Input ein!" : `Keine ${filterStatus}en Projekte.`}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl bg-card border border-border hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => setSelectedProject(selectedProject?.id === project.id ? null : project)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{project.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {Array.isArray(project.assets_list) ? project.assets_list.length : 0} Assets ·
                        {" "}{new Date(project.last_logic_update).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      project.status === "aktiv" ? "bg-green-500/10 text-green-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Expanded: assets + actions */}
                  <AnimatePresence>
                    {selectedProject?.id === project.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                          {Array.isArray(project.assets_list) && project.assets_list.length > 0 ? (
                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                              {project.assets_list.map((asset: any, j: number) => (
                                <div key={j} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-background">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                  <span className="text-foreground truncate flex-1">
                                    {typeof asset === "string" ? asset : asset.name || asset.title || "Asset"}
                                  </span>
                                  <span className="text-muted-foreground flex-shrink-0">
                                    {asset.source || "–"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">Noch keine Assets</p>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); sendToN8n(project); }}
                            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                          >
                            <Sparkles size={14} />
                            Wissen veredeln
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Agent Modal */}
      <VoiceAgent isOpen={showVoice} onClose={() => setShowVoice(false)} />
    </div>
  );
}
