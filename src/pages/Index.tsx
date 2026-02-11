import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Heart, Calendar, FileText, Mic, Shield, ArrowRight, ChevronRight, Link2, CloudSun, FolderLock, QrCode, Sparkles, Star, Zap, Bell, HelpCircle, LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import huufiLogo from "@/assets/huufi-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import FaqSection from "@/components/FaqSection";

const iconMap: Record<string, any> = {
  Heart, MessageCircle, Calendar, Mic, Link2, CloudSun, FolderLock, QrCode, Shield, Sparkles, Star, Zap, Bell, FileText, HelpCircle,
};

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);

  useEffect(() => {
    supabase.from("app_features").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setFeatures((data || []) as Feature[]));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={huufiLogo} alt="HuufiApp" className="h-9 w-9" />
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: "sans-serif" }}>HuufiApp</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Funktionen</a>
            <a href="#faq" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            {user ? (
              <>
                <Link to="/app" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  Zur App <ArrowRight size={14} />
                </Link>
                <button onClick={signOut} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <LogOut size={14} /> Abmelden
                </button>
              </>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <LogIn size={14} /> Anmelden
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 md:py-40 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <img src={huufiLogo} alt="HuufiApp" className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Dein Pferd verdient<br /><span className="text-gradient">die beste Betreuung</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              HuufiApp ist dein KI-gestuetzter Assistent fuer Pferdegesundheit, Terminplanung und mentale Entlastung.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/app" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl hero-gradient text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity shadow-lg">
                Kostenlos starten <ChevronRight size={18} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-card border border-border text-foreground text-base font-medium hover:bg-secondary transition-colors">
                Mehr erfahren
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features from DB */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Alles fuer dein Pferd. An einem Ort.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Von der Gesundheitsnotiz bis zur Kundenverwaltung.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon] || Sparkles;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors group relative">
                {f.badge && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">{f.badge}</span>
                )}
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon size={22} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative p-10 md:p-16 rounded-3xl hero-gradient text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Bereit, deinen Stallalltag zu vereinfachen?</h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">Starte jetzt kostenlos und entdecke, wie HuufiApp dir den Kopf freihaelt.</p>
            <Link to="/app" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-background text-foreground text-base font-semibold hover:bg-background/90 transition-colors">
              Jetzt starten <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={huufiLogo} alt="" className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">&copy; 2026 HuufiApp &middot; PASSA ON Digital</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link to="/agb" className="hover:text-foreground transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
