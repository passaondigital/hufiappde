import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ImageUploadProps {
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  folder?: string;
  className?: string;
}

export default function ImageUpload({ currentUrl, onUpload, folder = "general", className = "" }: ImageUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Datei zu groß (max. 5 MB)");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Nur Bilder erlaubt");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error("Upload fehlgeschlagen");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);
    setPreview(urlData.publicUrl);
    onUpload(urlData.publicUrl);
    setUploading(false);
    toast.success("Bild hochgeladen");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const removeImage = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {preview ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-secondary">
          <img src={preview} alt="Vorschau" className="w-full h-full object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors text-sm"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Lade hoch..." : "Bild wählen"}
          </button>
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors text-sm"
          >
            <Camera size={16} />
            <span className="hidden sm:inline">Kamera</span>
          </button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
