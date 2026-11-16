"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-0x Endoscope (OTGLens): визор USB-эндоскопа — дрейфующие пятна,
 * сканлайны, перекрестие, редкие глитч-полосы и телеметрия OTG/USB.
 */
export default function EndoscopeViz({ accent }: VizProps) {
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

    interface Orb {
      fx: number;
      fy: number;
      fr: number;
      ph: number;
      amp: number;
    }
    const orbs: Orb[] = [
      { fx: 0.3, fy: 0.38, fr: 0.34, ph: 0.0, amp: 18 },
      { fx: 0.62, fy: 0.3, fr: 0.26, ph: 1.7, amp: 24 },
      { fx: 0.48, fy: 0.66, fr: 0.3, ph: 3.1, amp: 20 },
      { fx: 0.76, fy: 0.56, fr: 0.22, ph: 4.4, amp: 14 },
    ];

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

      const sp = reduced ? 0.35 : 1;
      const ampScale = reduced ? 0.6 : 1;
      const vx = 12;
      const vy = 12;
      const vw = Math.max(60, w - 24);
      const vh = Math.max(50, h - 48);

      // «живая картинка» внутри визора (клип по скруглённому прямоугольнику)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(vx, vy, vw, vh, 10);
      ctx.clip();

      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        const ox = vx + vw * o.fx + Math.sin(t * 0.00037 * sp + o.ph) * o.amp * ampScale;
        const oy =
          vy + vh * o.fy + Math.cos(t * 0.00029 * sp + o.ph * 1.31) * o.amp * 0.8 * ampScale;
        const orad = Math.min(vw, vh) * o.fr * (0.9 + 0.1 * Math.sin(t * 0.0006 * sp + o.ph));
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, orad);
        if (i === 0) {
          g.addColorStop(0, accent);
          g.addColorStop(1, "rgba(168,85,247,0)");
          ctx.globalAlpha = 0.3;
        } else {
          g.addColorStop(0, "rgba(168,85,247,0.55)");
          g.addColorStop(1, "rgba(168,85,247,0)");
          ctx.globalAlpha = 0.4;
        }
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(ox, oy, orad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // сканлайны, ползут вниз
      const step = 7;
      const off = (t * 0.02 * sp) % step;
      ctx.strokeStyle = "rgba(196,181,253,0.07)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = vy + off; y < vy + vh; y += step) {
        ctx.moveTo(vx, y);
        ctx.lineTo(vx + vw, y);
      }
      ctx.stroke();

      // глитч-полоса раз в ~3с
      const gp = t % 3000;
      if (gp < 180 && !reduced) {
        const gy = vy + vh * (0.2 + 0.6 * Math.abs(Math.sin(gp * 0.05)));
        const shift = Math.sin(gp * 0.12) * 7;
        ctx.fillStyle = "rgba(168,85,247,0.28)";
        ctx.fillRect(vx + shift, gy, vw, 8);
        ctx.fillStyle = "rgba(196,181,253,0.16)";
        ctx.fillRect(vx - shift * 0.6, gy + 11, vw, 3);
      }

      // перекрестие + кольцо
      const mx = vx + vw / 2;
      const my = vy + vh / 2;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(mx - 14, my);
      ctx.lineTo(mx - 5, my);
      ctx.moveTo(mx + 5, my);
      ctx.lineTo(mx + 14, my);
      ctx.moveTo(mx, my - 14);
      ctx.lineTo(mx, my - 5);
      ctx.moveTo(mx, my + 5);
      ctx.lineTo(mx, my + 14);
      ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(mx, my, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(mx, my, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // OSD внутри визора
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.7)";
      ctx.fillText("UVC 720p MJPEG", vx + 8, vy + 14);
      ctx.globalAlpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.005 * sp));
      ctx.fillStyle = accent;
      ctx.fillText("● LIVE", vx + 8, vy + 26);
      ctx.globalAlpha = 1;

      ctx.restore();

      // рамка визора + угловые скобки-кронштейны
      ctx.strokeStyle = "rgba(196,181,253,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(vx, vy, vw, vh, 10);
      ctx.stroke();
      const br = 13;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(vx - 3, vy - 3 + br);
      ctx.lineTo(vx - 3, vy - 3);
      ctx.lineTo(vx - 3 + br, vy - 3);
      ctx.moveTo(vx + vw + 3 - br, vy - 3);
      ctx.lineTo(vx + vw + 3, vy - 3);
      ctx.lineTo(vx + vw + 3, vy - 3 + br);
      ctx.moveTo(vx + vw + 3, vy + vh + 3 - br);
      ctx.lineTo(vx + vw + 3, vy + vh + 3);
      ctx.lineTo(vx + vw + 3 - br, vy + vh + 3);
      ctx.moveTo(vx - 3 + br, vy + vh + 3);
      ctx.lineTo(vx - 3, vy + vh + 3);
      ctx.lineTo(vx - 3, vy + vh + 3 - br);
      ctx.stroke();

      // ридер телеметрии
      const volts = (5 + Math.sin(t * 0.0009 * sp) * 0.03).toFixed(2);
      const ma = Math.round(420 + Math.sin(t * 0.0013 * sp) * 80);
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.75)";
      ctx.fillText("OTG OK", 12, h - 9);
      ctx.textAlign = "right";
      ctx.fillStyle = accent;
      ctx.fillText(`USB ${volts}V · ${ma}MA`, w - 12, h - 9);
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
