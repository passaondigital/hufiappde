import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, UserCheck, UserX, QrCode, Link2, Share2, Copy, Check, Search, X, Heart, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import QRCode from "qrcode";

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  profile?: { display_name: string | null; connect_code: string | null };
}

interface SharedHorse {
  id: string;
  horse_id: string;
  horses?: { name: string; breed: string | null; image_url: string | null };
}

export default function HuufiConnect() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"connections" | "qr" | "share">("connections");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Connection[]>([]);
  const [myCode, setMyCode] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [myHorses, setMyHorses] = useState<{ id: string; name: string }[]>([]);
  const [sharedHorses, setSharedHorses] = useState<SharedHorse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);

  // Auto-fill from QR code URL param
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setSearchCode(code.toUpperCase());
      setActiveTab("connections");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    const [profileRes, connectionsRes, pendingRes, horsesRes, sharedRes] = await Promise.all([
      supabase.from("profiles").select("connect_code, referral_code").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_connections").select("*").or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`).eq("status", "accepted"),
      supabase.from("user_connections").select("*").eq("receiver_id", user.id).eq("status", "pending"),
      supabase.from("horses").select("id, name").eq("user_id", user.id),
      supabase.from("shared_horses").select("*, horses(name, breed, image_url)").eq("shared_with_id", user.id),
    ]);

    const code = profileRes.data?.connect_code || "";
    setMyCode(code);
    setReferralCode(profileRes.data?.referral_code || "");
    setMyHorses(horsesRes.data || []);
    setSharedHorses((sharedRes.data || []) as SharedHorse[]);

    // Generate QR
    if (code) {
      const url = `${window.location.origin}/app/connect?code=${code}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      setQrDataUrl(dataUrl);
    }

    // Enrich connections with profile data
    const allConnections = connectionsRes.data || [];
    const enriched = await Promise.all(allConnections.map(async (c) => {
      const otherId = c.requester_id === user.id ? c.receiver_id : c.requester_id;
      const { data: p } = await supabase.from("profiles").select("display_name, connect_code").eq("user_id", otherId).maybeSingle();
      return { ...c, profile: p || { display_name: null, connect_code: null } };
    }));
    setConnections(enriched);

    const enrichedPending = await Promise.all((pendingRes.data || []).map(async (c) => {
      const { data: p } = await supabase.from("profiles").select("display_name, connect_code").eq("user_id", c.requester_id).maybeSingle();
      return { ...c, profile: p || { display_name: null, connect_code: null } };
    }));
    setPendingReceived(enrichedPending);
    setLoading(false);
  };

  const sendRequest = async () => {
    if (!searchCode.trim() || !user) return;
    // Find user by connect code
    const { data: target } = await supabase.from("profiles").select("user_id").eq("connect_code", searchCode.toUpperCase().trim()).maybeSingle();
    if (!target) { toast.error("Kein Nutzer mit diesem Code gefunden"); return; }
    if (target.user_id === user.id) { toast.error("Das ist dein eigener Code!"); return; }

    const { error } = await supabase.from("user_connections").insert({
      requester_id: user.id,
      receiver_id: target.user_id,
    });
    if (error) {
      if (error.code === "23505") toast.error("Verbindungsanfrage existiert bereits");
      else toast.error("Fehler: " + error.message);
      return;
    }
    toast.success("Verbindungsanfrage gesendet!");
    setSearchCode("");
    fetchData();
  };

  const respondToRequest = async (id: string, accept: boolean) => {
    if (accept) {
      await supabase.from("user_connections").update({ status: "accepted" }).eq("id", id);
      toast.success("Verbindung angenommen!");
    } else {
      await supabase.from("user_connections").delete().eq("id", id);
      toast.info("Anfrage abgelehnt");
    }
    fetchData();
  };

  const removeConnection = async (id: string) => {
    await supabase.from("user_connections").delete().eq("id", id);
    toast.success("Verbindung entfernt");
    fetchData();
  };

  const shareHorse = async (horseId: string, connectionId: string) => {
    const conn = connections.find(c => c.id === connectionId);
    if (!conn || !user) return;
    const otherId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id;
    
    const { error } = await supabase.from("shared_horses").insert({
      owner_id: user.id,
      horse_id: horseId,
      shared_with_id: otherId,
    });
    if (error) {
      if (error.code === "23505") toast.info("Bereits geteilt");
      else toast.error("Fehler");
      return;
    }
    toast.success("Pferd geteilt!");
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    const url = `${window.location.origin}/auth?ref=${referralCode}`;
    if (navigator.share) {
      await navigator.share({ title: "HuufiApp", text: "Probiere HuufiApp aus – die App für dein Pferd!", url });
    } else {
      copyToClipboard(url);
    }
  };

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Users size={24} className="text-primary" />
        <h2 className="text-2xl font-bold text-foreground">HuufiConnect</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-secondary/30 overflow-x-auto">
        {[
          { key: "connections" as const, label: "Verbindungen", icon: Users },
          { key: "qr" as const, label: "QR-Code", icon: QrCode },
          { key: "share" as const, label: "Empfehlen", icon: Share2 },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${activeTab === tab.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Connections Tab */}
      {activeTab === "connections" && (
        <div className="space-y-4">
          {/* Search / Connect */}
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Nutzer verbinden</h3>
            <p className="text-xs text-muted-foreground">Gib den Connect-Code eines anderen Nutzers ein, um eine Verbindung herzustellen.</p>
            <div className="flex gap-2">
              <input value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Connect-Code eingeben (z.B. A1B2C3D4)"
                className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider"
                maxLength={8} onKeyDown={(e) => e.key === "Enter" && sendRequest()} />
              <button onClick={sendRequest} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          {/* Pending Requests */}
          {pendingReceived.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Offene Anfragen</h3>
              {pendingReceived.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <UserPlus size={18} className="text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{c.profile?.display_name || "Unbekannt"}</p>
                    <p className="text-xs text-muted-foreground">Möchte sich mit dir verbinden</p>
                  </div>
                  <button onClick={() => respondToRequest(c.id, true)} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"><UserCheck size={18} /></button>
                  <button onClick={() => respondToRequest(c.id, false)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><UserX size={18} /></button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Active Connections */}
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Deine Verbindungen ({connections.length})</h3>
            {connections.map(c => (
              <div key={c.id} className="p-4 rounded-xl bg-card border border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserCheck size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{c.profile?.display_name || "Unbekannt"}</p>
                    <p className="text-xs text-muted-foreground">Verbunden seit {new Date(c.created_at).toLocaleDateString("de-DE")}</p>
                  </div>
                  <button onClick={() => setSelectedConnection(selectedConnection === c.id ? null : c.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronRight size={16} className={`transition-transform ${selectedConnection === c.id ? "rotate-90" : ""}`} />
                  </button>
                </div>
                <AnimatePresence>
                  {selectedConnection === c.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 pt-3 border-t border-border space-y-3">
                      {/* Share horses */}
                      {myHorses.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Pferd teilen:</p>
                          <div className="flex flex-wrap gap-2">
                            {myHorses.map(h => (
                              <button key={h.id} onClick={() => shareHorse(h.id, c.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80 transition-colors">
                                <Heart size={12} /> {h.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <button onClick={() => removeConnection(c.id)}
                        className="text-xs text-destructive hover:underline">Verbindung entfernen</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
            {connections.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Verbindungen. Teile deinen Code!</p>}
          </div>

          {/* Shared with me */}
          {sharedHorses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Mit dir geteilte Pferde</h3>
              {sharedHorses.map(sh => (
                <div key={sh.id} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
                  {sh.horses?.image_url ? (
                    <img src={sh.horses.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Heart size={16} className="text-primary" /></div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{sh.horses?.name || "–"}</p>
                    <p className="text-xs text-muted-foreground">{sh.horses?.breed || ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* QR Code Tab */}
      {activeTab === "qr" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
            <h3 className="font-semibold text-foreground">Dein Connect QR-Code</h3>
            <p className="text-xs text-muted-foreground">Andere Nutzer können diesen Code scannen, um sich mit dir zu verbinden.</p>
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded-xl border border-border" />
              </div>
            )}
            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-lg font-bold tracking-[0.2em] text-foreground">{myCode}</span>
              <button onClick={() => copyToClipboard(myCode)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* QR Scanner */}
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Code manuell eingeben</h3>
            <p className="text-xs text-muted-foreground">Gib den 8-stelligen Connect-Code eines anderen Nutzers ein.</p>
            <div className="flex gap-2">
              <input value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4" maxLength={8}
                className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={sendRequest} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Verbinden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share/Referral Tab */}
      {activeTab === "share" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
            <Share2 size={32} className="text-primary mx-auto" />
            <h3 className="font-semibold text-foreground">HuufiApp empfehlen</h3>
            <p className="text-sm text-muted-foreground">Teile deinen persönlichen Empfehlungslink mit Freunden und Stallkollegen.</p>
            
            <div className="p-3 rounded-lg bg-secondary/20 text-xs text-muted-foreground break-all font-mono">
              {window.location.origin}/auth?ref={referralCode}
            </div>
            
            <div className="flex gap-3 justify-center">
              <button onClick={shareLink}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <Share2 size={16} /> Teilen
              </button>
              <button onClick={() => copyToClipboard(`${window.location.origin}/auth?ref=${referralCode}`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                <Copy size={16} /> Link kopieren
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
            <p className="text-xs text-muted-foreground text-center">
              Dein Referral-Code: <span className="font-mono font-bold text-foreground">{referralCode}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
