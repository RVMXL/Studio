"use client";

import { Github, ServerOff, Fingerprint, ShieldCheck, Lock, Antenna } from "lucide-react";
import { STATION } from "@/data/projects";
import { useStation } from "@/lib/station-store";

const PRINCIPLE_ICONS: Record<string, typeof ServerOff> = {
  "server-off": ServerOff,
  fingerprint: Fingerprint,
  "shield-check": ShieldCheck,
  lock: Lock,
};

/** CH-00: сама станция — манифест студии вайбкодинга. */
export default function StationChannel() {
  const live = useStation((s) => s.live);
  const statsSource = useStation((s) => s.statsSource);

  const totalStars = Object.values(live).reduce((acc, r) => acc + r.stars, 0);

  return (
    <div className="max-w-3xl">
      <p className="font-telemetry text-[9px] uppercase tracking-[0.34em] text-fuchsia-300">
        CH-00 · позывной станции
      </p>

      <h1
        className="font-display font-black text-[clamp(38px,8.4vw,84px)] leading-[0.98] mt-4"
        style={{
          color: "#f6efff",
          textShadow:
            "0 0 60px rgba(168,85,247,0.5), 0 0 120px rgba(232,121,249,0.22)",
        }}
      >
        СТАНЦИЯ
        <br />
        <span className="rgb-jitter">ВАЙБОВ</span>
      </h1>

      <p className="mt-4 text-[15px] md:text-base text-violet-200/80 max-w-prose leading-relaxed">
        {STATION.subtitle}. Шесть устройств-приёмников поймали сигнал: софт должен
        жить <span className="text-fuchsia-300">на устройстве человека</span>, а не в чужом облаке.
      </p>

      {/* журнал передачи */}
      <div className="mt-7 space-y-3 border-l border-[rgba(168,85,247,0.35)] pl-4">
        {STATION.manifesto.map((line, i) => (
          <p key={line} className="flex gap-3 text-[13.5px] leading-relaxed text-violet-100/85">
            <span className="font-telemetry text-[9px] text-violet-400/60 mt-1 shrink-0">
              TX-{String(i + 1).padStart(2, "0")}
            </span>
            {line}
          </p>
        ))}
      </div>

      {/* принципы */}
      <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8" aria-label="Принципы студии">
        {STATION.principles.map((p) => {
          const Icon = PRINCIPLE_ICONS[p.icon] ?? ShieldCheck;
          return (
            <li
              key={p.label}
              className="scope-panel rounded-lg px-3.5 py-3.5 transition-transform duration-300 hover:-translate-y-1"
            >
              <Icon size={16} className="text-fuchsia-300" aria-hidden="true" />
              <p className="font-display font-semibold text-[12px] mt-2.5 text-violet-100">{p.label}</p>
              <p className="text-[10.5px] text-violet-300/70 mt-1 leading-snug">{p.note}</p>
            </li>
          );
        })}
      </ul>

      {/* телеметрия студии */}
      <dl className="flex flex-wrap gap-x-8 gap-y-3 mt-8 font-telemetry text-[10px] uppercase tracking-[0.2em]">
        <div>
          <dt className="text-violet-400/60">сигналов в архиве</dt>
          <dd className="text-[20px] text-fuchsia-300 mt-1">6</dd>
        </div>
        <div>
          <dt className="text-violet-400/60">серверов</dt>
          <dd className="text-[20px] text-fuchsia-300 mt-1">0</dd>
        </div>
        <div>
          <dt className="text-violet-400/60">звёзд эфира</dt>
          <dd className="text-[20px] text-fuchsia-300 mt-1">
            {statsSource === "loading" ? "···" : totalStars}
          </dd>
        </div>
        <div>
          <dt className="text-violet-400/60">обсерватория</dt>
          <dd className="text-[10px] text-violet-200/80 mt-2 normal-case tracking-normal">
            {STATION.observatory}
          </dd>
        </div>
      </dl>

      {/* ссылка на профиль */}
      <a
        href={STATION.profileLink}
        target="_blank"
        rel="noreferrer"
        className="mt-8 inline-flex items-center gap-2.5 px-5 h-11 rounded-full font-telemetry text-[10px] uppercase tracking-[0.2em] bg-fuchsia-500 text-[#0b0512] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(232,121,249,0.6)]"
      >
        <Github size={15} aria-hidden="true" />
        github.com/rvmxl
      </a>

      {/* конец передачи */}
      <div className="mt-10 pt-5 border-t border-dashed border-[rgba(168,85,247,0.3)] flex items-center gap-3 font-telemetry text-[9px] uppercase tracking-[0.3em] text-violet-300/50">
        <Antenna size={13} className="text-fuchsia-400/80" aria-hidden="true" />
        конец передачи · настройтесь на частоты 01—06
        <span className="caret-blink text-fuchsia-300" aria-hidden="true">▮</span>
      </div>
    </div>
  );
}
