import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Mic, Archive, Settings, User, ArrowLeft, Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { useTranslation } from "react-i18next";
import huufiLogo from "@/assets/huufi-logo.png";
import InstallPrompt from "@/components/InstallPrompt";
import VoiceAgent from "@/components/VoiceAgent";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { t } = useTranslation();
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isHome = location.pathname === "/app";
  const isSubPage = !isHome;

  // Bottom bar items
  const bottomItems = [
    { path: "/app", icon: CalendarDays, label: t("sidebar.dashboard", "Heute") },
    { path: "__voice__", icon: Mic, label: t("sidebar.assistant", "Assistent"), isCenter: true },
    { path: "/app/archiv", icon: Archive, label: t("sidebar.archive", "Archiv") },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Bar – minimal */}
      <header className="flex items-center justify-between px-5 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          {isSubPage ? (
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={20} />
            </button>
          ) : (
            <img src={huufiLogo} alt="Huufi" className="h-8 w-8 rounded-lg object-contain" />
          )}
          {isSubPage && (
            <span className="text-base font-semibold text-foreground">
              {getPageTitle(location.pathname, t)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="text-muted-foreground hover:text-foreground" />
          {isAdmin && (
            <Link to="/app/admin" className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Shield size={18} />
            </Link>
          )}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <User size={18} />
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl bg-card border border-border shadow-lg p-2"
                  >
                    <Link to="/app/einstellungen" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors text-foreground">
                      <Settings size={16} /> {t("sidebar.settings", "Einstellungen")}
                    </Link>
                    <Link to="/app/abonnement" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors text-foreground">
                      <Archive size={16} /> {t("sidebar.subscription", "Abo")}
                    </Link>
                    <Link to="/app/feedback" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary transition-colors text-foreground">
                      <Mic size={16} /> {t("sidebar.feedback", "Feedback")}
                    </Link>
                    <hr className="my-1 border-border" />
                    <button onClick={() => { setProfileOpen(false); signOut(); }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-destructive/10 text-destructive transition-colors">
                      {t("nav.signOut", "Abmelden")}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <InstallPrompt />

      {/* Bottom Action Bar – 3 buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
        <div className="flex items-center justify-around px-6 py-2 max-w-md mx-auto">
          {bottomItems.map((item) => {
            const isActive = item.path === "/app"
              ? location.pathname === "/app"
              : location.pathname.startsWith(item.path);

            if ((item as any).isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -mt-7 flex items-center justify-center w-16 h-16 rounded-full shadow-lg bg-primary text-primary-foreground hover:scale-105 transition-transform"
                >
                  <item.icon size={26} />
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <VoiceAgent isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
    </div>
  );
}

function getPageTitle(path: string, t: any): string {
  const map: Record<string, string> = {
    "/app/pferde": t("sidebar.horses", "Pferde"),
    "/app/chat": t("sidebar.assistant", "Assistent"),
    "/app/notizen": t("sidebar.notes", "Notizen"),
    "/app/termine": t("sidebar.appointments", "Termine"),
    "/app/kunden": t("sidebar.customers", "Kunden"),
    "/app/tresor": t("sidebar.vault", "Tresor"),
    "/app/wissen": t("sidebar.knowledge", "Wissen"),
    "/app/trichter": t("sidebar.funnel", "Trichter"),
    "/app/ecosystem": t("sidebar.ecosystem", "Ecosystem"),
    "/app/abonnement": t("sidebar.subscription", "Abo"),
    "/app/video-analyse": t("sidebar.analysis", "Analyse"),
    "/app/feedback": t("sidebar.feedback", "Feedback"),
    "/app/einstellungen": t("sidebar.settings", "Einstellungen"),
    "/app/admin": t("sidebar.admin", "Admin"),
    "/app/archiv": "Archiv",
  };
  return map[path] || "";
}
