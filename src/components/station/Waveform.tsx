"use client";

import { useEffect, useRef } from "react";
import { useStation } from "@/lib/station-store";
import { SIGNALS } from "@/data/projects";

/** Живая осциллограмма эфира в шапке станции. Взрывается при настройке. */
export default function Waveform() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const unSubAccent = useStation.subscribe((s) => {
      const accent = s.channel === 0 ? "#c084fc" : SIGNALS[s.channel - 1].accent;
      currentColor = accent;
    });
    let currentColor = "#c084fc";

    const clock = { t: 0 };
    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!running || w === 0) return;
      const { tuning } = useStation.getState();
      clock.t += reduced ? 0.008 : tuning ? 0.09 : 0.026;

      ctx.clearRect(0, 0, w, h);

      const amp = tuning ? 0.85 : reduced ? 0.3 : 0.42;
      const mid = h / 2;

      // три наложенных волны
      const waves = [
        { f: 0.028, a: 0.6, ph: 0, alpha: 0.9 },
        { f: 0.051, a: 0.35, ph: 2.1, alpha: 0.45 },
        { f: 0.093, a: 0.18, ph: 4.4, alpha: 0.3 },
      ];
      for (const wave of waves) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y =
            mid +
            Math.sin(x * wave.f + clock.t * (tuning ? 5 : 2) + wave.ph) *
              wave.a *
              amp *
              mid *
              (0.7 + 0.3 * Math.sin(x * 0.01 + clock.t));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = currentColor;
        ctx.globalAlpha = wave.alpha;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      unSubAccent();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="h-6 w-full"
    />
  );
}
