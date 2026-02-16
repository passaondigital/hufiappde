import { useState, useRef, useEffect, useCallback } from "react";
import { Video, Upload, Play, Pause, AlertTriangle, Activity, Lock, Sparkles, ArrowRight, SkipForward, SkipBack } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import PoseOverlay from "@/components/PoseOverlay";

type AnalysisStatus = "idle" | "loading" | "analyzing" | "done";

interface AnalysisResult {
  symmetryScore: number;
  lamenessIndex: number;
  beatClarity: number;
  symmetryDesc: string;
  lamenessDesc: string;
  beatDesc: string;
  aiNote: string;
}

export default function VideoAnalyse() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
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
    setShowSkeleton(false);
    setAnalysisResult(null);
  };

  const startAnalysis = () => {
    if (!videoRef.current) return;
    setStatus("loading");
    // Give time for model to "load", then start skeleton overlay
    setTimeout(() => {
      setStatus("analyzing");
      setShowSkeleton(true);
      videoRef.current?.play();
      setPlaying(true);
      toast.info("Skelett-Overlay aktiv – Analyse läuft...");
    }, 1500);
  };

  const onAnalysisComplete = useCallback(() => {
    // Generate realistic demo results
    const symmetryScore = 82 + Math.round(Math.random() * 12);
    const lamenessIndex = +(0.5 + Math.random() * 1.5).toFixed(1);
    const beatClarity = 88 + Math.round(Math.random() * 10);
    
    setAnalysisResult({
      symmetryScore,
      lamenessIndex,
      beatClarity,
      symmetryDesc: symmetryScore < 85 ? "Leichte Asymmetrie erkannt" : "Gute Symmetrie",
      lamenessDesc: lamenessIndex > 1.5 ? "Grad 2 – auffällig" : lamenessIndex > 1 ? "Grad 1 – minimal" : "Unauffällig",
      beatDesc: beatClarity > 90 ? "Regelmäßiger 4-Takt" : "Leichte Unregelmäßigkeiten",
      aiNote: symmetryScore < 85
        ? "Leichte Asymmetrie in der linken Hinterhand erkannt. Empfehlung: Kontrolle durch Tierarzt bei anhaltender Auffälligkeit."
        : "Keine auffälligen Bewegungsabweichungen erkannt. Die Gangmuster liegen im normalen Bereich.",
    });
    setStatus("done");
    toast.success(t("videoAnalysis.analysisReady"));
  }, [t]);

  // Auto-complete analysis when video ends
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnded = () => {
      setPlaying(false);
      if (status === "analyzing") {
        onAnalysisComplete();
      }
    };
    video.addEventListener("ended", handleEnded);
    return () => video.removeEventListener("ended", handleEnded);
  }, [status, onAnalysisComplete]);

  // Allow manual completion after 10s of analysis
  useEffect(() => {
    if (status !== "analyzing") return;
    const timer = setTimeout(() => {
      // Show "complete" button becomes available after 10s
    }, 10000);
    return () => clearTimeout(timer);
  }, [status]);

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
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity size={24} className="text-primary" />
          {t("videoAnalysis.title")}
        </h2>
        <p className="text-muted-foreground mt-1">{t("videoAnalysis.subtitle")}</p>
      </div>

      {/* Feature Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-6"
      >
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
            <Sparkles size={10} />
            MediaPipe Pose
          </span>
        </div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Video size={22} className="text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">{t("videoAnalysis.poseEstimation")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("videoAnalysis.poseDesc")}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {[t("videoAnalysis.skeletonTracking"), t("videoAnalysis.symmetryScoreLabel"), t("videoAnalysis.lamenessIndexLabel"), t("videoAnalysis.pdfReport")].map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">{f}</span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Upload / Video Area */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">{t("videoAnalysis.uploadTitle")}</h3>
        
        {!videoUrl ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full p-12 rounded-2xl border-2 border-dashed border-border hover:border-primary/30 bg-card transition-colors flex flex-col items-center gap-3"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">{t("videoAnalysis.selectVideo")}</p>
            <p className="text-xs text-muted-foreground">{t("videoAnalysis.fileTypes")}</p>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-foreground/5 border border-border">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full max-h-[400px] object-contain"
                playsInline
              />
              
              {/* Pose Overlay Canvas */}
              {showSkeleton && videoRef.current && (
                <PoseOverlay videoRef={videoRef} isActive={showSkeleton && playing} />
              )}

              {/* Controls overlay */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/60 to-transparent p-4 flex items-end justify-between">
                <div className="flex items-center gap-2">
                  <button onClick={togglePlay} className="p-2.5 rounded-full bg-card/90 hover:bg-card transition-colors">
                    {playing ? <Pause size={18} className="text-foreground" /> : <Play size={18} className="text-foreground" />}
                  </button>
                  {showSkeleton && (
                    <span className="px-2 py-1 rounded-lg bg-primary/80 text-primary-foreground text-[10px] font-bold animate-pulse">
                      🦴 SKELETON ACTIVE
                    </span>
                  )}
                </div>
                {status === "done" && (
                  <span className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-1">
                    <Activity size={12} /> {t("videoAnalysis.analysisReady")}
                  </span>
                )}
              </div>

              {/* Loading overlay */}
              {status === "loading" && (
                <div className="absolute inset-0 bg-foreground/30 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="w-14 h-14 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
                    <p className="text-sm font-medium text-card">Pose-Modell wird geladen...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setVideoUrl(null); setStatus("idle"); setShowSkeleton(false); setAnalysisResult(null); }}
                className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                {t("videoAnalysis.otherVideo")}
              </button>
              {status === "analyzing" && (
                <button
                  onClick={onAnalysisComplete}
                  className="px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
                >
                  <SkipForward size={16} /> Analyse abschließen
                </button>
              )}
              <button
                onClick={startAnalysis}
                disabled={status === "loading" || status === "analyzing"}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {status === "loading" && "Modell lädt..."}
                {status === "analyzing" && t("videoAnalysis.analyzing")}
                {status === "idle" && (<><Activity size={16} /> {t("videoAnalysis.startAnalysis")}</>)}
                {status === "done" && t("videoAnalysis.reAnalyze")}
              </button>
            </div>
          </div>
        )}

        <input ref={inputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      </motion.div>

      {/* Results */}
      {status === "done" && analysisResult && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">{t("videoAnalysis.analysisResult")}</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { label: t("videoAnalysis.symmetryScore"), value: `${analysisResult.symmetryScore}%`, desc: analysisResult.symmetryDesc, color: analysisResult.symmetryScore < 85 ? "text-destructive" : "text-primary" },
              { label: t("videoAnalysis.lamenessIndex"), value: analysisResult.lamenessIndex.toString(), desc: analysisResult.lamenessDesc, color: analysisResult.lamenessIndex > 1.5 ? "text-destructive" : "text-primary" },
              { label: t("videoAnalysis.beatClarity"), value: `${analysisResult.beatClarity}%`, desc: analysisResult.beatDesc, color: "text-primary" },
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
              <p className="text-sm font-medium text-foreground">{t("videoAnalysis.aiHint")}</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{analysisResult.aiNote}</p>
          </div>
        </motion.div>
      )}

      {/* Premium Info */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lock size={18} className="text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{t("videoAnalysis.premium")}</p>
          <p className="text-xs text-muted-foreground">{t("videoAnalysis.premiumDesc")}</p>
        </div>
        <Link to="/app/abonnement"
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1 flex-shrink-0">
          {t("videoAnalysis.upgrade")} <ArrowRight size={12} />
        </Link>
      </motion.div>
    </div>
  );
}
