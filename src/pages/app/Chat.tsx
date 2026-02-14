import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Bot, User, Trash2, MessageSquare, Volume2, VolumeX, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import VoiceAgent from "@/components/VoiceAgent";

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [accountType, setAccountType] = useState<"free" | "pro">("free");
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("chat_messages").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("user_subscriptions").select("plan").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
    ]).then(([{ data: msgs }, { data: sub }]) => {
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
      }
      setAccountType(sub?.plan === "premium" ? "pro" : "free");
      setLoadingHistory(false);
    });
  }, [user]);

  const speakText = async (text: string) => {
    if (!ttsEnabled) return;
    setTtsLoading(true);
    try {
      const token = await getAccessToken();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ text: text.substring(0, 500) }),
      });
      if (!resp.ok) throw new Error("TTS fehlgeschlagen");
      const { audio } = await resp.json();
      if (audio) {
        const audioEl = new Audio(`data:audio/mpeg;base64,${audio}`);
        audioEl.play();
      }
    } catch {
      // TTS is optional
    } finally {
      setTtsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !user || isLoading) return;
    const userContent = input.trim();
    setInput("");

    const { data: savedMsg } = await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: userContent }).select().single();
    const userMsg: Message = { id: savedMsg?.id || Date.now().toString(), role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

    try {
      const token = await getAccessToken();
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Fehler bei der KI-Anfrage");
      }

      const data = await resp.json();
      const reply = data.reply || "Keine Antwort erhalten.";
      if (data.account_type) setAccountType(data.account_type);

      const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: reply };
      setMessages((prev) => [...prev, assistantMsg]);

      await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply });
      speakText(reply);
    } catch (e: any) {
      toast.error(e.message || "KI-Fehler");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast.success("Chat gelöscht");
  };

  if (loadingHistory) return <p className="text-muted-foreground">Chat wird geladen...</p>;

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Header controls */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary">
            <button
              onClick={() => setMode("text")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === "text"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare size={14} />
              Text
            </button>
            <button
              onClick={() => setMode("voice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                mode === "voice"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Volume2 size={14} />
              Voice
            </button>
          </div>

          {/* Account type badge */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
            accountType === "pro"
              ? "bg-primary/10 text-primary"
              : "bg-secondary text-muted-foreground"
          }`}>
            {accountType === "pro" ? <Sparkles size={10} /> : <Zap size={10} />}
            {accountType === "pro" ? "Pro" : "Free"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "text" && (
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                toast.success(ttsEnabled ? "Sprachausgabe deaktiviert" : "Sprachausgabe aktiviert");
              }}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                ttsEnabled
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {ttsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              {ttsEnabled ? "TTS an" : "TTS aus"}
            </button>
          )}
          {mode === "text" && messages.length > 0 && (
            <button onClick={clearChat} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Trash2 size={12} /> Löschen
            </button>
          )}
        </div>
      </div>

      {/* Voice Mode */}
      {mode === "voice" ? (
        <div className="flex-1 flex items-center justify-center">
          <VoiceAgent isOpen onClose={() => setMode("text")} />
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.length === 0 && (
              <div className="text-center py-16">
                <Bot size={40} className="text-primary/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">HufiAi Assistent</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Frag mich alles rund ums Pferd – Gesundheit, Fütterung, Haltung oder Terminplanung.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Konto: {accountType === "pro" ? "✨ Pro" : "⚡ Free"}
                </p>
              </div>
            )}
            {messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                  {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "assistant" ? "bg-card border border-border text-foreground rounded-tl-md" : "bg-primary text-primary-foreground rounded-tr-md"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot size={16} className="text-primary" /></div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-card border border-border">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0.2s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                  if (!SpeechRecognition) { toast.error("Spracherkennung nicht unterstützt."); return; }
                  if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return; }
                  const recognition = new SpeechRecognition();
                  recognition.lang = "de-DE";
                  recognition.continuous = false;
                  recognition.interimResults = false;
                  recognitionRef.current = recognition;
                  recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setInput((prev) => (prev ? prev + " " : "") + transcript);
                    setIsRecording(false);
                  };
                  recognition.onerror = () => { setIsRecording(false); toast.error("Spracherkennung fehlgeschlagen"); };
                  recognition.onend = () => setIsRecording(false);
                  recognition.start();
                  setIsRecording(true);
                }}
                className={`p-2.5 rounded-lg transition-all ${isRecording ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={isRecording ? "Ich höre zu..." : "Schreibe eine Nachricht..."}
                className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {accountType === "pro" ? "✨ Pro" : "⚡ Free"} · Powered by HufiAi
              {ttsEnabled && " · 🔊 Sprachausgabe aktiv"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
