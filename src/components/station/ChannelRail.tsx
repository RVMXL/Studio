"use client";

import { Radio, AudioWaveform, ScanEye, FileText, AlarmClock, Refrigerator, Radar } from "lucide-react";
import { useStation } from "@/lib/station-store";

const CHANNEL_ICONS = [Radio, AudioWaveform, ScanEye, FileText, AlarmClock, Refrigerator, Radar];

const CHANNELS = [
  { code: "00", label: "СТАНЦИЯ", freq: "87.9", hint: "студия вайбкодинга" },
  { code: "01", label: "HUMNOTE", freq: "92.1", hint: "напой — получи ноты" },
  { code: "02", label: "OTGLENS", freq: "96.4", hint: "USB-эндоскоп без root" },
  { code: "03", label: "DOCGEN", freq: "100.7", hint: "юр. документы офлайн" },
  { code: "04", label: "AUTOALARM", freq: "104.8", hint: "будильник по расписанию" },
  { code: "05", label: "FRIDGECHEF", freq: "108.0", hint: "сроки годности + меню" },
  { code: "06", label: "WARPSCOUT", freq: "111.9", hint: "радар WARP-эндпоинтов" },
];

/** Диапазон настройки: вертикальная шкала частот. */
export default function ChannelRail() {
  const channel = useStation((s) => s.channel);
  const setChannel = useStation((s) => s.setChannel);

  return (
    <nav
      aria-label="Настройка частоты станции"
      className="w-full min-w-0 md:flex md:flex-col md:w-[188px] md:shrink-0 md:border-r md:border-[rgba(168,85,247,0.18)] md:py-6"
    >
      <p className="hidden md:block font-telemetry text-[9px] uppercase tracking-[0.3em] text-violet-300/50 px-5 mb-4">
        диапазон
      </p>
      {/* десктоп: вертикальная шкала */}
      <ul className="hidden md:flex flex-col">
        {CHANNELS.map((ch, i) => {
          const Icon = CHANNEL_ICONS[i];
          const active = channel === i;
          return (
            <li key={ch.code} className="relative">
              <button
                onClick={() => setChannel(i)}
                aria-pressed={active}
                aria-label={`Канал ${ch.code}: ${ch.label}, частота ${ch.freq} мегагерц`}
                className="group w-full text-left px-5 py-3 flex items-center gap-3 transition-colors duration-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-fuchsia-400/70"
              >
                <span
                  className={`font-telemetry text-[9px] w-8 transition-colors ${
                    active ? "text-fuchsia-300" : "text-violet-300/40 group-hover:text-violet-200/70"
                  }`}
                >
                  {ch.freq}
                </span>
                <span
                  className={`h-6 w-px transition-all duration-300 ${
                    active
                      ? "tick-active bg-fuchsia-400 [--marker-glow:rgba(232,121,249,0.7)]"
                      : "bg-violet-400/25 group-hover:bg-violet-300/50"
                  }`}
                />
                <span className="flex-1 min-w-0">
                  <span
                    className={`flex items-center gap-1.5 font-telemetry text-[9px] tracking-[0.1em] transition-colors ${
                      active
                        ? "text-violet-100"
                        : "text-violet-300/55 group-hover:text-violet-200"
                    }`}
                  >
                    <Icon
                      size={12}
                      className={active ? "text-fuchsia-300" : "text-violet-400/60 group-hover:text-violet-300"}
                      aria-hidden="true"
                    />
                    {ch.label}
                  </span>
                  <span
                    className={`block text-[9px] text-violet-300/45 truncate transition-opacity ${
                      active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {ch.hint}
                  </span>
                </span>
              </button>
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_2px_rgba(232,121,249,0.8)]"
                />
              )}
            </li>
          );
        })}
      </ul>

      {/* мобильный: горизонтальная лента частот */}
      <ul className="md:hidden flex gap-2 overflow-x-auto max-w-full px-4 py-3 station-scroll">
        {CHANNELS.map((ch, i) => {
          const Icon = CHANNEL_ICONS[i];
          const active = channel === i;
          return (
            <li key={ch.code}>
              <button
                onClick={() => setChannel(i)}
                aria-pressed={active}
                aria-label={`Канал ${ch.code}: ${ch.label}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border font-telemetry text-[10px] tracking-wider whitespace-nowrap transition-all ${
                  active
                    ? "border-fuchsia-400/60 bg-fuchsia-500/10 text-fuchsia-200 shadow-[0_0_16px_rgba(232,121,249,0.25)]"
                    : "border-violet-500/25 text-violet-300/70"
                }`}
              >
                <Icon size={12} aria-hidden="true" />
                {ch.freq}
                <span className="text-violet-200/80">{ch.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* подсказка клавиатурной настройки */}
      <p className="hidden md:block font-telemetry text-[8px] uppercase tracking-[0.24em] text-violet-400/45 px-5 mt-auto pt-6 pb-1">
        клавиши: ↑↓ ←→ · 0—6
      </p>
    </nav>
  );
}
