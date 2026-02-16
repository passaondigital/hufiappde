import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Heart, Calendar, FileText, Mic, Shield, ArrowRight, ChevronRight, Link2, CloudSun, FolderLock, QrCode, Sparkles, Star, Zap, Bell, HelpCircle, LogIn, LogOut, Brain, BarChart3, Video, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import huufiLogo from "@/assets/huufi-logo.png";
import heroBg from "@/assets/hero-bg.jpg";
import FaqSection from "@/components/FaqSection";

const iconMap: Record<string, any> = {
  Heart, MessageCircle, Calendar, Mic, Link2, CloudSun, FolderLock, QrCode, Shield, Sparkles, Star, Zap, Bell, FileText, HelpCircle, Brain, BarChart3, Video, Users,
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

const pricingPlans = [
  {
    tier: "Privat",
    plans: [
      { name: "Basis", price: "0€", period: "/mo", features: ["Notizen & Cloud-Sync", "1 GB Storage", "Community Support"], highlight: false },
      { name: "Smart Life", price: "4,90€", period: "/mo", features: ["KI für Bilder & Texte", "Grafiken & Protokolle", "5 GB Storage"], highlight: true },
      { name: "Agent Mode", price: "14,99€", period: "/mo", features: ["Automatisierte Aufgaben", "Video-Analyse", "10 GB Storage"], highlight: false },
    ],
  },
  {
    tier: "Business",
    plans: [
      { name: "Test-Modus", price: "0€", period: "/mo", features: ["Professioneller Test", "1 GB Storage", "Basis-Features"], highlight: false },
      { name: "Pro-Business", price: "9,90€", period: "/mo", features: ["Volle KI-Suite", "Beleg-Scanning", "10 GB Storage"], highlight: true },
      { name: "Expert Agent", price: "19,99€", period: "/mo", features: ["Full Automation", "Video-Bewegungsanalyse", "25 GB Storage"], highlight: false },
    ],
  },
];

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const [features, setFeatures] = useState<Feature[]>([]);
  const [pricingTab, setPricingTab] = useState<"Privat" | "Business">("Privat");

  useEffect(() => {
    supabase.from("app_features").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }) => setFeatures((data || []) as Feature[]));
  }, []);

  const activePricing = pricingPlans.find((p) => p.tier === pricingTab)!;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={huufiLogo} alt="HuufiApp" className="h-9 w-9" />
            <span className="text-lg font-bold text-foreground">HuufiApp</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Funktionen</a>
            <a href="#pricing" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">Preise</a>
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
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/80 via-foreground/60 to-background" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-28 md:py-40 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-xs font-medium mb-6 backdrop-blur-sm border border-primary/30">
              <Sparkles size={12} /> KI-gestützter Assistent für Pferd & Business
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Dein intelligenter<br />
              <span className="text-gradient">Pferde-Assistent</span>
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              HuufiApp vereint KI, Bewegungsanalyse und Business-Tools – alles in einer App. Für Pferdebesitzer und Profis.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/app" : "/auth"} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl hero-gradient text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                Kostenlos starten <ChevronRight size={18} />
              </Link>
              <a href="#features" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-base font-medium hover:bg-white/20 transition-colors">
                Mehr erfahren
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2"><Shield size={16} className="text-primary" /> DSGVO-konform</div>
          <div className="flex items-center gap-2"><Zap size={16} className="text-primary" /> KI-gestützt</div>
          <div className="flex items-center gap-2"><Video size={16} className="text-primary" /> Video-Analyse</div>
          <div className="flex items-center gap-2"><Users size={16} className="text-primary" /> Team-fähig</div>
        </div>
      </section>

      {/* Features from DB */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">Features</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Alles für dein Pferd. An einem Ort.</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Von KI-Chat über Bewegungsanalyse bis zur Kundenverwaltung.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon] || Sparkles;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all group relative">
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

      {/* Pricing Preview */}
      <section id="pricing" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">Preise</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Wähle deinen Plan</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Starte kostenlos und skaliere mit deinen Anforderungen.</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-secondary w-fit mx-auto mb-10">
            {(["Privat", "Business"] as const).map((t) => (
              <button key={t} onClick={() => setPricingTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${pricingTab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {activePricing.plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border ${plan.highlight ? "bg-foreground text-background border-foreground shadow-xl shadow-primary/10 scale-105" : "bg-card border-border"} flex flex-col`}>
                <p className={`text-sm font-medium mb-2 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-3xl font-bold ${plan.highlight ? "text-background" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-background/60" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                      <ChevronRight size={14} className={plan.highlight ? "text-primary" : "text-primary"} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={user ? "/app" : "/auth"}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}>
                  {plan.price === "0€" ? "Kostenlos starten" : "Plan wählen"}
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Team-Pläne ab 49€/mo für 1-5 Nutzer verfügbar. <a href="#faq" className="text-primary hover:underline">Mehr erfahren</a>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative p-10 md:p-16 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(0 0% 7%) 0%, hsl(0 0% 15%) 100%)" }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Bereit für intelligente Pferde-Betreuung?</h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">Starte jetzt kostenlos und entdecke, wie HuufiApp dir den Kopf freihält.</p>
            <Link to={user ? "/app" : "/auth"} className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl hero-gradient text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
              Jetzt starten <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
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
