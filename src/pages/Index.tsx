import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Calendar, FileText, Mic, Shield, ArrowRight, ChevronRight, Link2, CloudSun, FolderLock, QrCode, Sparkles, Star, Zap, Bell, HelpCircle, LogIn, LogOut, Brain, BarChart3, Video, Users, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import huufiLogo from "@/assets/huufi-logo.png";
import heroImg from "@/assets/hero-emotional.jpg";
import FaqSection from "@/components/FaqSection";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
      { name: "Kostenlos", price: "0€", period: "/mo", features: ["Notizen & Cloud-Sync", "1 GB Speicher", "Community"], highlight: false },
      { name: "Smart", price: "4,90€", period: "/mo", features: ["KI-Assistent für dein Pferd", "Foto- & Sprachnotizen", "5 GB Speicher"], highlight: true },
      { name: "Premium", price: "14,99€", period: "/mo", features: ["Video-Bewegungsanalyse", "Automatische Protokolle", "10 GB Speicher"], highlight: false },
    ],
  },
  {
    tier: "Business",
    plans: [
      { name: "Starter", price: "0€", period: "/mo", features: ["Professionell testen", "1 GB Speicher", "Basis-Features"], highlight: false },
      { name: "Profi", price: "9,90€", period: "/mo", features: ["Kundenverwaltung", "Beleg-Scanning", "10 GB Speicher"], highlight: true },
      { name: "Expert", price: "19,99€", period: "/mo", features: ["Volle Automatisierung", "Video-Analyse", "25 GB Speicher"], highlight: false },
    ],
  },
];

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();
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
            <a href="#warum" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.whyHuufi")}</a>
            <a href="#funktionen" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.features")}</a>
            <a href="#preise" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">{t("nav.pricing")}</a>
            <LanguageSwitcher />
            {user ? (
              <>
                <Link to="/app" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                  {t("nav.toApp")} <ArrowRight size={14} />
                </Link>
                <button onClick={signOut} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <LogOut size={14} /> {t("nav.signOut")}
                </button>
              </>
            ) : (
              <Link to="/auth" className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <LogIn size={14} /> {t("nav.signIn")}
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={heroImg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/50 to-background" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 md:py-44 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-primary text-sm font-medium tracking-wide mb-4 uppercase">{t("hero.badge")}</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              {t("hero.title1")}<br />
              <span className="text-gradient">{t("hero.title2")}</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">{t("hero.subtitle")}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/app" : "/auth"} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl hero-gradient text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/30">
                {t("hero.cta")} <Heart size={18} />
              </Link>
              <a href="#warum" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white text-base font-medium hover:bg-white/20 transition-colors">
                {t("hero.learnMore")}
              </a>
            </div>
            <p className="text-white/50 text-xs mt-6">{t("hero.trust")}</p>
          </motion.div>
        </div>
      </section>

      {/* Why Section */}
      <section id="warum" className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("why.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("why.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {(t("why.items", { returnObjects: true }) as any[]).map((item: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center p-8 rounded-2xl bg-card border border-border">
              <div className="text-4xl mb-4">{item.emoji}</div>
              <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">{t("testimonials.title")}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {(t("testimonials.items", { returnObjects: true }) as any[]).map((item: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-background border border-border">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">🐴</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features from DB */}
      <section id="funktionen" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("featuresSection.title")}</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{t("featuresSection.subtitle")}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon] || Sparkles;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
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

      {/* Pricing */}
      <section id="preise" className="bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("pricingSection.title")}</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">{t("pricingSection.subtitle")}</p>
          </div>
          <div className="flex items-center justify-center gap-1 p-1 rounded-xl bg-secondary w-fit mx-auto mb-10">
            {(["Privat", "Business"] as const).map((tab) => (
              <button key={tab} onClick={() => setPricingTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${pricingTab === tab ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {tab === "Privat" ? t("pricingSection.private") : t("pricingSection.business")}
              </button>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {activePricing.plans.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl border ${plan.highlight ? "bg-foreground text-background border-foreground shadow-xl shadow-primary/10 scale-105" : "bg-background border-border"} flex flex-col`}>
                <p className={`text-sm font-medium mb-2 ${plan.highlight ? "text-primary" : "text-muted-foreground"}`}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-3xl font-bold ${plan.highlight ? "text-background" : "text-foreground"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-background/60" : "text-muted-foreground"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-background/80" : "text-muted-foreground"}`}>
                      <Check size={14} className="text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={user ? "/app" : "/auth"}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    plan.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}>
                  {plan.price === "0€" ? t("pricingSection.free") : t("pricingSection.select")}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FaqSection />

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative p-10 md:p-16 rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(24 90% 40%) 0%, hsl(24 90% 55%) 100%)" }}>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">{t("cta.title")}</h2>
            <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">{t("cta.subtitle")}</p>
            <Link to={user ? "/app" : "/auth"} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-foreground text-base font-semibold hover:bg-white/90 transition-colors shadow-lg">
              {t("cta.button")} <Heart size={18} className="text-primary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={huufiLogo} alt="" className="h-6 w-6" />
            <span className="text-sm text-muted-foreground">&copy; 2026 HuufiApp · PASSA ON Digital</span>
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
