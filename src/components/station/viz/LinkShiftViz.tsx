"use client";

import { useEffect, useRef } from "react";
import type { VizProps } from "./viz-types";

/**
 * CH-07 LinkShift: перекачка тяжёлых папок с диска C: на D:.
 * Папки уходят пакетами по junction-ссылке; на месте исходника
 * остаётся пунктирный маркер ссылки, программы ничего не замечают.
 */

const FOLDERS = [
  { name: "CHROME CACHE", mb: 5120 },
  { name: "TELEGRAM", mb: 3140 },
  { name: "DISCORD", mb: 2048 },
  { name: "NVIDIA SHADER", mb: 4600 },
  { name: "STEAM / RUST", mb: 42000 },
  { name: "APPDATA", mb: 8800 },
];

const CYCLE_MS = 9000; // длительность переноса одной папки
const COPY_FRAC = 0.72; // доля цикла — копирование, остальное — mklink/ok

export default function LinkShiftViz({ accent }: VizProps) {
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

      const speed = reduced ? 0.4 : 1;
      const idx = Math.floor((t * speed) / CYCLE_MS) % FOLDERS.length;
      const folder = FOLDERS[idx];
      const cycle = ((t * speed) % CYCLE_MS) / CYCLE_MS;
      const copying = cycle < COPY_FRAC;
      const copyP = copying ? cycle / COPY_FRAC : 1;
      const done = !copying;

      // ── панели дисков ────────────────────────────────────────────
      const pad = 14;
      const gap = 58;
      const pw = (w - pad * 2 - gap) / 2;
      const top = 30;
      const ph = h - top - 46;

      const drawDisk = (x: number, label: string, sub: string) => {
        ctx.fillStyle = "rgba(233,230,253,0.08)";
        ctx.beginPath();
        ctx.roundRect(x, top, pw, ph, 6);
        ctx.fill();
        ctx.font = "9px monospace";
        ctx.textAlign = "left";
        ctx.fillStyle = "rgba(196,181,253,0.8)";
        ctx.fillText(label, x + 8, top - 8);
        ctx.textAlign = "right";
        ctx.fillStyle = "rgba(196,181,253,0.4)";
        ctx.fillText(sub, x + pw - 8, top - 8);
      };
      drawDisk(pad, "C:", "ИСХОДНИК");
      drawDisk(pad + pw + gap, "D:", "ЦЕЛЬ");

      // ── строки папок в дисках ────────────────────────────────────
      const rowH = Math.min(26, (ph - 16) / FOLDERS.length);
      const listTop = top + 12;
      const dX = pad + pw + gap; // левый край панели D:

      const barW = (px: number) => px + pw - 16;
      const rowY = (i: number) => listTop + i * rowH;

      // D: — заполненные строки уже перенесённых папок (прошлые в цикле)
      for (let i = 0; i < FOLDERS.length; i++) {
        const passed = i < idx;
        const current = i === idx;
        if (!passed && !current) continue;
        const y = rowY(i);
        const fillW = (barW(0) - pad - 8) * (passed ? 1 : copyP);
        ctx.fillStyle = passed ? "rgba(168,85,247,0.55)" : accent;
        ctx.globalAlpha = passed ? 0.5 : 1;
        ctx.beginPath();
        ctx.roundRect(dX + 8, y, Math.max(3, fillW), rowH - 8, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (current && copyP > 0.03) {
          ctx.font = "8px monospace";
          ctx.textAlign = "left";
          ctx.fillStyle = "rgba(233,230,253,0.9)";
          ctx.fillText(
            `${folder.name} · ${Math.round(folder.mb * copyP)} МБ`,
            dX + 12,
            y + rowH - 14
          );
        }
      }

      // C: — исходные строки; у текущей копируемой полоса истощается
      for (let i = 0; i < FOLDERS.length; i++) {
        const passed = i < idx;
        const current = i === idx;
        const y = rowY(i);
        if (passed) {
          // на месте исходника осталась junction-ссылка: пунктир + значок
          ctx.save();
          ctx.strokeStyle = "rgba(196,181,253,0.5)";
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(pad + 8, y, barW(0) - pad - 8, rowH - 8, 3);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.roundRect(pad + 12, y + (rowH - 8) / 2 - 5, 12, 10, 2);
          ctx.fill();
          ctx.fillStyle = "#0b0512";
          ctx.font = "bold 8px monospace";
          ctx.textAlign = "center";
          ctx.fillText("J", pad + 18, y + (rowH - 8) / 2 + 3);
          ctx.restore();
          continue;
        }
        if (current) {
          const remain = 1 - copyP;
          ctx.fillStyle = "rgba(233,230,253,0.14)";
          ctx.beginPath();
          ctx.roundRect(pad + 8, y, barW(0) - pad - 8, rowH - 8, 3);
          ctx.fill();
          if (remain > 0.02) {
            ctx.fillStyle = "rgba(196,181,253,0.75)";
            ctx.beginPath();
            ctx.roundRect(
              pad + 8,
              y,
              Math.max(3, (barW(0) - pad - 8) * remain),
              rowH - 8,
              3
            );
            ctx.fill();
          }
        } else {
          ctx.fillStyle = "rgba(233,230,253,0.14)";
          ctx.beginPath();
          ctx.roundRect(pad + 8, y, barW(0) - pad - 8, rowH - 8, 3);
          ctx.fill();
        }
      }

      // ── junction-канал между дисками ─────────────────────────────
      const midX = pad + pw + gap / 2;
      const y1 = top + ph * 0.3;
      const y2 = top + ph * 0.62;
      ctx.strokeStyle = "rgba(196,181,253,0.3)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(midX - 4, y1);
      ctx.bezierCurveTo(midX + 14, y1, midX - 14, y2, midX + 4, y2);
      ctx.stroke();

      // пакеты, летящие по каналу во время копирования
      if (!done) {
        const packetN = 4;
        for (let k = 0; k < packetN; k++) {
          const f = (cycle * 2.6 + k / packetN) % 1;
          if (f > copyP) continue;
          const px = pad + pw + (f * gap - gap / 2) * (0.4 + 0.6 * f);
          const py = y1 + (y2 - y1) * f + Math.sin(f * Math.PI) * -8;
          ctx.save();
          ctx.shadowColor = accent;
          ctx.shadowBlur = 8;
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.roundRect(px - 3, py - 3, 6, 6, 1.5);
          ctx.fill();
          ctx.restore();
        }
      }

      // мигающий маркер ссылки в центре канала
      const blink = done ? 0.5 + 0.5 * Math.sin(t * 0.01) : 0.35;
      ctx.globalAlpha = blink;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(midX, (y1 + y2) / 2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // ── строка статуса внизу ─────────────────────────────────────
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(196,181,253,0.75)";
      ctx.fillText(
        done
          ? `MKLINK /J OK · ${folder.name} → D:`
          : `ROBOCOPY · ${folder.name} · ${Math.round(copyP * 100)}%`,
        pad,
        h - 8
      );
      ctx.textAlign = "right";
      ctx.fillStyle = done ? accent : "rgba(196,181,253,0.6)";
      ctx.fillText(
        done ? "ПРОГРАММЫ НЕ ЗАМЕЧАЮТ" : `${folder.mb} МБ ВСЕГО`,
        w - pad,
        h - 8
      );
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
