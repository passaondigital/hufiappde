import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { Users, Bot, CreditCard, BarChart3, Shield, ChevronDown, ChevronUp, TrendingUp, MapPin, DollarSign, Cpu, Sparkles } from "lucide-react";
import { toast } from "sonner";
import LLMProviderManager from "@/components/admin/LLMProviderManager";
import FeatureManager from "@/components/admin/FeatureManager";

interface UserRow {
  user_id: string;
  display_name: string | null;
  email?: string;
  created_at: string;
  role: string;
  plan: string;
  is_active: boolean;
  ai_requests_today: number;
  location_name?: string | null;
}

interface AiUsageDay {
  date: string;
  count: number;
  tokens_in: number;
  tokens_out: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalHorses: 0, totalAiRequests: 0, premiumUsers: 0, totalTokensIn: 0, totalTokensOut: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "costs" | "regions" | "llm" | "features">("users");
  const [aiUsage, setAiUsage] = useState<AiUsageDay[]>([]);
  const [regions, setRegions] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    const [profilesRes, rolesRes, subsRes, horsesRes, aiLogsRes] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("user_subscriptions").select("*"),
      supabase.from("horses").select("id"),
      supabase.from("ai_usage_log").select("*").order("created_at", { ascending: false }),
    ]);

    const profiles = profilesRes.data || [];
    const roles = rolesRes.data || [];
    const subs = subsRes.data || [];
    const aiLogs = aiLogsRes.data || [];

    const userRows: UserRow[] = profiles.map((p) => {
      const role = roles.find((r) => r.user_id === p.user_id);
      const sub = subs.find((s) => s.user_id === p.user_id);
      return {
        user_id: p.user_id,
        display_name: p.display_name,
        created_at: p.created_at,
        role: role?.role || "user",
        plan: sub?.plan || "free",
        is_active: sub?.is_active ?? true,
        ai_requests_today: sub?.ai_requests_today || 0,
        location_name: (p as any).location_name || null,
      };
    });

    // Aggregate AI usage by day
    const usageMap = new Map<string, { count: number; tokens_in: number; tokens_out: number }>();
    aiLogs.forEach((log) => {
      const day = log.created_at.split("T")[0];
      const existing = usageMap.get(day) || { count: 0, tokens_in: 0, tokens_out: 0 };
      usageMap.set(day, {
        count: existing.count + 1,
        tokens_in: existing.tokens_in + (log.tokens_in || 0),
        tokens_out: existing.tokens_out + (log.tokens_out || 0),
      });
    });
    const usageDays = Array.from(usageMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    // Aggregate regions
    const regionMap = new Map<string, number>();
    profiles.forEach((p) => {
      const loc = (p as any).location_name || "Unbekannt";
      regionMap.set(loc, (regionMap.get(loc) || 0) + 1);
    });
    const regionList = Array.from(regionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const totalTokensIn = aiLogs.reduce((s, l) => s + (l.tokens_in || 0), 0);
    const totalTokensOut = aiLogs.reduce((s, l) => s + (l.tokens_out || 0), 0);

    setUsers(userRows);
    setAiUsage(usageDays);
    setRegions(regionList);
    setStats({
      totalUsers: userRows.length,
      totalHorses: horsesRes.data?.length || 0,
      totalAiRequests: aiLogs.length,
      premiumUsers: userRows.filter((u) => u.plan === "premium").length,
      totalTokensIn,
      totalTokensOut,
    });
    setLoading(false);
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    const { error } = await supabase.from("user_subscriptions").update({ is_active: !currentActive }).eq("user_id", userId);
    if (error) { toast.error("Fehler"); return; }
    toast.success(currentActive ? "Nutzer deaktiviert" : "Nutzer aktiviert");
    fetchData();
  };

  const changePlan = async (userId: string, newPlan: string) => {
    const { error } = await supabase.from("user_subscriptions").update({ plan: newPlan as "free" | "premium" }).eq("user_id", userId);
    if (error) { toast.error("Fehler"); return; }
    toast.success(`Plan auf ${newPlan} geändert`);
    fetchData();
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const { error } = await supabase.from("user_roles").update({ role: newRole }).eq("user_id", userId);
    if (error) { toast.error("Fehler"); return; }
    toast.success(`Rolle auf ${newRole} geändert`);
    fetchData();
  };

  // Estimated cost per 1M tokens (Gemini Flash)
  const COST_PER_M_IN = 0.10;
  const COST_PER_M_OUT = 0.40;
  const estimatedCost = ((stats.totalTokensIn / 1_000_000) * COST_PER_M_IN + (stats.totalTokensOut / 1_000_000) * COST_PER_M_OUT);

  if (adminLoading) return <p className="text-muted-foreground p-6">Laden...</p>;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-primary" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Admin Dashboard</h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Nutzer", value: stats.totalUsers, icon: Users },
          { label: "Premium", value: stats.premiumUsers, icon: CreditCard },
          { label: "Pferde", value: stats.totalHorses, icon: BarChart3 },
          { label: "KI-Anfragen", value: stats.totalAiRequests, icon: Bot },
          { label: "Tokens (Ein)", value: stats.totalTokensIn.toLocaleString("de-DE"), icon: TrendingUp },
          { label: "KI-Kosten (est.)", value: `€${estimatedCost.toFixed(2)}`, icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon size={14} className="text-primary" />
              <span className="text-[10px] text-muted-foreground truncate">{s.label}</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 overflow-x-auto">
        {[
          { key: "users" as const, label: "Nutzer", icon: Users },
          { key: "costs" as const, label: "KI-Kosten", icon: DollarSign },
          { key: "regions" as const, label: "Regionen", icon: MapPin },
          { key: "llm" as const, label: "LLM-APIs", icon: Cpu },
          { key: "features" as const, label: "Features", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-4 sm:px-5 py-3 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Nutzerverwaltung ({users.length})</h3>
          </div>
          {loading ? (
            <p className="p-5 text-muted-foreground text-sm">Laden...</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.user_id}>
                  <div
                    className="flex items-center justify-between px-4 sm:px-5 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.is_active ? "bg-green-500" : "bg-destructive"}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{u.display_name || "Unbenannt"}</p>
                        <p className="text-[10px] text-muted-foreground">{u.user_id.slice(0, 8)}…</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                        {u.role}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${u.plan === "premium" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                        {u.plan}
                      </span>
                      {expandedUser === u.user_id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </div>
                  </div>
                  {expandedUser === u.user_id && (
                    <div className="px-4 sm:px-5 py-4 bg-secondary/10 border-t border-border space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div><span className="text-muted-foreground">Registriert</span><p className="text-foreground">{new Date(u.created_at).toLocaleDateString("de-DE")}</p></div>
                        <div><span className="text-muted-foreground">KI heute</span><p className="text-foreground">{u.ai_requests_today}</p></div>
                        <div><span className="text-muted-foreground">Status</span><p className="text-foreground">{u.is_active ? "Aktiv" : "Deaktiviert"}</p></div>
                        {u.location_name && <div><span className="text-muted-foreground">Region</span><p className="text-foreground">{u.location_name}</p></div>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => toggleActive(u.user_id, u.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${u.is_active ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-green-500/10 text-green-600 hover:bg-green-500/20"} transition-colors`}>
                          {u.is_active ? "Deaktivieren" : "Aktivieren"}
                        </button>
                        <button onClick={() => changePlan(u.user_id, u.plan === "free" ? "premium" : "free")}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                          Plan → {u.plan === "free" ? "Premium" : "Free"}
                        </button>
                        <button onClick={() => toggleRole(u.user_id, u.role)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                          Rolle → {u.role === "admin" ? "User" : "Admin"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {users.length === 0 && <p className="p-5 text-sm text-muted-foreground">Keine Nutzer vorhanden</p>}
            </div>
          )}
        </div>
      )}

      {/* KI-Kosten Tab */}
      {activeTab === "costs" && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground text-sm mb-4">KI-Kosten Übersicht</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-secondary/20">
                <p className="text-xs text-muted-foreground">Geschätzte Gesamtkosten</p>
                <p className="text-2xl font-bold text-foreground">€{estimatedCost.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/20">
                <p className="text-xs text-muted-foreground">Input Tokens</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTokensIn.toLocaleString("de-DE")}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/20">
                <p className="text-xs text-muted-foreground">Output Tokens</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalTokensOut.toLocaleString("de-DE")}</p>
              </div>
            </div>
            <h4 className="text-xs text-muted-foreground mb-3 font-medium">Letzte 30 Tage</h4>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {aiUsage.length === 0 && <p className="text-sm text-muted-foreground">Noch keine KI-Nutzung</p>}
              {aiUsage.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/10 text-xs">
                  <span className="text-foreground font-medium">{new Date(day.date).toLocaleDateString("de-DE", { day: "numeric", month: "short" })}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{day.count} Anfragen</span>
                    <span className="text-muted-foreground">{(day.tokens_in + day.tokens_out).toLocaleString("de-DE")} Tokens</span>
                    <span className="text-foreground font-medium">
                      €{((day.tokens_in / 1_000_000) * COST_PER_M_IN + (day.tokens_out / 1_000_000) * COST_PER_M_OUT).toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Einnahmen (geschätzt)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">Premium-Nutzer</p>
                <p className="text-2xl font-bold text-foreground">{stats.premiumUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">× €9,99/Monat = €{(stats.premiumUsers * 9.99).toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/20">
                <p className="text-xs text-muted-foreground">Netto (Einnahmen − KI-Kosten)</p>
                <p className={`text-2xl font-bold ${(stats.premiumUsers * 9.99 - estimatedCost) >= 0 ? "text-green-600" : "text-destructive"}`}>
                  €{(stats.premiumUsers * 9.99 - estimatedCost).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regionen Tab */}
      {activeTab === "regions" && (
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">Regionale Nutzerverteilung</h3>
          </div>
          <div className="divide-y divide-border">
            {regions.length === 0 && <p className="p-5 text-sm text-muted-foreground">Keine Standortdaten vorhanden. Nutzer können ihren Standort in den Einstellungen freigeben.</p>}
            {regions.map((r) => (
              <div key={r.name} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-primary" />
                  <span className="text-sm text-foreground">{r.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (r.count / (stats.totalUsers || 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LLM-APIs Tab */}
      {activeTab === "llm" && (
        <div className="rounded-xl bg-card border border-border p-5">
          <LLMProviderManager />
        </div>
      )}

      {/* Features Tab */}
      {activeTab === "features" && (
        <div className="rounded-xl bg-card border border-border p-5">
          <FeatureManager />
        </div>
      )}
    </div>
  );
}
