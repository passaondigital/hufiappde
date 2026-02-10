import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield } from "lucide-react";

const CONSENT_KEY = "huufi_cookie_consent";

interface ConsentState {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = (analytics: boolean) => {
    const state: ConsentState = { necessary: true, analytics, timestamp: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 inset-x-0 z-[100] p-4"
      >
        <div className="max-w-lg mx-auto p-5 rounded-2xl bg-card border border-border shadow-xl">
          <div className="flex items-start gap-3 mb-4">
            <Shield size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground text-sm">Datenschutz & Cookies</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Wir verwenden notwendige Cookies für die App-Funktionalität. Optionale Analyse-Cookies helfen uns, die App zu verbessern.{" "}
                <a href="/datenschutz" className="text-primary hover:underline">Mehr erfahren</a>
              </p>
            </div>
          </div>

          {showDetails && (
            <div className="mb-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <span className="text-foreground">Notwendige Cookies</span>
                <span className="text-primary font-medium">Immer aktiv</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                <span className="text-foreground">Analyse-Cookies</span>
                <span className="text-muted-foreground">Optional</span>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => accept(true)}
              className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
            >
              Alle akzeptieren
            </button>
            <button
              onClick={() => accept(false)}
              className="flex-1 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              Nur notwendige
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 rounded-lg border border-border text-foreground text-xs hover:bg-secondary/30 transition-colors"
            >
              Details
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
