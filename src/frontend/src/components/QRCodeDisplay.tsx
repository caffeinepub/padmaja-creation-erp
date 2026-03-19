import { useEffect, useRef } from "react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeDisplay({
  value,
  size = 200,
  className = "",
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!value) return;

    const renderQR = async () => {
      if (typeof window !== "undefined") {
        try {
          const QRCode = await import(
            "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js" as string
          ).catch(() => null);

          if (QRCode && canvasRef.current) {
            await (QRCode as any).toCanvas(canvasRef.current, value, {
              width: size,
              margin: 2,
              color: { dark: "#000000", light: "#FFFFFF" },
            });
            return;
          }
        } catch {
          // CDN import failed, use fallback
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = size;
        canvas.height = size;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, size, size);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, size - 8, size - 8);
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${Math.round(size / 14)}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const chars = value.split("");
        const maxChars = Math.floor((size - 40) / (size / 14));
        let line = "";
        const lines: string[] = [];
        for (const ch of chars) {
          if (line.length >= maxChars) {
            lines.push(line);
            line = ch;
          } else {
            line += ch;
          }
        }
        if (line) lines.push(line);
        const lineHeight = size / 12;
        const startY = size / 2 - ((lines.length - 1) * lineHeight) / 2;
        for (let i = 0; i < lines.length; i++) {
          ctx.fillText(lines[i], size / 2, startY + i * lineHeight);
        }
        ctx.font = `${Math.round(size / 16)}px sans-serif`;
        ctx.fillStyle = "#666666";
        ctx.fillText("QR Code", size / 2, size - 16);
      }
    };

    void renderQR();
  }, [value, size]);

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white p-2 rounded-lg shadow-lg">
        <canvas ref={canvasRef} width={size} height={size} className="block" />
      </div>
      <p className="text-xs font-mono text-muted-foreground text-center">
        {value}
      </p>
    </div>
  );
}
