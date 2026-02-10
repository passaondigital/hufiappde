import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Heart,
  MessageCircle,
  FileText,
  Calendar,
  Users,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import huufiLogo from "@/assets/huufi-logo.png";

const navItems = [
  { path: "/app", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/app/pferde", icon: Heart, label: "Pferde" },
  { path: "/app/chat", icon: MessageCircle, label: "Assistent" },
  { path: "/app/notizen", icon: FileText, label: "Notizen" },
  { path: "/app/termine", icon: Calendar, label: "Termine" },
  { path: "/app/kunden", icon: Users, label: "Kunden" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 md:relative md:z-auto
          flex flex-col h-full bg-sidebar text-sidebar-foreground
          transition-all duration-300 ease-in-out
          ${collapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
          <img src={huufiLogo} alt="HuufiApp" className="h-10 w-10 rounded-lg object-contain" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "sans-serif" }}>
              HuufiApp
            </span>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.path === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }
                  ${collapsed ? "justify-center" : ""}
                `}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center justify-center py-4 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden text-foreground/60 hover:text-foreground"
          >
            <Menu size={22} />
          </button>
          <h1 className="text-lg font-semibold" style={{ fontFamily: "Georgia, serif" }}>
            {navItems.find((n) =>
              n.path === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(n.path)
            )?.label || "HuufiApp"}
          </h1>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
