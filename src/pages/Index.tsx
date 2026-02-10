import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Heart, Calendar, FileText, Mic, Shield, ArrowRight, ChevronRight } from "lucide-react";
import huufiLogo from "@/assets/huufi-logo.png";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Heart,
    title: "Pferdeprofil",
    desc: "Alle wichtigen Daten deines Pferdes an einem Ort – von Gesundheitsnotizen bis zur kompletten Historie.",
  },
  {
    icon: MessageCircle,
    title: "KI-Assistent",
    desc: "Fragen beantworten, Notizen zusammenfassen, Erinnerungen vorschlagen – dein digitaler Stallhelfer.",
  },
  {
    icon: Calendar,
    title: "Terminverwaltung",
    desc: "Hufbearbeitung, Tierarzt, Osteopath – alle Termine übersichtlich und mit Erinnerungen.",
  },
  {
    icon: Mic,
    title: "Sprachnotizen",
    desc: "Im Stall einfach sprechen statt tippen. Automatische Transkription und Zuordnung zum Pferd.",
  },
  {
    icon: FileText,
    title: "Gesundheitsnotizen",
    desc: "Strukturierte und freie Notizen – immer griffbereit, chronologisch geordnet.",
  },
  {
    icon: Shield,
    title: "Für Profis",
    desc: "Kundenverwaltung mit Pferdzuordnung. Sprachnotizen automatisch der richtigen Akte zugeordnet.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={huufiLogo} alt="HuufiApp" className="h-9 w-9" />
            <span className="text-lg font-bold text-foreground" style={{ fontFamily: "sans-serif" }}>
              HuufiApp
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Funktionen
            </a>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Zur App <ArrowRight size={14} />
            </Link>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <img src={huufiLogo} alt="HuufiApp" className="h-20 w-20 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Dein Pferd verdient
              <br />
              <span className="text-gradient">die beste Betreuung</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              HuufiApp ist dein KI-gestützter Assistent für Pferdegesundheit, Terminplanung und
              mentale Entlastung – damit du dich auf das Wesentliche konzentrieren kannst.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl hero-gradient text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity shadow-lg"
              >
                Kostenlos starten <ChevronRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-card border border-border text-foreground text-base font-medium hover:bg-secondary transition-colors"
              >
                Mehr erfahren
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Alles für dein Pferd. An einem Ort.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Von der Gesundheitsnotiz bis zur Kundenverwaltung – HuufiApp hält dir den Kopf frei.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors group"
            >
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                <f.icon size={22} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="relative p-10 md:p-16 rounded-3xl hero-gradient text-center overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Bereit, deinen Stallalltag zu vereinfachen?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Starte jetzt kostenlos und entdecke, wie HuufiApp dir den Kopf freihält.
            </p>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-background text-foreground text-base font-semibold hover:bg-background/90 transition-colors"
            >
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
            <span className="text-sm text-muted-foreground">© 2026 HuufiApp · PASSA ON Digital</span>
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
