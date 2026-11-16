"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-0x DocRain (DocGen): падающие документы со срезанным углом,
 * редкие штампы «OK», слабая вертикальная сетка на фоне.
 */
export default function DocRainViz({ accent }: VizProps) {
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

    const DW = 26;
    const DH = 34;

    interface Doc {
      x: number;
      y: number;
      vy: number;
      drift: number;
      seed: number;
      born: number;
      stampAt: number; // -1 — штампа не будет
    }
    const docs: Doc[] = [];
    let lastSpawn = 0;
    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const spawnDoc = (t: number) => {
      const r = Math.random();
      docs.push({
        x: 6 + Math.random() * Math.max(10, w - DW - 12),
        y: -DH - 6,
        vy: reduced ? 0.35 : 0.7 + Math.random() * 1.1,
        drift: (Math.random() - 0.5) * 0.35,
        seed: Math.random(),
        born: t,
        stampAt: r < 0.22 ? t + 400 + Math.random() * 1400 : -1,
      });
      if (docs.length > 18) docs.shift();
    };

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!running || w === 0) return;
      ctx.clearRect(0, 0, w, h);

      // слабая сетка: вертикали каждые ~40px
      ctx.strokeStyle = "rgba(196,181,253,0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 20; x < w; x += 40) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();

      // спавн документов
      if (t - lastSpawn > (reduced ? 600 : 300)) {
        lastSpawn = t;
        spawnDoc(t);
      }

      for (let i = docs.length - 1; i >= 0; i--) {
        const d = docs[i];
        d.y += d.vy;
        d.x += d.drift;
        if (d.x < 4 || d.x > w - DW - 4) d.drift *= -1;
        if (d.y > h + 10) {
          docs.splice(i, 1);
          continue;
        }

        const rot = Math.sin(t * 0.0012 + d.seed * 12) * 0.05;
        const fade = Math.min(1, (t - d.born) / 250);

        ctx.save();
        ctx.translate(d.x + DW / 2, d.y + DH / 2);
        ctx.rotate(rot);
        ctx.globalAlpha = fade;

        // контур: прямоугольник со срезанным правым-верхним углом
        ctx.beginPath();
        ctx.moveTo(-DW / 2, -DH / 2);
        ctx.lineTo(DW / 2 - 7, -DH / 2);
        ctx.lineTo(DW / 2, -DH / 2 + 7);
        ctx.lineTo(DW / 2, DH / 2);
        ctx.lineTo(-DW / 2, DH / 2);
        ctx.closePath();
        ctx.strokeStyle = "rgba(196,181,253,0.55)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // header-полоска ярче
        ctx.beginPath();
        ctx.moveTo(-DW / 2, -DH / 2);
        ctx.lineTo(DW / 2 - 7, -DH / 2);
        ctx.lineTo(DW / 2, -DH / 2 + 7);
        ctx.lineTo(-DW / 2, -DH / 2 + 7);
        ctx.closePath();
        ctx.fillStyle = "rgba(168,85,247,0.4)";
        ctx.fill();

        // 4 «строки» текста
        const lx = -DW / 2 + 4;
        ctx.strokeStyle = "rgba(196,181,253,0.35)";
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const ly = -DH / 2 + 13 + k * 5;
          const lw = 8 + Math.floor((d.seed * 97 + k * 31) % 9);
          ctx.moveTo(lx, ly);
          ctx.lineTo(lx + lw, ly);
        }
        ctx.stroke();

        // штамп «OK», живёт ~600мс
        if (d.stampAt >= 0) {
          const sa = t - d.stampAt;
          if (sa >= 0 && sa < 600) {
            ctx.globalAlpha = fade * (1 - sa / 600);
            ctx.strokeStyle = accent;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(0, 1, 14, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font = "9px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeText("OK", 0, 1.5);
          }
        }

        ctx.restore();
      }

      // счётчик очереди
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.6)";
      ctx.fillText(`DOC-GEN PDF · QUEUE ${docs.length}`, 8, h - 8);
      ctx.textAlign = "right";
      ctx.fillStyle = accent;
      ctx.fillText("SPOOL OK", w - 8, h - 8);
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
