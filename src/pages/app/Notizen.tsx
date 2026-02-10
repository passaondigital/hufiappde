import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Mic, MicOff, Search, X, Filter, SortAsc } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Note {
  id: string;
  horse_id: string | null;
  title: string;
  content: string;
  type: string;
  category: string | null;
  created_at: string;
  horses?: { name: string } | null;
}

interface Horse {
  id: string;
  name: string;
}

const CATEGORIES = [
  { value: "allgemein", label: "Allgemein" },
  { value: "gesundheit", label: "Gesundheit" },
  { value: "futter", label: "Fütterung" },
  { value: "training", label: "Training" },
  { value: "huf", label: "Hufbearbeitung" },
  { value: "tierarzt", label: "Tierarzt" },
  { value: "verhalten", label: "Verhalten" },
];

export default function Notizen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ horse_id: "", title: "", content: "", category: "allgemein" });
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "horse">("newest");

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceHorseId, setVoiceHorseId] = useState("");
  const [voiceCategory, setVoiceCategory] = useState("allgemein");
  const recognitionRef = useRef<any>(null);

  const fetchNotes = async () => {
    if (!user) return;
    const { data } = await supabase.from("notes").select("*, horses(name)").eq("user_id", user.id).order("created_at", { ascending: false });
    setNotes((data || []) as Note[]);
    setLoading(false);
  };

  const fetchHorses = async () => {
    if (!user) return;
    const { data } = await supabase.from("horses").select("id, name").eq("user_id", user.id);
    setHorses(data || []);
  };

  useEffect(() => { fetchNotes(); fetchHorses(); }, [user]);

  const handleAdd = async () => {
    if (!form.title || !form.content || !user) return;
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      horse_id: form.horse_id || null,
      title: form.title,
      content: form.content,
      type: "text",
      category: form.category,
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Notiz gespeichert");
    setForm({ horse_id: "", title: "", content: "", category: "allgemein" });
    setShowForm(false);
    fetchNotes();
  };

  // Auto-categorize based on content keywords
  const autoCategory = (text: string): string => {
    const lower = text.toLowerCase();
    if (/tierarzt|impf|spritze|medikament|untersuchung|blut/.test(lower)) return "tierarzt";
    if (/huf|beschlag|schmied|eisen|barfuß/.test(lower)) return "huf";
    if (/futter|heu|kraftfutter|mineralfutter|fressen|fütter/.test(lower)) return "futter";
    if (/training|reiten|longieren|bodenarbeit|galopp|trab/.test(lower)) return "training";
    if (/gesundheit|lahm|kolik|fieber|wunde|schwellung|husten/.test(lower)) return "gesundheit";
    if (/verhalten|scheu|aggressiv|unruhig|stress/.test(lower)) return "verhalten";
    return "allgemein";
  };

  // Voice recording with Web Speech API
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Spracherkennung wird von deinem Browser nicht unterstützt");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    let finalTranscript = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
        else interim += event.results[i][0].transcript;
      }
      const full = finalTranscript + interim;
      setTranscript(full);
      setVoiceCategory(autoCategory(full));
    };
    recognition.onerror = (event: any) => {
      toast.error("Spracherkennungsfehler: " + event.error);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
  };

  const stopRecording = () => { recognitionRef.current?.stop(); setIsRecording(false); };

  const saveVoiceNote = async () => {
    if (!transcript.trim() || !user) return;
    const horseName = horses.find((h) => h.id === voiceHorseId)?.name;
    const title = (horseName ? `${horseName} – ` : "") + "Sprachnotiz – " + new Date().toLocaleDateString("de-DE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      horse_id: voiceHorseId || null,
      title,
      content: transcript.trim(),
      type: "voice",
      category: voiceCategory,
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Sprachnotiz gespeichert");
    setTranscript("");
    setVoiceHorseId("");
    setVoiceCategory("allgemein");
    fetchNotes();
  };

  // Filter and sort
  const processed = notes
    .filter((n) => {
      const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase()) || (n.horses?.name || "").toLowerCase().includes(search.toLowerCase());
      const matchCategory = !filterCategory || n.category === filterCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === "horse") return (a.horses?.name || "zzz").localeCompare(b.horses?.name || "zzz");
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });

  const categoryLabel = (cat: string | null) => CATEGORIES.find((c) => c.value === cat)?.label || "Allgemein";

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Notizen</h2>
        <div className="flex gap-2">
          <button onClick={isRecording ? stopRecording : startRecording}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
            <span className="hidden sm:inline">{isRecording ? "Stopp" : "Sprachnotiz"}</span>
          </button>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={14} /> <span className="hidden sm:inline">Neu</span>
          </button>
        </div>
      </div>

      {/* Voice transcript */}
      {(isRecording || transcript) && (
        <div className="p-4 sm:p-5 rounded-xl bg-card border border-primary/30 space-y-3">
          <div className="flex items-center gap-2">
            <Mic size={16} className={`text-primary ${isRecording ? "animate-pulse" : ""}`} />
            <h3 className="font-semibold text-foreground text-sm">{isRecording ? "Aufnahme läuft..." : "Transkription"}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select value={voiceHorseId} onChange={(e) => setVoiceHorseId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="">Pferd zuordnen (optional)</option>
              {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
            <select value={voiceCategory} onChange={(e) => setVoiceCategory(e.target.value)}
              className="px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <p className="text-sm text-foreground leading-relaxed min-h-[2rem]">{transcript || "Sprich jetzt..."}</p>
          {!isRecording && transcript && (
            <div className="flex gap-2">
              <button onClick={saveVoiceNote} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
              <button onClick={() => { setTranscript(""); setVoiceHorseId(""); }} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">Verwerfen</button>
            </div>
          )}
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Notizen durchsuchen..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-muted-foreground flex-shrink-0" />
            <button onClick={() => setFilterCategory("")}
              className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${!filterCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              Alle
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setFilterCategory(filterCategory === c.value ? "" : c.value)}
                className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${filterCategory === c.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <SortAsc size={12} className="text-muted-foreground" />
          {(["newest", "oldest", "horse"] as const).map((s) => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-full text-xs transition-colors ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
              {s === "newest" ? "Neueste" : s === "oldest" ? "Älteste" : "Nach Pferd"}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
          <div className="p-4 sm:p-5 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Neue Notiz</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select value={form.horse_id} onChange={(e) => setForm({ ...form, horse_id: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Pferd zuordnen (optional)</option>
                {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <input placeholder="Titel *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            <textarea placeholder="Inhalt *" value={form.content} onChange={(e) => {
              setForm({ ...form, content: e.target.value, category: autoCategory(e.target.value) });
            }} rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            <button onClick={handleAdd} className="w-full sm:w-auto px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
          </div>
        </motion.div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {processed.map((note, i) => (
          <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="p-4 sm:p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                {note.type === "voice" ? <Mic size={14} className="text-primary flex-shrink-0" /> : <FileText size={14} className="text-muted-foreground flex-shrink-0" />}
                <h4 className="font-medium text-foreground text-sm truncate">{note.title}</h4>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(note.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{note.content}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{note.horses?.name || "Allgemein"}</span>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{categoryLabel(note.category)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {notes.length === 0 && (
        <div className="text-center py-12">
          <FileText size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Notizen vorhanden.</p>
        </div>
      )}
    </div>
  );
}
