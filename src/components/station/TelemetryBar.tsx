"use client";

import { useEffect, useState } from "react";
import { useStation } from "@/lib/station-store";
import { SIGNALS } from "@/data/projects";

const FIELD_SEPARATOR = <span className="text-violet-500/40" aria-hidden="true">│</span>;

/** Нижняя телеметрия вместо футера: всегда у нижней кромки экрана. */
export default function TelemetryBar() {
  const channel = useStation((s) => s.channel);
  const statsSource = useStation((s) => s.statsSource);
  const tuning = useStation((s) => s.tuning);
  const [noise, setNoise] = useState(97);

  useEffect(() => {
    const id = setInterval(() => {
      setNoise(92 + Math.floor(Math.random() * 12) - (tuning ? 30 : 0));
    }, 900);
    return () => clearInterval(id);
  }, [tuning]);

  const freq = channel === 0 ? "87.9" : SIGNALS[channel - 1].freq;
  const lock = tuning ? "ПОИСК…" : "ЗАХВАТ";
  const sigName = channel === 0 ? "STATION CORE" : SIGNALS[channel - 1].name.toUpperCase();

  return (
    <footer
      className="md:fixed md:bottom-0 md:left-0 md:right-0 sticky bottom-0 z-30 border-t border-[rgba(168,85,247,0.22)] bg-[rgba(9,5,17,0.85)] backdrop-blur-md"
      style={{ minHeight: "var(--telemetry-h)" }}
    >
      <div
        className="flex items-center gap-x-3 gap-y-0 flex-wrap md:flex-nowrap px-4 md:px-6 h-10 font-telemetry text-[9px] uppercase tracking-[0.18em]"
        aria-label="Телеметрия станции"
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${tuning ? "bg-amber-300 animate-pulse" : "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]"}`}
            aria-hidden="true"
          />
          <span className={tuning ? "text-amber-200" : "text-emerald-300/90"}>
            сигнал: {lock}
          </span>
        </span>
        {FIELD_SEPARATOR}
        <span className="text-violet-300/70">
          частота: <span className="text-fuchsia-300">{freq} МГц</span>
        </span>
        {FIELD_SEPARATOR}
        <span className="hidden sm:inline text-violet-300/70">
          источник: <span className="text-violet-100">{sigName}</span>
        </span>
        {FIELD_SEPARATOR}
        <span className="hidden md:inline text-violet-300/70">
          шум: <span className="text-violet-100">-{noise} дБ</span>
        </span>
        {FIELD_SEPARATOR}
        <span className="hidden lg:inline text-violet-300/60">
          обс: <span className="text-violet-100">55.7963°N 49.1088°E</span>
        </span>
        <span className="ml-auto hidden sm:flex items-center gap-3 text-violet-300/60">
          <span>
            данные:{" "}
            <span className={statsSource === "live" ? "text-emerald-300/90" : "text-violet-200"}>
              {statsSource === "loading" ? "сканирование" : statsSource === "live" ? "github live" : "локальный архив"}
            </span>
          </span>
          <span className="text-fuchsia-400/80">© 2026 rvmxl</span>
        </span>
        <span className="sm:hidden text-fuchsia-400/80">© rvmxl</span>
      </div>
    </footer>
  );
}
