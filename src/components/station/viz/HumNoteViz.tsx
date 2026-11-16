"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-01 HumNote: пианино-roll — ноты падают в кадр, снизу осциллограмма YIN.
 * ЭТО ЭКЗЕМПЛЯР: остальные визуализации повторяют этот контракт.
 */
export default function HumNoteViz({ accent }: VizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    interface Note {
      x: number;
      y: number;
      len: number;
      speed: number;
      hue: number;
      born: number;
    }
    const notes: Note[] = [];
    let raf = 0;
    let lastSpawn = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const spawnNote = (t: number) => {
      notes.push({
        x: 8 + Math.random() * Math.max(10, w - 16),
        y: -14,
        len: 16 + Math.random() * 46,
        speed: reduced ? 0.4 : 0.8 + Math.random() * 1.6,
        hue: Math.random(),
        born: t,
      });
      if (notes.length > 26) notes.shift();
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!running || w === 0) return;

      ctx.clearRect(0, 0, w, h);

      // линии нотного стана
      ctx.strokeStyle = "rgba(196,181,253,0.09)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = (h - 44) * (i / 5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // спавн нот
      if (t - lastSpawn > (reduced ? 500 : 240)) {
        lastSpawn = t;
        spawnNote(t);
      }

      // ноты
      for (const n of notes) {
        n.y += n.speed;
        const alpha = Math.min(1, (t - n.born) / 300);
        const fade = Math.max(0, 1 - Math.max(0, (n.y - (h - 60)) / 60));
        ctx.fillStyle = `rgba(${Math.round(232 - n.hue * 40)}, ${Math.round(121 + n.hue * 60)}, 249, ${alpha * fade * 0.85})`;
        const r = Math.min(3, n.len / 2);
        ctx.beginPath();
        ctx.roundRect(n.x, n.y, 5, n.len, r);
        ctx.fill();
        // головка ноты
        ctx.beginPath();
        ctx.arc(n.x + 2.5, n.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // осциллограмма YIN внизу
      const midY = h - 26;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y =
          midY +
          Math.sin(x * 0.06 + t * 0.004) * 7 * Math.sin(x * 0.013 + t * 0.0016) +
          Math.sin(x * 0.21 + t * 0.009) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // частотный ридер
      const hz = 196 + Math.round(Math.sin(t * 0.0011) * 40 + Math.sin(t * 0.0004) * 24);
      ctx.font = "9px monospace";
      ctx.fillStyle = "rgba(196,181,253,0.75)";
      ctx.fillText(`YIN: ${hz} Hz`, 8, h - 6);
      ctx.fillText("REC ●", w - 40, h - 6);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [accent]);

  return <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />;
}
