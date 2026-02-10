import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import { Users, Bot, CreditCard, BarChart3, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  user_id: string;
  display_name: string | null;
  created_at: string;
  role: string;
  plan: string;
  is_active: boolean;
  ai_requests_today: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalHorses: 0, totalAiRequests: 0, premiumUsers: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
  }, [isAdmin]);

  const fetchData = async () => {
    // Fetch profiles
    const { data: profiles } = await supabase.from("profiles").select("*");
    // Fetch roles
    const { data: roles } = await supabase.from("user_roles").select("*");
    // Fetch subscriptions
    const { data: subs } = await supabase.from("user_subscriptions").select("*");
    // Fetch stats
    const { data: horses } = await supabase.from("horses").select("id");
    const { data: aiLogs } = await supabase.from("ai_usage_log").select("id");

    const userRows: UserRow[] = (profiles || []).map((p) => {
      const role = roles?.find((r) => r.user_id === p.user_id);
      const sub = subs?.find((s) => s.user_id === p.user_id);
      return {
        user_id: p.user_id,
        display_name: p.display_name,
        created_at: p.created_at,
        role: role?.role || "user",
        plan: sub?.plan || "free",
        is_active: sub?.is_active ?? true,
        ai_requests_today: sub?.ai_requests_today || 0,
      };
    });

    setUsers(userRows);
    setStats({
      totalUsers: userRows.length,
      totalHorses: horses?.length || 0,
      totalAiRequests: aiLogs?.length || 0,
      premiumUsers: userRows.filter((u) => u.plan === "premium").length,
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

  if (adminLoading) return <p className="text-muted-foreground p-6">Laden...</p>;
  if (!isAdmin) return <Navigate to="/app" replace />;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <Shield size={24} className="text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Admin Dashboard</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Nutzer gesamt", value: stats.totalUsers, icon: Users },
          { label: "Premium Nutzer", value: stats.premiumUsers, icon: CreditCard },
          { label: "Pferde gesamt", value: stats.totalHorses, icon: BarChart3 },
          { label: "KI-Anfragen gesamt", value: stats.totalAiRequests, icon: Bot },
        ].map((s) => (
          <div key={s.label} className="p-5 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <s.icon size={16} className="text-primary" />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Nutzerverwaltung</h3>
        </div>
        {loading ? (
          <p className="p-5 text-muted-foreground text-sm">Laden...</p>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.user_id}>
                <div
                  className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-destructive"}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.display_name || "Unbenannt"}</p>
                      <p className="text-xs text-muted-foreground">{u.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                      {u.role}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${u.plan === "premium" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {u.plan}
                    </span>
                    {expandedUser === u.user_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>
                {expandedUser === u.user_id && (
                  <div className="px-5 py-4 bg-secondary/10 border-t border-border space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-muted-foreground">Registriert</span>
                        <p className="text-foreground">{new Date(u.created_at).toLocaleDateString("de-DE")}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">KI heute</span>
                        <p className="text-foreground">{u.ai_requests_today}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status</span>
                        <p className="text-foreground">{u.is_active ? "Aktiv" : "Deaktiviert"}</p>
                      </div>
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
          </div>
        )}
      </div>
    </div>
  );
}
