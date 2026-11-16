"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-0x Radar (WarpScoutGUI-AWG): вращающаяся развёртка, блипы
 * на фиксированных позициях и псевдо-IP захваченного warp-эндпоинта.
 */
export default function RadarViz({ accent }: VizProps) {
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

    // блипы: фиксированные полярные координаты (генерация один раз, seed-массив)
    interface Blip {
      a: number;
      rf: number;
      size: number;
      lastHit: number;
      lit: boolean;
    }
    let s = 123456789;
    const rnd = () => {
      s = (s * 48271) % 2147483647;
      return s / 2147483647;
    };
    const blips: Blip[] = [];
    for (let i = 0; i < 7; i++) {
      blips.push({
        a: rnd() * Math.PI * 2,
        rf: 0.25 + rnd() * 0.68,
        size: 1.6 + rnd() * 1.6,
        lastHit: -1e9,
        lit: false,
      });
    }
    let ipX = 41; // октет меняется при каждом проходе развёртки через блик

    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!running || w === 0) return;
      ctx.clearRect(0, 0, w, h);

      const TAU = Math.PI * 2;
      const cx = w / 2;
      const cy = h / 2 - 4;
      const r = Math.max(34, Math.min(w, h) / 2 - 26);
      const sweep = (t * (reduced ? 0.0005 : 0.0011)) % TAU;

      // концентрические окружности + крестовина
      ctx.strokeStyle = "rgba(196,181,253,0.12)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (r * i) / 3, 0, TAU);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - r, cy);
      ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // развёртка: сектор ~40° из 30 лучей с падающей alpha
      const sector = (40 * Math.PI) / 180;
      const rays = 30;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      for (let i = rays; i >= 1; i--) {
        const a = sweep - (sector * i) / rays;
        ctx.globalAlpha = (1 - i / rays) * 0.3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * r, cy + Math.sin(sweep) * r);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // блипы: загораются под развёрткой (|Δугла| < 0.3 рад), гаснут ~2с
      for (const b of blips) {
        const d = (((sweep - b.a) % TAU) + TAU) % TAU;
        if (d < 0.3) {
          if (!b.lit) {
            b.lit = true;
            ipX = Math.floor(rnd() * 254) + 1;
          }
          b.lastHit = t;
        } else if (t - b.lastHit > 120) {
          b.lit = false;
        }
        const inten = d < 0.3 ? 1 : Math.max(0, 1 - (t - b.lastHit) / 2000);
        if (inten <= 0) continue;
        const px = cx + Math.cos(b.a) * b.rf * r;
        const py = cy + Math.sin(b.a) * b.rf * r;
        ctx.globalAlpha = 0.12 + 0.75 * inten;
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(px, py, b.size + inten * 1.6, 0, TAU);
        ctx.fill();
        if (inten > 0.6) {
          ctx.globalAlpha = inten * 0.25;
          ctx.beginPath();
          ctx.arc(px, py, b.size + 5, 0, TAU);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // центр
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, TAU);
      ctx.fill();

      // метки по углам + ридер
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.55)";
      ctx.fillText("AWG31", 8, 14);
      ctx.fillText("UDP PROBE", 8, h - 8);
      ctx.textAlign = "right";
      ctx.fillText("SCAN 240S", w - 8, 14);
      ctx.fillStyle = accent;
      ctx.fillText("WARP ENDPOINT LOCK", w - 8, h - 8);
      ctx.fillStyle = "rgba(232,228,254,0.85)";
      ctx.fillText(`162.159.192.${ipX}:2408`, w - 8, h - 21);
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
