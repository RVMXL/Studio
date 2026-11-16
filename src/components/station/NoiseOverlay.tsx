"use client";

import { useEffect, useRef } from "react";
import { useStation } from "@/lib/station-store";

/**
 * Захват сигнала: на 600 мс экран заливает анимированный шум
 * (как при перенастройке старого приёмника) — это переход между каналами.
 */
export default function NoiseOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tuning = useStation((s) => s.tuning);

  useEffect(() => {
    if (!tuning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const DURATION = reduced ? 120 : 600;
    const start = performance.now();
    let raf = 0;

    const draw = () => {
      const now = performance.now();
      const p = Math.min(1, (now - start) / DURATION);
      const alpha = Math.pow(1 - p, 1.4);

      ctx.clearRect(0, 0, w, h);

      // зернистость
      const grains = Math.floor(1400 * (1 - p * 0.6));
      for (let i = 0; i < grains; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const gw = 1 + Math.random() * 2.5;
        const gh = 1 + Math.random() * 8;
        const violet = Math.random() > 0.35;
        ctx.fillStyle = violet
          ? `rgba(${180 + Math.random() * 60 | 0}, ${120 + Math.random() * 60 | 0}, 255, ${alpha * (0.12 + Math.random() * 0.3)})`
          : `rgba(236, 230, 250, ${alpha * (0.08 + Math.random() * 0.22)})`;
        ctx.fillRect(x, y, gw, gh);
      }

      // горизонтальные разрывы
      const tears = 2 + Math.floor(Math.random() * 4);
      for (let i = 0; i < tears; i++) {
        const y = Math.random() * h;
        const th = 1 + Math.random() * 3;
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.28})`;
        ctx.fillRect(0, y, w, th);
        if (Math.random() > 0.6) {
          ctx.fillStyle = `rgba(232, 121, 249, ${alpha * 0.2})`;
          ctx.fillRect(Math.random() * w * 0.6, y, w * 0.4, th * 2);
        }
      }

      if (p < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, w, h);
        useStation.setState({ tuning: false });
      }
    };
    raf = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(raf);
  }, [tuning]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 70 }}
    />
  );
}
