import { useState, useCallback, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VoiceAgentProps {
  isOpen: boolean;
  onClose: () => void;
  activeHorseId?: string | null;
}

export default function VoiceAgent({ isOpen, onClose, activeHorseId }: VoiceAgentProps) {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [sessionContext, setSessionContext] = useState<string>("");
  const [userMode, setUserMode] = useState<string>("personal");
  const [horses, setHorses] = useState<{ id: string; name: string }[]>([]);
  const [selectedHorse, setSelectedHorse] = useState<string | null>(activeHorseId || null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [transcriptParts, setTranscriptParts] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const conversation = useConversation({
    onConnect: () => {
      setSessionStart(Date.now());
      toast.success("Voice Agent verbunden");
    },
    onDisconnect: () => {
      // Route transcript on disconnect
      if (transcriptParts.length > 0 && user) {
        const fullTranscript = transcriptParts.join(" ");
        const duration = sessionStart ? Math.round((Date.now() - sessionStart) / 1000) : 0;
        routeTranscript(fullTranscript, duration);
      }
      setSessionStart(null);
      setTranscriptParts([]);
    },
    onMessage: (message: any) => {
      if (message.type === "user_transcript" && message.user_transcription_event?.user_transcript) {
        setTranscriptParts(prev => [...prev, message.user_transcription_event.user_transcript]);
      }
    },
    onError: (error: any) => {
      console.error("Voice error:", error);
      toast.error("Voice-Verbindung fehlgeschlagen");
    },
  });

  const routeTranscript = async (transcript: string, duration: number) => {
    if (!transcript.trim()) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          transcript,
          durationSeconds: duration,
          horseId: selectedHorse,
        }),
      });
    } catch (e) {
      console.error("Route error:", e);
    }
  };

  const startConversation = useCallback(async () => {
    if (!user) return;
    setIsConnecting(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Token-Fehler");
      }

      const data = await resp.json();
      setSessionContext(data.context || "");
      setUserMode(data.userMode || "personal");
      setHorses(data.horses || []);

      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
      });
    } catch (error: any) {
      console.error("Failed to start:", error);
      toast.error(error.message || "Verbindung fehlgeschlagen");
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, user]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Waveform animation
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const w = canvas.width = canvas.offsetWidth * 2;
    const h = canvas.height = canvas.offsetHeight * 2;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const isSpeaking = conversation.isSpeaking;
      const bars = 40;
      const barWidth = w / bars - 2;

      for (let i = 0; i < bars; i++) {
        const amplitude = isSpeaking
          ? 0.3 + Math.random() * 0.7
          : 0.05 + Math.sin(Date.now() / 800 + i * 0.3) * 0.08;
        const barH = h * amplitude;
        const x = i * (barWidth + 2);
        const y = (h - barH) / 2;

        ctx.fillStyle = `hsla(25, 91%, 53%, ${isSpeaking ? 0.8 + amplitude * 0.2 : 0.3})`;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barH, 3);
        ctx.fill();
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isOpen, conversation.isSpeaking]);

  useEffect(() => {
    if (activeHorseId) setSelectedHorse(activeHorseId);
  }, [activeHorseId]);

  if (!isOpen) return null;

  const isConnected = conversation.status === "connected";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center"
        style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/90" onClick={() => {
          if (isConnected) stopConversation();
          onClose();
        }} />

        {/* Voice UI */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative z-10 w-full max-w-md mx-4 flex flex-col items-center gap-8 p-8"
        >
          {/* Close button */}
          <button
            onClick={() => {
              if (isConnected) stopConversation();
              onClose();
            }}
            className="absolute top-0 right-0 p-2 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          {/* Title */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Huufi Voice
            </h2>
            <p className="text-sm text-white/50 mt-1">
              {userMode === "business" ? "Business Assistent" : userMode === "horse" ? "Pferde-Begleiter" : "Dein Assistent"}
            </p>
          </div>

          {/* Waveform */}
          <div className="w-full h-32 relative">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ imageRendering: "auto" }}
            />
            {conversation.isSpeaking && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[#F47B20]">
                <Volume2 size={14} className="animate-pulse" />
                <span className="text-xs font-medium">Huufi spricht…</span>
              </div>
            )}
          </div>

          {/* Horse selector (if connected and horses available) */}
          {isConnected && horses.length > 0 && (
            <div className="w-full">
              <select
                value={selectedHorse || ""}
                onChange={(e) => setSelectedHorse(e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#F47B20]"
              >
                <option value="" className="bg-black">Kein Pferd zugeordnet</option>
                {horses.map(h => (
                  <option key={h.id} value={h.id} className="bg-black">{h.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Main action button */}
          <button
            onClick={isConnected ? stopConversation : startConversation}
            disabled={isConnecting}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isConnected
                ? "bg-[#F47B20] shadow-[0_0_40px_rgba(244,123,32,0.4)] hover:shadow-[0_0_60px_rgba(244,123,32,0.6)]"
                : isConnecting
                ? "bg-white/10 animate-pulse"
                : "bg-white/10 hover:bg-[#F47B20]/20 border-2 border-[#F47B20]/50 hover:border-[#F47B20]"
            }`}
          >
            {isConnected ? (
              <MicOff size={32} className="text-white" />
            ) : (
              <Mic size={32} className={isConnecting ? "text-white/50" : "text-[#F47B20]"} />
            )}
            {isConnected && (
              <span className="absolute inset-0 rounded-full border-2 border-[#F47B20] animate-ping opacity-30" />
            )}
          </button>

          {/* Status text */}
          <p className="text-sm text-white/60">
            {isConnecting
              ? "Verbinde…"
              : isConnected
              ? "Tippe zum Beenden"
              : "Tippe zum Sprechen"}
          </p>

          {/* Transcript preview */}
          {transcriptParts.length > 0 && (
            <div className="w-full max-h-24 overflow-y-auto rounded-lg bg-white/5 p-3">
              <p className="text-xs text-white/40 mb-1">Transkript:</p>
              <p className="text-sm text-white/70">{transcriptParts.slice(-3).join(" ")}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
