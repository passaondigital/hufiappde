import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Heart, MessageCircle, FileText, Calendar, Users,
  Menu, X, ChevronLeft, LogOut, Shield, Mic, Plus, PenLine, ArrowLeft,
  FolderLock, Settings, Link2, MessageSquarePlus, Brain, Filter, Globe,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import huufiLogo from "@/assets/huufi-logo.png";
import InstallPrompt from "@/components/InstallPrompt";
import VoiceAgent from "@/components/VoiceAgent";

const navItems = [
  { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/app/pferde", icon: Heart, label: "Pferde" },
  { path: "/app/chat", icon: MessageCircle, label: "Assistent" },
  { path: "/app/notizen", icon: FileText, label: "Notizen" },
  { path: "/app/termine", icon: Calendar, label: "Termine" },
  { path: "/app/kunden", icon: Users, label: "Kunden" },
  { path: "/app/tresor", icon: FolderLock, label: "Tresor" },
  { path: "/app/wissen", icon: Brain, label: "Wissen" },
  { path: "/app/trichter", icon: Filter, label: "Trichter" },
  { path: "/app/ecosystem", icon: Globe, label: "Ecosystem" },
  { path: "/app/feedback", icon: MessageSquarePlus, label: "Feedback" },
  { path: "/app/einstellungen", icon: Settings, label: "Einstellungen" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const isSubPage = location.pathname !== "/app";

  const allNavItems = isAdmin
    ? [...navItems, { path: "/app/admin", icon: Shield, label: "Admin" }]
    : navItems;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`
        fixed z-50 md:relative md:z-auto flex flex-col h-full bg-sidebar text-sidebar-foreground
        transition-all duration-300 ease-in-out
        ${collapsed ? "md:w-20" : "md:w-64"}
        ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
          <img src={huufiLogo} alt="HuufiApp" className="h-10 w-10 rounded-lg object-contain" />
          {!collapsed && <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "sans-serif" }}>HuufiApp</span>}
          <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"><X size={20} /></button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {allNavItems.map((item) => {
            const isActive = item.path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                  ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}
                  ${collapsed ? "justify-center" : ""}`}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button onClick={signOut} className={`flex items-center gap-3 px-6 py-4 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors text-sm ${collapsed ? "justify-center px-3" : ""}`}>
          <LogOut size={18} />
          {!collapsed && <span>Abmelden</span>}
        </button>

        <button onClick={() => setCollapsed(!collapsed)} className="hidden md:flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
          <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </aside>

      <InstallPrompt />
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-foreground/60 hover:text-foreground"><Menu size={22} /></button>
          {isSubPage && (
            <button onClick={() => navigate(-1)} className="hidden md:flex p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </button>
          )}
          <h1 className="text-lg font-semibold" style={{ fontFamily: "Georgia, serif" }}>
            {allNavItems.find((n) => n.path === "/app" ? location.pathname === "/app" : location.pathname.startsWith(n.path))?.label || "HuufiApp"}
          </h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">{children}</div>

        {/* Mobile Bottom Action Bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border safe-bottom">
          <div className="flex items-center justify-around px-4 py-2">
            {/* Left: Quick Note */}
            <Link to="/app/notizen" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors">
              <PenLine size={22} />
              <span className="text-[10px] font-medium">Notiz</span>
            </Link>

            {/* Center: Microphone - opens Voice Agent */}
            <button
              onClick={() => setVoiceOpen(true)}
              className="relative -mt-6 flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all duration-200 bg-primary text-primary-foreground hover:scale-105"
            >
              <Mic size={26} />
            </button>

            {/* Right: Quick Add */}
            <Link to="/app/pferde" className="flex flex-col items-center gap-1 p-2 text-muted-foreground hover:text-primary transition-colors">
              <Plus size={22} />
              <span className="text-[10px] font-medium">Anlegen</span>
            </Link>
          </div>
        </div>

        {/* Voice Agent Overlay */}
        <VoiceAgent isOpen={voiceOpen} onClose={() => setVoiceOpen(false)} />
      </main>
    </div>
  );
}
