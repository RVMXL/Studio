"use client";

import { create } from "zustand";

export interface LiveRepoStat {
  stars: number;
  pushedAt: string | null;
  source: "live" | "static";
}

interface StationState {
  channel: number; // 0 = станция, 1..7 = сигналы
  booted: boolean;
  tuning: boolean; // идёт захват сигнала (шум)
  audioOn: boolean;
  live: Record<string, LiveRepoStat>;
  statsSource: "live" | "static" | "loading";
  setChannel: (i: number) => void;
  finishBoot: () => void;
  toggleAudio: () => void;
  setLive: (stats: Record<string, LiveRepoStat>, source: "live" | "static") => void;
}

const CHANNEL_KEY_RE = /^ch-(\d)$/;

function readInitialChannel(): number {
  if (typeof window === "undefined") return 0;
  const m = CHANNEL_KEY_RE.exec(window.location.hash.slice(1));
  if (m) {
    const n = Math.min(7, Math.max(0, Number(m[1])));
    return n;
  }
  return 0;
}

function readInitialAudio(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem("station-audio") === "on";
  } catch {
    return false;
  }
}

export const useStation = create<StationState>((set) => ({
  channel: 0,
  booted: false,
  tuning: false,
  audioOn: false,
  live: {},
  statsSource: "loading",
  setChannel: (i) =>
    set(() => {
      const channel = Math.min(7, Math.max(0, i));
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", `#ch-${channel}`);
      }
      return { channel, tuning: true };
    }),
  finishBoot: () => set({ booted: true }),
  toggleAudio: () =>
    set((s) => {
      const audioOn = !s.audioOn;
      try {
        window.localStorage.setItem("station-audio", audioOn ? "on" : "off");
      } catch {
        /* noop */
      }
      return { audioOn };
    }),
  setLive: (stats, source) => set({ live: stats, statsSource: source }),
}));

// Гидратация начальных значений из URL/localStorage (только на клиенте)
if (typeof window !== "undefined") {
  const initial = useStation.getState();
  const hashChannel = readInitialChannel();
  const storedAudio = readInitialAudio();
  if (hashChannel !== 0 || storedAudio !== initial.audioOn) {
    useStation.setState({ channel: hashChannel, audioOn: storedAudio });
    if (hashChannel !== 0) {
      window.history.replaceState(null, "", `#ch-${hashChannel}`);
    }
  }
}
