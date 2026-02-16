import { useState, useRef } from "react";
import { Video, Upload, Play, Pause, AlertTriangle, Activity, Lock, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";

type AnalysisStatus = "idle" | "uploading" | "analyzing" | "done";

export default function VideoAnalyse() {
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error("Bitte eine Video-Datei auswählen.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Maximale Dateigröße: 100 MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setStatus("idle");
  };

  const simulateAnalysis = () => {
    setStatus("uploading");
    setTimeout(() => setStatus("analyzing"), 1500);
    setTimeout(() => {
      setStatus("done");
      toast.success("Analyse abgeschlossen (Demo)");
    }, 4500);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity size={24} className="text-primary" />
          Bewegungsanalyse
        </h2>
        <p className="text-muted-foreground mt-1">
          KI-gestützte Ganganalyse für Pferde – Lahmheiten frühzeitig erkennen.
        </p>
      </div>

      {/* Phase 3 Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-6"
      >
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <Sparkles size={10} />
            Phase 3 – Coming Soon
          </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Video size={22} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Pose Estimation & Skelett-Overlay</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lade ein Video deines Pferdes hoch und erhalte eine automatische Analyse der Bewegungsmuster. 
              Unsere KI erkennt Symmetrie-Abweichungen, Gangirregularitäten und potenzielle Lahmheiten.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {["Skelett-Tracking", "Symmetrie-Score", "Lahmheits-Index", "PDF-Report"].map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <h3 className="text-sm font-semibold text-foreground">Video hochladen (Demo)</h3>
        
        {!videoUrl ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full p-12 rounded-2xl border-2 border-dashed border-border hover:border-primary/30 bg-card transition-colors flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">Video auswählen</p>
            <p className="text-xs text-muted-foreground">MP4, MOV, AVI – max. 100 MB</p>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-foreground/5 border border-border">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full max-h-[400px] object-contain"
                onEnded={() => setPlaying(false)}
              />
              {/* Overlay controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-4 flex items-end justify-between">
                <button onClick={togglePlay} className="p-2.5 rounded-full bg-card/90 hover:bg-card transition-colors">
                  {playing ? <Pause size={18} className="text-foreground" /> : <Play size={18} className="text-foreground" />}
                </button>
                {status === "done" && (
                  <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                    <Activity size={12} /> Analyse bereit
                  </span>
                )}
              </div>
              {/* Analysis overlay animation */}
              {status === "analyzing" && (
                <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-sm font-medium text-card">Skelett wird analysiert...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setVideoUrl(null); setStatus("idle"); }}
                className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                Anderes Video
              </button>
              <button
                onClick={simulateAnalysis}
                disabled={status === "uploading" || status === "analyzing"}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "uploading" && "Wird hochgeladen..."}
                {status === "analyzing" && "Analyse läuft..."}
                {status === "idle" && (
                  <>
                    <Activity size={16} /> Analyse starten (Demo)
                  </>
                )}
                {status === "done" && "Erneut analysieren"}
              </button>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </motion.div>

      {/* Demo Results */}
      {status === "done" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground">Analyse-Ergebnis (Demo-Daten)</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: "Symmetrie-Score", value: "87%", desc: "Leichte Asymmetrie links", color: "text-destructive" },
              { label: "Lahmheits-Index", value: "1.2", desc: "Grad 1 – minimal", color: "text-primary" },
              { label: "Taktklarheit", value: "94%", desc: "Regelmäßiger 4-Takt", color: "text-primary" },
            ].map((metric) => (
              <div key={metric.label} className="p-4 rounded-xl bg-card border border-border space-y-2">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-card border border-border space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-destructive" />
              <p className="text-sm font-medium text-foreground">KI-Hinweis</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Leichte Asymmetrie in der linken Hinterhand erkannt. Empfehlung: Kontrolle durch Tierarzt 
              bei anhaltender Auffälligkeit. Die vollständige Skelett-Analyse mit Frame-by-Frame Overlay 
              wird in Phase 3 verfügbar sein.
            </p>
          </div>
        </motion.div>
      )}

      {/* Premium Lock Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lock size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">Premium-Feature (Phase 3)</p>
          <p className="text-xs text-muted-foreground">
            Die vollständige Bewegungsanalyse mit Skelett-Overlay und PDF-Export wird für Premium-Nutzer verfügbar sein.
          </p>
        </div>
        <Link
          to="/app/abonnement"
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 flex-shrink-0"
        >
          Upgrade <ArrowRight size={12} />
        </Link>
      </motion.div>
    </div>
  );
}
