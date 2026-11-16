"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-0x Barcode (SmartFridge-Chef): штрих-код со сканирующей линией
 * и дуговые индикаторы остатка срока годности продуктов.
 */
export default function BarcodeViz({ accent }: VizProps) {
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

    // фиксированный паттерн штрих-кода (seed-генератор, один раз)
    let seed = 4600123456789 % 2147483647;
    const rnd = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };
    interface Bar {
      b: number;
      g: number;
    }
    const bars: Bar[] = [];
    let units = 0;
    while (units < 150) {
      const b = 1 + Math.floor(rnd() * 3);
      const g = 1 + Math.floor(rnd() * 2);
      bars.push({ b, g });
      units += b + g;
    }

    const PRODUCTS = [
      { frac: 0.82, name: "MILK" },
      { frac: 0.55, name: "EGG" },
      { frac: 0.31, name: "CHEESE" },
      { frac: 0.12, name: "FISH" },
      { frac: 0.65, name: "BREAD" },
    ];
    const rate = reduced ? 0.000002 : 0.000004; // доля срока за мс
    const daysLeft = (f: number) => (f <= 0.02 ? 0 : Math.ceil(f * 5));

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

      const bx = 14;
      const bw = Math.max(60, w - 28);
      const by = 22;
      const bh = 46;

      // слегка светлая подложка
      ctx.fillStyle = "rgba(233,230,253,0.09)";
      ctx.beginPath();
      ctx.roundRect(bx - 4, by - 4, bw + 8, bh + 8, 4);
      ctx.fill();

      // полосы штрих-кода (чёрно-лавандовые)
      const unit = bw / units;
      let x = bx;
      ctx.fillStyle = "rgba(16,12,28,0.92)";
      for (let i = 0; i < bars.length; i++) {
        ctx.fillRect(x, by, bars[i].b * unit, bh);
        x += (bars[i].b + bars[i].g) * unit;
        if (x > bx + bw) break;
      }
      // guard-полосы акцентом
      ctx.fillStyle = accent;
      ctx.fillRect(bx, by, unit * 1.6, bh);
      ctx.fillRect(bx + bw - unit * 1.6, by, unit * 1.6, bh);

      // сканирующая линия: туда-обратно по sin
      const scan = 0.5 + 0.5 * Math.sin(t * (reduced ? 0.0006 : 0.0012));
      const sx = bx + scan * bw;
      ctx.save();
      ctx.shadowColor = accent;
      ctx.shadowBlur = 9;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, by - 6);
      ctx.lineTo(sx, by + bh + 6);
      ctx.stroke();
      ctx.restore();

      // подпись над линией
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      const labelX = Math.min(Math.max(sx, 74), Math.max(74, w - 74));
      ctx.fillStyle = accent;
      ctx.fillText("SCAN OK · 4600123456789", labelX, by - 10);

      // продукты: 5 дуговых индикаторов остатка срока
      const py = Math.max(by + bh + 32, (by + bh + h - 26) / 2);
      const cell = bw / 5;
      for (let i = 0; i < 5; i++) {
        const p = PRODUCTS[i];
        const frac = Math.max(0, p.frac - t * rate);
        const px = bx + cell * (i + 0.5);
        const low = frac < 0.15;
        const blinkA = low ? 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.012)) : 1;
        const col = low ? "rgba(168,85,247,0.95)" : accent;

        ctx.strokeStyle = "rgba(196,181,253,0.15)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px, py, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = blinkA;
        ctx.strokeStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 12, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(196,181,253,0.35)";
        ctx.fillText(p.name, px, py - 20);
        ctx.fillStyle = low ? "rgba(196,181,253,0.9)" : "rgba(196,181,253,0.6)";
        ctx.fillText(`${daysLeft(frac)} ДН`, px, py + 26);
      }

      // ридер
      let minDays = 99;
      for (const p of PRODUCTS) {
        minDays = Math.min(minDays, daysLeft(Math.max(0, p.frac - t * rate)));
      }
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.75)";
      ctx.fillText(`СРОК: ${minDays} ДН · ПУШ ЛОКАЛЬНЫЙ`, 14, h - 8);
      ctx.textAlign = "right";
      ctx.fillStyle = accent;
      ctx.fillText("FRIDGE-NET", w - 14, h - 8);
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
