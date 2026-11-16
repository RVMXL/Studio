"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-0x Alarm (Student-AutoAlarm): 24-часовой циферблат-сонар,
 * стрелки по реальному времени и кольца-«сонары» раз в секунду.
 */
export default function AlarmViz({ accent }: VizProps) {
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

    interface Ring {
      born: number;
    }
    const rings: Ring[] = [];
    let lastRing = 0;
    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);

    const ALARM_TICKS = [6, 12, 18]; // индексы рисок-будильников (шаг 15°)
    const two = (n: number) => String(n).padStart(2, "0");

    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!running || w === 0) return;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const r = Math.max(30, Math.min(w, h) / 2 - 34);

      // кольца-сонар: раз в секунду, alpha падает до 0 за ~1.2с
      if (t - lastRing > (reduced ? 2000 : 1000)) {
        lastRing = t;
        rings.push({ born: t });
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const age = t - rings[i].born;
        if (age > 1200) {
          rings.splice(i, 1);
          continue;
        }
        const k = age / 1200;
        ctx.globalAlpha = (1 - k) * 0.5;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, r + k * Math.min(34, r * 0.7), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // циферблат
      ctx.strokeStyle = "rgba(196,181,253,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // 24 «пары»-риски (линия + точка), каждые 15°; часть — будильники
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        const isAlm = ALARM_TICKS.includes(i);
        ctx.strokeStyle = isAlm ? accent : "rgba(196,181,253,0.4)";
        ctx.lineWidth = isAlm ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
        ctx.lineTo(cx + Math.cos(a) * (r - 8), cy + Math.sin(a) * (r - 8));
        ctx.stroke();
        ctx.fillStyle = isAlm ? accent : "rgba(196,181,253,0.35)";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (r - 13), cy + Math.sin(a) * (r - 13), isAlm ? 1.8 : 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // стрелки по реальному времени (24h циферблат)
      const now = new Date();
      const ha = ((now.getHours() + now.getMinutes() / 60) / 24) * Math.PI * 2 - Math.PI / 2;
      const ma = ((now.getMinutes() + now.getSeconds() / 60) / 60) * Math.PI * 2 - Math.PI / 2;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ha) * r * 0.45, cy + Math.sin(ha) * r * 0.45);
      ctx.stroke();
      ctx.strokeStyle = "rgba(232,228,254,0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ma) * r * 0.68, cy + Math.sin(ma) * r * 0.68);
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      // цифры времени в центре
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(232,228,254,0.92)";
      ctx.fillText(`${two(now.getHours())}:${two(now.getMinutes())}`, cx, cy - 10);
      ctx.font = "9px monospace";
      ctx.fillStyle = accent;
      ctx.fillText("ALARM 06:05", cx, cy + 12);
      ctx.textBaseline = "alphabetic";

      // мигающая метка сверки сверху-справа
      ctx.globalAlpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(t * (reduced ? 0.0016 : 0.004)));
      ctx.font = "9px monospace";
      ctx.textAlign = "right";
      ctx.fillStyle = "rgba(196,181,253,0.8)";
      ctx.fillText("00:05 СВЕРКА", w - 8, 14);
      ctx.globalAlpha = 1;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.55)";
      ctx.fillText("SONAR 24H", 8, h - 8);
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
