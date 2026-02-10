import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Users, UserPlus, UserCheck, UserX, QrCode, Share2, Copy, Check, Heart, ChevronRight, MessageCircle, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import QRCode from "qrcode";
import DirectChat from "@/components/DirectChat";
import QrScanner from "@/components/QrScanner";

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
  const [chatTarget, setChatTarget] = useState<{ connectionId: string; userId: string; name: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) { setSearchCode(code.toUpperCase()); setActiveTab("connections"); }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  // Realtime for new messages (unread badge + push notification)
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("dm-unread")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, async (payload) => {
        const msg = payload.new as any;
        if (msg.receiver_id === user.id && !msg.read) {
          setUnreadCounts(prev => ({ ...prev, [msg.sender_id]: (prev[msg.sender_id] || 0) + 1 }));
          // Send browser notification if not currently viewing that chat
          if (Notification.permission === "granted" && chatTarget?.userId !== msg.sender_id) {
            // Fetch sender name
            const { data: senderProfile } = await supabase.from("profiles").select("display_name").eq("user_id", msg.sender_id).maybeSingle();
            const senderName = senderProfile?.display_name || "Jemand";
            new Notification(`Neue Nachricht von ${senderName}`, {
              body: msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content,
              icon: "/favicon.ico",
              tag: `dm-${msg.sender_id}`,
            });
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, chatTarget]);

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

    if (code) {
      const url = `${window.location.origin}/app/connect?code=${code}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 256, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
      setQrDataUrl(dataUrl);
    }

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

    // Load unread counts
    const otherIds = allConnections.map(c => c.requester_id === user.id ? c.receiver_id : c.requester_id);
    if (otherIds.length > 0) {
      const { data: unread } = await supabase.from("direct_messages").select("sender_id").eq("receiver_id", user.id).eq("read", false).in("sender_id", otherIds);
      const counts: Record<string, number> = {};
      (unread || []).forEach(m => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
      setUnreadCounts(counts);
    }

    setLoading(false);
  };

  const sendRequest = async () => {
    if (!searchCode.trim() || !user) return;
    const { data: target } = await supabase.from("profiles").select("user_id").eq("connect_code", searchCode.toUpperCase().trim()).maybeSingle();
    if (!target) { toast.error("Kein Nutzer mit diesem Code gefunden"); return; }
    if (target.user_id === user.id) { toast.error("Das ist dein eigener Code!"); return; }
    const { error } = await supabase.from("user_connections").insert({ requester_id: user.id, receiver_id: target.user_id });
    if (error) { toast.error(error.code === "23505" ? "Verbindungsanfrage existiert bereits" : error.message); return; }
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
    const { error } = await supabase.from("shared_horses").insert({ owner_id: user.id, horse_id: horseId, shared_with_id: otherId });
    if (error) { toast.error(error.code === "23505" ? "Bereits geteilt" : "Fehler"); return; }
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
      await navigator.share({ title: "HuufiApp", text: "Probiere HuufiApp aus!", url });
    } else {
      copyToClipboard(url);
    }
  };

  const handleQrScan = (result: string) => {
    setShowScanner(false);
    try {
      const url = new URL(result);
      const code = url.searchParams.get("code");
      if (code) { setSearchCode(code.toUpperCase()); setActiveTab("connections"); toast.success("Code erkannt: " + code.toUpperCase()); }
      else { toast.error("Kein Connect-Code im QR-Code gefunden"); }
    } catch {
      // Maybe it's just a code string
      if (result.length === 8) { setSearchCode(result.toUpperCase()); setActiveTab("connections"); }
      else { toast.error("Ungueltiger QR-Code"); }
    }
  };

  const openChat = (conn: Connection) => {
    if (!user) return;
    const otherId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id;
    setChatTarget({ connectionId: conn.id, userId: otherId, name: conn.profile?.display_name || "Unbekannt" });
    setUnreadCounts(prev => { const n = { ...prev }; delete n[otherId]; return n; });
  };

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  // Show chat if active
  if (chatTarget) {
    return (
      <div className="max-w-3xl mx-auto">
        <DirectChat connectionId={chatTarget.connectionId} otherUserId={chatTarget.userId} otherName={chatTarget.name} onBack={() => setChatTarget(null)} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {showScanner && <QrScanner onScan={handleQrScan} onClose={() => setShowScanner(false)} />}

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
          <div className="p-4 rounded-xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Nutzer verbinden</h3>
            <p className="text-xs text-muted-foreground">Gib den Connect-Code ein oder scanne einen QR-Code.</p>
            <div className="flex gap-2">
              <input value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3D4" maxLength={8}
                className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono tracking-wider"
                onKeyDown={(e) => e.key === "Enter" && sendRequest()} />
              <button onClick={() => setShowScanner(true)} className="px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                <Camera size={16} />
              </button>
              <button onClick={sendRequest} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                <UserPlus size={16} />
              </button>
            </div>
          </div>

          {pendingReceived.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground text-sm">Offene Anfragen</h3>
              {pendingReceived.map(c => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <UserPlus size={18} className="text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{c.profile?.display_name || "Unbekannt"}</p>
                    <p className="text-xs text-muted-foreground">Moechte sich mit dir verbinden</p>
                  </div>
                  <button onClick={() => respondToRequest(c.id, true)} className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"><UserCheck size={18} /></button>
                  <button onClick={() => respondToRequest(c.id, false)} className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"><UserX size={18} /></button>
                </motion.div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-sm">Deine Verbindungen ({connections.length})</h3>
            {connections.map(c => {
              const otherId = c.requester_id === user?.id ? c.receiver_id : c.requester_id;
              const unread = unreadCounts[otherId] || 0;
              return (
                <div key={c.id} className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck size={18} className="text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{c.profile?.display_name || "Unbekannt"}</p>
                      <p className="text-xs text-muted-foreground">Verbunden seit {new Date(c.created_at).toLocaleDateString("de-DE")}</p>
                    </div>
                    <button onClick={() => openChat(c)} className="relative p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors">
                      <MessageCircle size={18} />
                      {unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">{unread}</span>
                      )}
                    </button>
                    <button onClick={() => setSelectedConnection(selectedConnection === c.id ? null : c.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronRight size={16} className={`transition-transform ${selectedConnection === c.id ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {selectedConnection === c.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-border space-y-3">
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
                        <button onClick={() => removeConnection(c.id)} className="text-xs text-destructive hover:underline">Verbindung entfernen</button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {connections.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Verbindungen. Teile deinen Code!</p>}
          </div>

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
                    <p className="text-sm font-medium text-foreground">{sh.horses?.name || "\u2013"}</p>
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
            <p className="text-xs text-muted-foreground">Andere Nutzer koennen diesen Code scannen, um sich mit dir zu verbinden.</p>
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

          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">QR-Code scannen</h3>
            <p className="text-xs text-muted-foreground">Scanne den QR-Code eines anderen Nutzers mit der Kamera.</p>
            <button onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Camera size={18} /> Kamera oeffnen
            </button>
          </div>

          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="font-semibold text-foreground text-sm">Code manuell eingeben</h3>
            <div className="flex gap-2">
              <input value={searchCode} onChange={(e) => setSearchCode(e.target.value.toUpperCase())} placeholder="A1B2C3D4" maxLength={8}
                className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={sendRequest} className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">Verbinden</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Tab */}
      {activeTab === "share" && (
        <div className="space-y-4">
          <div className="p-6 rounded-xl bg-card border border-border text-center space-y-4">
            <Share2 size={32} className="text-primary mx-auto" />
            <h3 className="font-semibold text-foreground">HuufiApp empfehlen</h3>
            <p className="text-sm text-muted-foreground">Teile deinen persoenlichen Empfehlungslink.</p>
            <div className="p-3 rounded-lg bg-secondary/20 text-xs text-muted-foreground break-all font-mono">
              {window.location.origin}/auth?ref={referralCode}
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={shareLink} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
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
