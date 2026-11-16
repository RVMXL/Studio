"use client";

import { useEffect, useState } from "react";
import { Satellite, Volume2, VolumeX } from "lucide-react";
import Waveform from "./Waveform";
import { useStation } from "@/lib/station-store";
import { playToggleConfirm } from "@/lib/station-audio";

/** Шапка станции: позывной, живой эфир, часы, звук. */
export default function StatusBar() {
  const audioOn = useStation((s) => s.audioOn);
  const toggleAudio = useStation((s) => s.toggleAudio);
  const [time, setTime] = useState("--:--:--");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTime(
        [d.getHours(), d.getMinutes(), d.getSeconds()]
          .map((n) => String(n).padStart(2, "0"))
          .join(":")
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(168,85,247,0.18)] bg-[rgba(9,5,17,0.78)] backdrop-blur-md">
      <div className="flex items-center h-[52px] px-4 md:px-6 gap-4">
        <a
          href="https://github.com/rvmxl"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 group shrink-0 focus-visible:outline focus-visible:outline-1 focus-visible:outline-fuchsia-400/70"
        >
          <Satellite
            size={17}
            className="text-fuchsia-400 transition-transform duration-500 group-hover:rotate-45"
            aria-hidden="true"
          />
          <span className="font-display font-extrabold text-[13px] tracking-[0.22em] text-violet-100">
            RVMXL
          </span>
          <span className="hidden sm:inline font-telemetry text-[9px] uppercase tracking-[0.3em] text-violet-300/55 group-hover:text-fuchsia-300/80 transition-colors">
            станция вайбов
          </span>
        </a>

        {/* живой эфир */}
        <div className="flex-1 min-w-0 h-6 opacity-80" aria-hidden="true">
          <Waveform />
        </div>

        <span className="hidden md:inline font-telemetry text-[10px] text-violet-300/60">
          <span className="text-violet-500/60 mr-1">локальное</span> {time}
        </span>

        <button
          onClick={() => {
            toggleAudio();
            playToggleConfirm(!audioOn);
          }}
          aria-pressed={audioOn}
          aria-label={audioOn ? "Выключить звук станции" : "Включить звук станции"}
          className={`flex items-center gap-2 px-3 h-8 rounded-full border font-telemetry text-[9px] tracking-[0.2em] uppercase transition-all ${
            audioOn
              ? "border-fuchsia-400/60 text-fuchsia-200 bg-fuchsia-500/10 shadow-[0_0_14px_rgba(232,121,249,0.3)]"
              : "border-violet-500/30 text-violet-300/70 hover:text-violet-200 hover:border-violet-400/50"
          }`}
        >
          {audioOn ? <Volume2 size={13} aria-hidden="true" /> : <VolumeX size={13} aria-hidden="true" />}
          <span className="hidden sm:inline">{audioOn ? "эфир on" : "эфир off"}</span>
        </button>
      </div>
    </header>
  );
}
