import { useState, useRef, useEffect } from "react";
import { Send, Mic, Bot, User } from "lucide-react";
import { motion } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
}

const welcomeMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Hallo! 👋 Ich bin dein HuufiApp Assistent. Ich kann dir bei Fragen rund ums Pferd helfen, Notizen zusammenfassen oder Erinnerungen vorschlagen. Was kann ich für dich tun?",
    time: "Jetzt",
  },
];

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>(welcomeMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock response (will be replaced with real AI later)
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getSimpleResponse(userMsg.content),
        time: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant"
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
            </div>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-card border border-border text-foreground rounded-tl-md"
                  : "bg-primary text-primary-foreground rounded-tr-md"
              }`}
            >
              {msg.content}
              <p
                className={`text-xs mt-1.5 ${
                  msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/60"
                }`}
              >
                {msg.time}
              </p>
            </div>
          </motion.div>
        ))}
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

      {/* Input */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <button className="p-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
            <Mic size={18} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Schreibe eine Nachricht..."
            className="flex-1 px-4 py-2.5 rounded-lg bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          KI-Assistent · Keine medizinische Beratung
        </p>
      </div>
    </div>
  );
}

function getSimpleResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("huf") || lower.includes("beschlag"))
    return "Zur Hufbearbeitung empfehle ich einen 6-8 Wochen Rhythmus. Soll ich dir einen Erinnerungstermin erstellen?";
  if (lower.includes("futter") || lower.includes("fütterung"))
    return "Die Fütterung sollte auf Gewicht, Nutzung und Gesundheitszustand abgestimmt sein. Welches Pferd meinst du?";
  if (lower.includes("termin"))
    return "Ich kann dir helfen, deine Termine zu organisieren. Möchtest du einen neuen Termin anlegen?";
  if (lower.includes("luna") || lower.includes("nero") || lower.includes("stella"))
    return "Ich habe die Daten zu deinem Pferd geladen. Was möchtest du wissen oder notieren?";
  return "Danke für deine Nachricht! Ich kann dir bei Themen rund um Pferdegesundheit, Termine und Notizen helfen. Frag mich gerne etwas Konkretes.";
}
