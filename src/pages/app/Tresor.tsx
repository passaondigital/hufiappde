import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Upload, FileText, Trash2, Download, FolderOpen, Eye, EyeOff, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function Tresor() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [horses, setHorses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("");
  const [webauthnSupported, setWebauthnSupported] = useState(false);
  const [hasWebauthn, setHasWebauthn] = useState(false);

  const CATEGORIES = [
    { value: "allgemein", label: "Allgemein" },
    { value: "equidenpass", label: "Equidenpass" },
    { value: "impfpass", label: "Impfpass" },
    { value: "roentgen", label: "Röntgenbilder" },
    { value: "rechnung", label: "Rechnungen" },
    { value: "vertrag", label: "Verträge" },
  ];

  useEffect(() => {
    if (!user) return;
    // Check WebAuthn support
    setWebauthnSupported(!!window.PublicKeyCredential);
    // Check if vault password is set
    supabase.from("profiles").select("vault_password_hash, webauthn_credential_id").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setHasPassword(!!data?.vault_password_hash);
      setHasWebauthn(!!data?.webauthn_credential_id);
      setLoading(false);
    });
    supabase.from("horses").select("id, name").eq("user_id", user.id).then(({ data }) => setHorses(data || []));
  }, [user]);

  // Simple hash for vault password (client-side, not crypto-secure but sufficient for vault unlock)
  const hashPassword = async (pw: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pw + user?.id);
    const hash = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const setupPassword = async () => {
    if (!newPassword || newPassword.length < 4) { toast.error("Mindestens 4 Zeichen"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwörter stimmen nicht überein"); return; }
    const hash = await hashPassword(newPassword);
    const { error } = await supabase.from("profiles").update({ vault_password_hash: hash }).eq("user_id", user!.id);
    if (error) { toast.error("Fehler"); return; }
    setHasPassword(true);
    setUnlocked(true);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Tresor-Passwort eingerichtet!");
    fetchDocuments();
  };

  const unlock = async () => {
    if (!password) return;
    const hash = await hashPassword(password);
    const { data } = await supabase.from("profiles").select("vault_password_hash").eq("user_id", user!.id).maybeSingle();
    if (data?.vault_password_hash === hash) {
      setUnlocked(true);
      setPassword("");
      fetchDocuments();
    } else {
      toast.error("Falsches Passwort");
    }
  };

  // WebAuthn: Register biometric
  const registerWebauthn = async () => {
    if (!user) return;
    try {
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "HuufiApp", id: window.location.hostname },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email || "user",
            displayName: "HuufiApp Tresor",
          },
          pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
          authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
          timeout: 60000,
        },
      }) as PublicKeyCredential | null;

      if (credential) {
        const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        await supabase.from("profiles").update({ webauthn_credential_id: credId }).eq("user_id", user.id);
        setHasWebauthn(true);
        toast.success("Fingerabdruck/Face ID eingerichtet!");
      }
    } catch (err: any) {
      toast.error("Biometrie konnte nicht eingerichtet werden: " + (err.message || "Unbekannter Fehler"));
    }
  };

  // WebAuthn: Authenticate
  const authenticateWebauthn = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase.from("profiles").select("webauthn_credential_id").eq("user_id", user.id).maybeSingle();
      if (!profile?.webauthn_credential_id) return;

      const credIdBytes = Uint8Array.from(atob(profile.webauthn_credential_id), c => c.charCodeAt(0));
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: window.location.hostname,
          allowCredentials: [{ type: "public-key", id: credIdBytes }],
          userVerification: "required",
          timeout: 60000,
        },
      });

      if (assertion) {
        setUnlocked(true);
        fetchDocuments();
        toast.success("Verifiziert!");
      }
    } catch (err: any) {
      toast.error("Biometrische Verifizierung fehlgeschlagen");
    }
  };

  const fetchDocuments = async () => {
    if (!user) return;
    const { data } = await supabase.from("vault_documents").select("*, horses(name)").eq("user_id", user.id).order("created_at", { ascending: false });
    setDocuments(data || []);
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const path = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("vault").upload(path, file);
    if (uploadError) { toast.error("Upload fehlgeschlagen"); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("vault").getPublicUrl(path);

    await supabase.from("vault_documents").insert({
      user_id: user.id,
      name: file.name,
      file_url: path, // store path, not public URL (private bucket)
      file_type: file.type,
      file_size: file.size,
      category: filterCategory || "allgemein",
    });

    toast.success("Dokument gespeichert");
    setUploading(false);
    fetchDocuments();
  };

  const downloadFile = async (doc: any) => {
    const { data, error } = await supabase.storage.from("vault").download(doc.file_url);
    if (error || !data) { toast.error("Download fehlgeschlagen"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteDoc = async (doc: any) => {
    await supabase.storage.from("vault").remove([doc.file_url]);
    await supabase.from("vault_documents").delete().eq("id", doc.id);
    toast.success("Gelöscht");
    fetchDocuments();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const filtered = documents.filter(d => !filterCategory || d.category === filterCategory);

  if (loading) return <p className="text-muted-foreground">Laden...</p>;

  // Setup screen
  if (!hasPassword) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <Lock size={48} className="text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Dokumenten-Tresor einrichten</h2>
        <p className="text-sm text-muted-foreground">Schütze deine sensiblen Dokumente mit einem persönlichen Passwort.</p>
        <div className="space-y-3 text-left">
          <input type="password" placeholder="Passwort wählen (mind. 4 Zeichen)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input type="password" placeholder="Passwort bestätigen" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={setupPassword} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          Tresor aktivieren
        </button>
      </div>
    );
  }

  // Lock screen
  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-6">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
          <Lock size={48} className="text-primary mx-auto" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground">Tresor gesperrt</h2>
        <p className="text-sm text-muted-foreground">Gib dein Tresor-Passwort ein, um auf deine Dokumente zuzugreifen.</p>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Tresor-Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && unlock()}
            className="w-full px-4 py-2.5 pr-10 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          <button onClick={unlock} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Unlock size={14} className="inline mr-2" /> Entsperren
          </button>
          {hasWebauthn && webauthnSupported && (
            <button onClick={authenticateWebauthn} className="px-6 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
              <Fingerprint size={14} className="inline mr-2" /> Biometrie
            </button>
          )}
        </div>
        {webauthnSupported && !hasWebauthn && (
          <button onClick={registerWebauthn} className="text-xs text-primary hover:underline">
            Fingerabdruck/Face ID einrichten
          </button>
        )}
      </div>
    );
  }

  // Unlocked view
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <FolderOpen size={24} className="text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Dokumenten-Tresor</h2>
        </div>
        <div className="flex gap-2">
          <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer">
            <Upload size={16} /> Hochladen
            <input type="file" className="hidden" onChange={uploadFile} disabled={uploading} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
          </label>
          <button onClick={() => { setUnlocked(false); setDocuments([]); }}
            className="px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors">
            <Lock size={16} />
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setFilterCategory("")}
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${!filterCategory ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
          Alle
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilterCategory(filterCategory === c.value ? "" : c.value)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${filterCategory === c.value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}>
            {c.label}
          </button>
        ))}
      </div>

      {uploading && <p className="text-sm text-muted-foreground animate-pulse">Wird hochgeladen...</p>}

      <div className="space-y-3">
        {filtered.map((doc, i) => (
          <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{doc.name}</p>
              <p className="text-xs text-muted-foreground">
                {CATEGORIES.find(c => c.value === doc.category)?.label || "Allgemein"}
                {doc.horses?.name && ` · ${doc.horses.name}`}
                {doc.file_size && ` · ${formatSize(doc.file_size)}`}
              </p>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => downloadFile(doc)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Download size={16} />
              </button>
              <button onClick={() => deleteDoc(doc)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">Noch keine Dokumente im Tresor.</p>
        </div>
      )}
    </div>
  );
}
