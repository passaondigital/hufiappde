import { useState, useRef, useEffect } from "react";
import { Send, Mic, MicOff, Bot, User, Trash2, Volume2, VolumeX, Sparkles, Zap, ImagePlus, Download, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import SmartTriggers from "@/components/SmartTriggers";
import OnboardingTour from "@/components/OnboardingTour";
import MvpQuestionPrompt from "@/components/MvpQuestionPrompt";
import huufiLogo from "@/assets/huufi-logo.png";
import { useSearchParams } from "react-router-dom";

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [accountType, setAccountType] = useState<"free" | "pro">("free");
  const [chatBgUrl, setChatBgUrl] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history
  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("chat_messages").select("*").eq("user_id", user.id).order("created_at"),
      supabase.from("user_subscriptions").select("plan").eq("user_id", user.id).eq("is_active", true).maybeSingle(),
      supabase.from("profiles").select("chat_bg_url").eq("user_id", user.id).maybeSingle(),
    ]).then(([{ data: msgs }, { data: sub }, { data: profile }]) => {
      if (msgs && msgs.length > 0) {
        setMessages(msgs.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
      }
      setAccountType(sub?.plan === "premium" ? "pro" : "free");
      setChatBgUrl((profile as any)?.chat_bg_url || null);
      setLoadingHistory(false);
    });
  }, [user]);

  // Handle incoming query from omnibox or deep link
  useEffect(() => {
    const q = searchParams.get("q");
    if (q && !loadingHistory) {
      setInput(q);
      // Auto-send after a tick
      setTimeout(() => {
        setInput(q);
        handleSendWithContent(q);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingHistory]);

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

  const handleSendWithContent = async (content: string) => {
    if (!content.trim() || !user || isLoading) return;
    const userContent = content.trim();

    const { data: savedMsg } = await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: userContent }).select().single();
    const userMsg: Message = { id: savedMsg?.id || Date.now().toString(), role: "user", content: userContent };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setInput("");

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

  const handleSend = () => handleSendWithContent(input);

  const clearChat = async () => {
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    toast.success("Chat gelöscht");
  };

  const handleShare = async (content: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ text: content });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(content);
      toast.success("In Zwischenablage kopiert");
    }
  };

  const handleDownload = (content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `huufi-antwort-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto px-4 relative">
      {/* Custom background */}
      {chatBgUrl && (
        <div
          className="absolute inset-0 z-0 rounded-xl overflow-hidden opacity-15 pointer-events-none"
          style={{ backgroundImage: `url(${chatBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      )}
      <div className="relative z-10 flex flex-col h-full">
      <OnboardingTour />
      <MvpQuestionPrompt />

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {/* Empty state / Welcome */}
        {messages.length === 0 && !loadingHistory && (
          <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3"
            >
              <img src={huufiLogo} alt="" className="h-16 w-16 mx-auto rounded-2xl object-contain" />
              <h1 className="text-xl font-bold text-foreground">Hallo! Ich bin Huufi 👋</h1>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Dein KI-Assistent rund ums Pferd. Frag mich alles – ich helfe dir mit Gesundheit, Terminen, Fütterung und mehr.
              </p>
              <p className="text-xs text-muted-foreground">
                {accountType === "pro" ? "✨ Pro" : "⚡ Free"} · Powered by HuufiAi
              </p>
            </motion.div>

            {/* Smart Triggers as conversation starters */}
            <div className="w-full max-w-sm">
              <SmartTriggers onSendMessage={(text) => handleSendWithContent(text)} />
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
            }`}>
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div className="flex flex-col gap-1 max-w-[75%]">
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-card border border-border text-foreground rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>
              {/* Action buttons for assistant messages */}
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 px-1">
                  <button
                    onClick={() => handleShare(msg.content)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Teilen"
                  >
                    <Share2 size={12} />
                  </button>
                  <button
                    onClick={() => handleDownload(msg.content)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                    title="Herunterladen"
                  >
                    <Download size={12} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot size={16} className="text-primary" />
            </div>
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

      {/* Input bar */}
      <div className="border-t border-border pt-3 pb-2">
        {/* Inline controls */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${
              accountType === "pro" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
            }`}>
              {accountType === "pro" ? <Sparkles size={10} /> : <Zap size={10} />}
              {accountType === "pro" ? "Pro" : "Free"}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                setTtsEnabled(!ttsEnabled);
                toast.success(ttsEnabled ? "Sprachausgabe deaktiviert" : "Sprachausgabe aktiviert");
              }}
              className={`p-1.5 rounded-lg transition-all ${
                ttsEnabled ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
              title={ttsEnabled ? "TTS deaktivieren" : "TTS aktivieren"}
            >
              {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            {messages.length > 0 && (
              <button onClick={clearChat} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Chat löschen">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={isRecording ? "Ich höre zu..." : "Wie kann ich dir helfen?"}
            className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
