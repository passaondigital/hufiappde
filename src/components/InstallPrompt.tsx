import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function InstallPrompt() {
  const { user } = useAuth();
  const { subscribe, isSupported: pushSupported } = usePushNotifications();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"install" | "notifications">("install");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    // Listen for beforeinstallprompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    // Check if user has already dismissed or installed
    const dismissed = localStorage.getItem(`huufi_install_dismissed_${user.id}`);
    if (dismissed) return;

    // Check if already in standalone mode (installed)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Show prompt after a short delay on first login
    const timer = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(timer);
  }, [user]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    }
    // Move to notifications step
    if (pushSupported) {
      setStep("notifications");
    } else {
      handleDismiss();
    }
  };

  const handleEnableNotifications = async () => {
    await subscribe();
    handleDismiss();
  };

  const handleDismiss = () => {
    setShow(false);
    if (user) {
      localStorage.setItem(`huufi_install_dismissed_${user.id}`, "true");
    }
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-foreground/30 backdrop-blur-sm p-4"
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
        >
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {step === "install" ? <Smartphone size={24} className="text-primary" /> : <Download size={24} className="text-primary" />}
              </div>
              <button onClick={handleDismiss} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
                <X size={18} />
              </button>
            </div>

            {step === "install" ? (
              <>
                <div>
                  <h3 className="text-lg font-bold text-foreground">HuufiApp installieren</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Installiere die App auf deinem Smartphone für schnellen Zugriff – direkt vom Homescreen!
                  </p>
                </div>

                {isIOS && !deferredPrompt ? (
                  <div className="p-4 rounded-xl bg-secondary/50 space-y-2">
                    <p className="text-sm font-medium text-foreground">So geht's auf iPhone:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Tippe auf das <strong>Teilen</strong>-Symbol (□↑) unten in Safari</li>
                      <li>Scrolle nach unten und tippe <strong>„Zum Home-Bildschirm"</strong></li>
                      <li>Tippe auf <strong>„Hinzufügen"</strong></li>
                    </ol>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <button onClick={handleDismiss} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                    Später
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {deferredPrompt ? "Jetzt installieren" : isIOS ? "Verstanden" : "Weiter"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Benachrichtigungen aktivieren</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Erhalte sofort eine Nachricht, wenn dir jemand im Chat schreibt oder ein Termin ansteht.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleDismiss} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
                    Nein danke
                  </button>
                  <button
                    onClick={handleEnableNotifications}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Aktivieren
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
