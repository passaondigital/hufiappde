import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface QrScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let animFrame: number;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scan();
        }
      } catch {
        setError("Kamera-Zugriff verweigert");
      }
    };

    const scan = () => {
      if (!active) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animFrame = requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0);

      // Use BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        detector.detect(canvas).then((barcodes: any[]) => {
          if (barcodes.length > 0) {
            onScan(barcodes[0].rawValue);
            return;
          }
          animFrame = requestAnimationFrame(scan);
        }).catch(() => {
          animFrame = requestAnimationFrame(scan);
        });
      } else {
        // Fallback: try every 500ms with ImageData
        animFrame = requestAnimationFrame(scan);
      }
    };

    start();
    return () => {
      active = false;
      cancelAnimationFrame(animFrame);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        <button onClick={onClose} className="absolute -top-12 right-0 p-2 rounded-lg bg-card border border-border text-foreground hover:bg-secondary transition-colors">
          <X size={20} />
        </button>
        {error ? (
          <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-3">
            <Camera size={32} className="text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen.</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-border">
            <video ref={videoRef} className="w-full aspect-square object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {/* Scanner overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-primary rounded-2xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary/50 animate-pulse" />
              </div>
            </div>
          </div>
        )}
        <p className="text-center text-xs text-muted-foreground mt-3">QR-Code in den Rahmen halten</p>
      </div>
    </div>
  );
}
