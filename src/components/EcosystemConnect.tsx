import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link2, ExternalLink, Check, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EcosystemApp {
  key: string;
  name: string;
  idPrefix: string;
  url: string;
  description: string;
  icon: string;
}

const ECOSYSTEM_APPS: EcosystemApp[] = [
  { key: "hufmanager", name: "HufManager", idPrefix: "#pid", url: "https://hufmanager.de", description: "Hufbearbeitung & Kundenverwaltung", icon: "🐴" },
  { key: "hufiai", name: "HufiAi", idPrefix: "#kid", url: "https://hufiai.lovable.app", description: "KI-gestützte Hufanalyse", icon: "🤖" },
  { key: "hufiapp", name: "HufiApp", idPrefix: "#eqid", url: "https://hufiapp.de", description: "Pferde- & Terminmanagement", icon: "📱" },
  { key: "memberhorse", name: "MemberHorse", idPrefix: "#mid", url: "https://memberhorse.de", description: "Community & Mitgliederverwaltung", icon: "🏇" },
];

interface EcosystemLink {
  id: string;
  app_key: string;
  external_id: string | null;
  status: string;
  data_sharing_enabled: boolean;
  connected_at: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    connected: { label: "Verbunden", className: "bg-primary/15 text-primary border-primary/30" },
    not_connected: { label: "Nicht verbunden", className: "bg-muted text-muted-foreground border-border" },
    update_required: { label: "Update nötig", className: "bg-accent/15 text-accent border-accent/30" },
  };
  const c = config[status] || config.not_connected;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${c.className}`}>
    {status === "connected" && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
    {status === "update_required" && <AlertCircle size={12} />}
    {c.label}
  </span>;
}

export default function EcosystemConnect() {
  const { user } = useAuth();
  const [links, setLinks] = useState<EcosystemLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchLinks();
  }, [user]);

  const fetchLinks = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("ecosystem_links")
      .select("*")
      .eq("user_id", user.id);
    setLinks((data as EcosystemLink[]) || []);
    setLoading(false);
  };

  const getLink = (appKey: string) => links.find((l) => l.app_key === appKey);

  const handleConnect = async (app: EcosystemApp) => {
    if (!user) return;
    setConnecting(app.key);
    
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("check-ecosystem", {
        body: { action: "connect", app_key: app.key, user_id: user.id },
      });

      if (fnError) throw fnError;

      if (fnData?.redirect_url) {
        window.open(fnData.redirect_url, "_blank");
      }

      // Upsert the link
      const { error } = await supabase
        .from("ecosystem_links")
        .upsert({
          user_id: user.id,
          app_key: app.key,
          status: fnData?.status || "connected",
          external_id: fnData?.external_id || null,
          connected_at: new Date().toISOString(),
        }, { onConflict: "user_id,app_key" });

      if (error) throw error;

      toast.success(`${app.name} erfolgreich verbunden!`);
      await fetchLinks();
    } catch (err: any) {
      toast.error(`Verbindung zu ${app.name} fehlgeschlagen`);
    } finally {
      setConnecting(null);
    }
  };

  const handleToggleSharing = async (app: EcosystemApp, enabled: boolean) => {
    if (!user) return;
    const { error } = await supabase
      .from("ecosystem_links")
      .update({ data_sharing_enabled: enabled })
      .eq("user_id", user.id)
      .eq("app_key", app.key);

    if (error) {
      toast.error("Fehler beim Aktualisieren");
      return;
    }
    toast.success(enabled ? `Datenaustausch mit ${app.name} aktiviert` : `Datenaustausch mit ${app.name} deaktiviert`);
    await fetchLinks();
  };

  const handleCheckStatus = async (app: EcosystemApp) => {
    if (!user) return;
    setConnecting(app.key);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("check-ecosystem", {
        body: { action: "status", app_key: app.key, user_id: user.id },
      });
      if (fnError) throw fnError;

      if (fnData?.status) {
        await supabase
          .from("ecosystem_links")
          .update({ status: fnData.status })
          .eq("user_id", user.id)
          .eq("app_key", app.key);
        await fetchLinks();
        toast.success(`Status von ${app.name} aktualisiert`);
      }
    } catch {
      toast.error("Status-Check fehlgeschlagen");
    } finally {
      setConnecting(null);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 space-y-4">
        <Link2 size={40} className="mx-auto text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">Ecosystem Connect</h3>
        <p className="text-sm text-muted-foreground">Bitte melde dich an, um deine Apps zu verbinden.</p>
        <Button variant="default" onClick={() => window.location.href = "/auth"}>Anmelden</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link2 size={24} className="text-primary" />
        <div>
          <h2 className="text-2xl font-bold text-foreground">Ecosystem Connect</h2>
          <p className="text-sm text-muted-foreground">Verbinde und verwalte deine Pascal Schmid Apps</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ECOSYSTEM_APPS.map((app, i) => {
          const link = getLink(app.key);
          const isConnected = link?.status === "connected";
          const isConnecting = connecting === app.key;

          return (
            <motion.div
              key={app.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5 space-y-4 hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{app.icon}</span>
                  <div>
                    <h3 className="font-semibold text-foreground">{app.name}</h3>
                    <p className="text-xs text-muted-foreground">{app.description}</p>
                  </div>
                </div>
                <StatusBadge status={link?.status || "not_connected"} />
              </div>

              {/* External ID */}
              {link?.external_id && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 text-xs">
                  <span className="text-muted-foreground">ID:</span>
                  <code className="font-mono text-foreground">{app.idPrefix}{link.external_id}</code>
                </div>
              )}

              {/* Data Sharing Toggle */}
              {isConnected && (
                <div className="flex items-center justify-between">
                  <label className="text-sm text-foreground">
                    Share <code className="text-xs font-mono text-primary">{app.idPrefix}</code> data
                  </label>
                  <Switch
                    checked={link?.data_sharing_enabled || false}
                    onCheckedChange={(v) => handleToggleSharing(app, v)}
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleCheckStatus(app)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                      <span className="ml-1.5">Status prüfen</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(app.url, "_blank")}
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleConnect(app)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                    <span className="ml-1.5">Verbinden</span>
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
