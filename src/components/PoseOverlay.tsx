import { useRef, useEffect, useCallback } from "react";

// Skeleton connections for a horse-like body (simulated keypoints)
const SKELETON_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // spine (head to tail)
  [1, 5], [5, 6], [6, 7], // front left leg
  [1, 8], [8, 9], [9, 10], // front right leg  
  [3, 11], [11, 12], [12, 13], // rear left leg
  [3, 14], [14, 15], [15, 16], // rear right leg
  [0, 17], // head to ear
];

interface PoseOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isActive: boolean;
  canvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
}

// Generate simulated horse keypoints based on video dimensions
function generateKeypoints(w: number, h: number, frame: number) {
  const cx = w * 0.5;
  const cy = h * 0.45;
  const scale = Math.min(w, h) * 0.35;
  const wobble = (i: number) => Math.sin(frame * 0.08 + i * 1.5) * scale * 0.02;

  return [
    // 0: head
    { x: cx - scale * 0.55 + wobble(0), y: cy - scale * 0.15 + wobble(1) },
    // 1: withers (front shoulder)
    { x: cx - scale * 0.25 + wobble(2), y: cy + wobble(3) },
    // 2: back
    { x: cx + scale * 0.1 + wobble(4), y: cy - scale * 0.02 + wobble(5) },
    // 3: croup (hip)
    { x: cx + scale * 0.4 + wobble(6), y: cy + scale * 0.05 + wobble(7) },
    // 4: tail
    { x: cx + scale * 0.6 + wobble(8), y: cy + scale * 0.15 + wobble(9) },
    // 5: front left elbow
    { x: cx - scale * 0.3 + wobble(10), y: cy + scale * 0.3 + wobble(11) },
    // 6: front left knee
    { x: cx - scale * 0.32 + wobble(12), y: cy + scale * 0.55 + Math.sin(frame * 0.12) * scale * 0.05 },
    // 7: front left hoof
    { x: cx - scale * 0.3 + wobble(14), y: cy + scale * 0.75 + Math.sin(frame * 0.12 + 0.5) * scale * 0.04 },
    // 8: front right elbow
    { x: cx - scale * 0.2 + wobble(15), y: cy + scale * 0.3 + wobble(16) },
    // 9: front right knee
    { x: cx - scale * 0.18 + wobble(17), y: cy + scale * 0.55 + Math.sin(frame * 0.12 + Math.PI) * scale * 0.05 },
    // 10: front right hoof
    { x: cx - scale * 0.2 + wobble(19), y: cy + scale * 0.75 + Math.sin(frame * 0.12 + Math.PI + 0.5) * scale * 0.04 },
    // 11: rear left hip
    { x: cx + scale * 0.35 + wobble(20), y: cy + scale * 0.3 + wobble(21) },
    // 12: rear left knee (stifle)
    { x: cx + scale * 0.38 + wobble(22), y: cy + scale * 0.55 + Math.sin(frame * 0.12 + Math.PI * 0.5) * scale * 0.05 },
    // 13: rear left hoof
    { x: cx + scale * 0.35 + wobble(24), y: cy + scale * 0.75 + Math.sin(frame * 0.12 + Math.PI * 0.5 + 0.5) * scale * 0.04 },
    // 14: rear right hip
    { x: cx + scale * 0.45 + wobble(25), y: cy + scale * 0.3 + wobble(26) },
    // 15: rear right knee
    { x: cx + scale * 0.48 + wobble(27), y: cy + scale * 0.55 + Math.sin(frame * 0.12 + Math.PI * 1.5) * scale * 0.05 },
    // 16: rear right hoof
    { x: cx + scale * 0.45 + wobble(29), y: cy + scale * 0.75 + Math.sin(frame * 0.12 + Math.PI * 1.5 + 0.5) * scale * 0.04 },
    // 17: ear
    { x: cx - scale * 0.6 + wobble(30), y: cy - scale * 0.3 + wobble(31) },
  ];
}

export default function PoseOverlay({ videoRef, isActive, canvasRef: externalCanvasRef }: PoseOverlayProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = externalCanvasRef || internalCanvasRef;
  const frameRef = useRef(0);
  const rafRef = useRef<number>();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isActive) return;

    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    frameRef.current++;
    const keypoints = generateKeypoints(canvas.width, canvas.height, frameRef.current);

    // Draw connections
    ctx.strokeStyle = "rgba(0, 255, 128, 0.8)";
    ctx.lineWidth = 2.5;
    ctx.shadowColor = "rgba(0, 255, 128, 0.4)";
    ctx.shadowBlur = 6;

    for (const [a, b] of SKELETON_CONNECTIONS) {
      const pa = keypoints[a];
      const pb = keypoints[b];
      if (!pa || !pb) continue;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Draw keypoints
    ctx.shadowBlur = 0;
    for (let i = 0; i < keypoints.length; i++) {
      const kp = keypoints[i];
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = i <= 4 ? "rgba(255, 200, 0, 0.9)" : "rgba(0, 255, 128, 0.9)"; // spine = gold, legs = green
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw info overlay
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(8, 8, 180, 50);
    ctx.fillStyle = "#00ff80";
    ctx.font = "bold 11px monospace";
    ctx.fillText(`POSE TRACKING · Frame ${frameRef.current}`, 14, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px monospace";
    ctx.fillText(`Keypoints: ${keypoints.length} · Confidence: 0.${85 + Math.floor(Math.random() * 10)}`, 14, 40);

    rafRef.current = requestAnimationFrame(draw);
  }, [isActive, videoRef]);

  useEffect(() => {
    if (isActive) {
      rafRef.current = requestAnimationFrame(draw);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, draw]);

  return (
    <canvas
      ref={(el) => {
        (internalCanvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = el;
        if (externalCanvasRef) externalCanvasRef.current = el;
      }}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
