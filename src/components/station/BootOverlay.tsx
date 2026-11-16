"use client";

import { useEffect, useState } from "react";
import { useStation } from "@/lib/station-store";

const BOOT_LINES = [
  "RVMXL SIGNAL STATION v2.6",
  "инициализация приёмного контура… ok",
  "пурпурный вакуум: плотность нормы",
  "сканирование диапазона 87—112 МГц…",
  "найдено сигналов: 6 · все офлайн",
  "наведите антенну — кликните частоту",
];

/** Загрузка станции: короткая последовательность захвата эфира. */
export default function BootOverlay() {
  const booted = useStation((s) => s.booted);
  const finishBoot = useStation((s) => s.finishBoot);
  const [lines, setLines] = useState(0);

  useEffect(() => {
    if (booted) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      finishBoot();
      return;
    }
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    BOOT_LINES.forEach((_, i) => {
      timers.push(setTimeout(() => setLines(i + 1), 120 + i * 170));
    });
    timers.push(setTimeout(() => finishBoot(), 120 + BOOT_LINES.length * 170 + 950));
    return () => timers.forEach(clearTimeout);
  }, [booted, finishBoot]);

  if (booted) return null;

  return (
    <div
      role="status"
      aria-label="Станция загружается"
      onClick={finishBoot}
      className="boot-out fixed inset-0 z-[80] flex items-center justify-center bg-[#07040d] cursor-pointer"
    >
      <div className="w-[min(92vw,480px)]">
        <div className="ruler-ticks h-1.5 mb-5 opacity-70" aria-hidden="true" />
        <p className="font-telemetry text-[9px] uppercase tracking-[0.4em] text-fuchsia-400/80 mb-4">
          deep violet band
        </p>
        <div className="font-telemetry text-[11px] leading-6 text-violet-200/85 min-h-[132px]">
          {BOOT_LINES.slice(0, lines).map((line, i) => (
            <p key={line} className="boot-line">
              <span className="text-violet-500/60 mr-2">{String(i).padStart(2, "0")}</span>
              {line}
              {i === lines - 1 && <span className="caret-blink text-fuchsia-300 ml-1">▮</span>}
            </p>
          ))}
        </div>
        <p className="font-telemetry text-[8px] uppercase tracking-[0.3em] text-violet-400/40 mt-4">
          [ клик — пропустить захват ]
        </p>
      </div>
    </div>
  );
}
