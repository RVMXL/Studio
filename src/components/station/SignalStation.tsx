"use client";

import { useEffect, useRef } from "react";
import { useStation } from "@/lib/station-store";
import { playTuning } from "@/lib/station-audio";
import PulsarVoid from "./PulsarVoid";
import NoiseOverlay from "./NoiseOverlay";
import EnergyCursor from "./EnergyCursor";
import BootOverlay from "./BootOverlay";
import StatusBar from "./StatusBar";
import ChannelRail from "./ChannelRail";
import ChannelStage from "./ChannelStage";
import TelemetryBar from "./TelemetryBar";

/**
 * СТАНЦИЯ ВАЙБОВ // RVMXL
 * Не страница, а приёмник: настраивайтесь на частоты (стрелки ↑↓ ←→, цифры 0—7).
 */
export default function SignalStation() {
  const channel = useStation((s) => s.channel);
  const audioOn = useStation((s) => s.audioOn);
  const stageRef = useRef<HTMLElement>(null);

  // звук захвата при смене частоты
  useEffect(() => {
    const unsub = useStation.subscribe((s, prev) => {
      if (s.channel !== prev.channel && s.booted) {
        if (s.audioOn) playTuning(s.channel);
      }
    });
    return unsub;
  }, []);

  // смена канала возвращает сцену к началу передачи
  useEffect(() => {
    stageRef.current?.scrollTo({ top: 0 });
  }, [channel]);

  // клавиатурная настройка: стрелки и цифры 0—7
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
        return;
      }
      const s = useStation.getState();
      if (["ArrowUp", "ArrowLeft"].includes(e.key)) {
        e.preventDefault();
        s.setChannel(s.channel - 1);
      } else if (["ArrowDown", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        s.setChannel(s.channel + 1);
      } else if (/^[0-7]$/.test(e.key)) {
        s.setChannel(Number(e.key));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // live-статистика GitHub (с локальным кэшем на бэкенде)
  // путь относительный: работает и в dev (/), и на GitHub Pages (/Studio/)
  useEffect(() => {
    let cancelled = false;
    fetch("api/station")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("bad status"))))
      .then((data) => {
        if (cancelled || data?.source !== "live") return;
        const stats: Record<string, { stars: number; pushedAt: string | null; source: "live" }> = {};
        for (const repo of data.repos ?? []) {
          stats[repo.name] = {
            stars: repo.stars ?? 0,
            pushedAt: repo.pushedAt ?? null,
            source: "live",
          };
        }
        useStation.getState().setLive(stats, "live");
      })
      .catch(() => {
        if (!cancelled) useStation.getState().setLive({}, "static");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="station-root min-h-screen md:h-dvh flex flex-col md:overflow-hidden relative">
      {/* пурпурный вакуум с пульсаром */}
      <PulsarVoid />
      <div className="station-vignette fixed inset-0 pointer-events-none" aria-hidden="true" />

      <NoiseOverlay />
      <EnergyCursor />
      <BootOverlay />

      <StatusBar />

      <div className="flex flex-col md:flex-row flex-1 md:min-h-0">
        <ChannelRail />
        <main
          ref={stageRef}
          className="station-scroll flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-6 md:py-10 pb-16 md:pb-[calc(var(--telemetry-h)+40px)]"
          aria-label="Сцена канала"
        >
          <ChannelStage />
        </main>
      </div>

      <TelemetryBar />
    </div>
  );
}
