import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Mic, MicOff, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Note {
  id: string;
  horse_id: string | null;
  title: string;
  content: string;
  type: string;
  created_at: string;
  horses?: { name: string } | null;
}

interface Horse {
  id: string;
  name: string;
}

export default function Notizen() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ horse_id: "", title: "", content: "" });
  const [loading, setLoading] = useState(true);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [voiceHorseId, setVoiceHorseId] = useState("");
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
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Notiz gespeichert");
    setForm({ horse_id: "", title: "", content: "" });
    setShowForm(false);
    fetchNotes();
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
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error:", event.error);
      toast.error("Spracherkennungsfehler: " + event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setTranscript("");
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

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
    });
    if (error) { toast.error("Fehler beim Speichern"); return; }
    toast.success("Sprachnotiz gespeichert");
    setTranscript("");
    setVoiceHorseId("");
    fetchNotes();
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (n.horses?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Notizen</h2>
        <div className="flex gap-2">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            {isRecording ? "Stopp" : "Sprachnotiz"}
          </button>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus size={16} /> Neu
          </button>
        </div>
      </div>

      {/* Voice transcript */}
      {(isRecording || transcript) && (
        <div className="p-5 rounded-xl bg-card border border-primary/30 space-y-3">
          <div className="flex items-center gap-2">
            <Mic size={16} className={`text-primary ${isRecording ? "animate-pulse" : ""}`} />
            <h3 className="font-semibold text-foreground text-sm">{isRecording ? "Aufnahme läuft..." : "Transkription"}</h3>
          </div>
          <select value={voiceHorseId} onChange={(e) => setVoiceHorseId(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Pferd zuordnen (optional)</option>
            {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <p className="text-sm text-foreground leading-relaxed min-h-[2rem]">
            {transcript || "Sprich jetzt..."}
          </p>
          {!isRecording && transcript && (
            <div className="flex gap-2">
              <button onClick={saveVoiceNote} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
              <button onClick={() => { setTranscript(""); setVoiceHorseId(""); }} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">Verwerfen</button>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Notizen durchsuchen..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Neue Notiz</h3>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={form.horse_id} onChange={(e) => setForm({ ...form, horse_id: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pferd zuordnen (optional)</option>
                {horses.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <input placeholder="Titel *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <textarea placeholder="Inhalt *" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button onClick={handleAdd} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Speichern</button>
          </div>
        </motion.div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {filtered.map((note, i) => (
          <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {note.type === "voice" ? <Mic size={14} className="text-primary" /> : <FileText size={14} className="text-muted-foreground" />}
                <h4 className="font-medium text-foreground text-sm">{note.title}</h4>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(note.created_at)}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{note.content}</p>
            <span className="inline-block mt-3 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
              {note.horses?.name || "Allgemein"}
            </span>
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
