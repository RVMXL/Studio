"use client";

import { Github, ExternalLink, Radio } from "lucide-react";
import { STATION, SIGNALS } from "@/data/projects";
import { useStation } from "@/lib/station-store";
import SignalViz from "./SignalViz";
import VizPanel from "./VizPanel";

const DAYS_MS = 24 * 60 * 60 * 1000;

function freshLabel(pushedAt: string | null): string | null {
  if (!pushedAt) return null;
  const days = Math.max(0, Math.floor((Date.now() - new Date(pushedAt).getTime()) / DAYS_MS));
  if (days === 0) return "обновлён сегодня";
  if (days === 1) return "обновлён вчера";
  if (days < 30) return `обновлён ${days} дн. назад`;
  return `обновлён ${Math.floor(days / 30)} мес. назад`;
}

/** Карточка захваченного сигнала: описание проекта, теги, ссылки, визуализация. */
export default function SignalCard({ index }: { index: number }) {
  const signal = SIGNALS[index];
  const live = useStation((s) => s.live[signal.name]);

  const updated = freshLabel(live?.pushedAt ?? null);

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px] lg:grid-cols-[1fr_420px] md:gap-8 items-start">
      {/* текстовый блок сигнала */}
      <div className="min-w-0">
        <p className="font-telemetry text-[9px] uppercase tracking-[0.34em]" style={{ color: signal.accent }}>
          {signal.code} · {signal.subcategory}
        </p>

        <h2
          className="font-display text-[clamp(30px,6vw,58px)] font-extrabold leading-[1.02] mt-3 break-words"
          style={{
            color: "#f3ecfe",
            textShadow: `0 0 34px ${signal.accentGlow}`,
          }}
        >
          {signal.name}
        </h2>
        <p
          className="font-display text-[13px] md:text-[15px] mt-2"
          style={{ color: signal.accent }}
        >
          — {signal.tagline}
        </p>

        <p className="mt-5 text-[15px] leading-relaxed text-violet-100/85 max-w-prose">
          {signal.description}
        </p>

        {/* журнал регистрации сигнала */}
        <div
          className="mt-5 rounded-lg border p-4 space-y-2"
          style={{ borderColor: `rgba(168,85,247,0.25)`, background: signal.accentSoft }}
        >
          <p className="font-telemetry text-[8px] uppercase tracking-[0.3em] text-violet-300/60">
            журнал регистрации сигнала
          </p>
          {signal.details.map((d) => (
            <p key={d} className="flex gap-2.5 text-[12.5px] leading-relaxed text-violet-100/80">
              <span style={{ color: signal.accent }} aria-hidden="true">
                ▸
              </span>
              {d}
            </p>
          ))}
        </div>

        {/* теги */}
        <ul className="flex flex-wrap gap-2 mt-5" aria-label="Технологии проекта">
          {signal.tags.map((t) => (
            <li
              key={t}
              className="font-telemetry text-[9px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border border-violet-500/30 text-violet-200/80"
            >
              {t}
            </li>
          ))}
        </ul>

        {/* метаданные + ссылки */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-6">
          <a
            href={signal.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 h-10 rounded-full font-telemetry text-[10px] uppercase tracking-[0.18em] transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: signal.accent,
              color: "#0b0512",
              boxShadow: `0 8px 24px -8px ${signal.accentGlow}`,
            }}
          >
            <Github size={14} aria-hidden="true" />
            исходный код
          </a>
          {signal.demoLink && (
            <a
              href={signal.demoLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 h-10 rounded-full border font-telemetry text-[10px] uppercase tracking-[0.18em] transition-colors"
              style={{ borderColor: signal.accent, color: signal.accent }}
            >
              <ExternalLink size={14} aria-hidden="true" />
              веб-демо
            </a>
          )}
          <span className="font-telemetry text-[9px] uppercase tracking-[0.18em] text-violet-300/60 flex items-center gap-2">
            <Radio size={12} aria-hidden="true" style={{ color: signal.accent }} />
            {signal.language}
            {live ? ` · ★ ${live.stars}` : ""}
            {updated ? ` · ${updated}` : ""}
          </span>
        </div>

        <p
          className="mt-5 font-telemetry text-[9px] uppercase tracking-[0.24em] text-violet-300/50 flex items-center gap-2"
          title="Философия студии"
        >
          <span className="inline-block h-1 w-1 rounded-full" style={{ background: signal.accent }} aria-hidden="true" />
          {signal.offlineNote} · {STATION.principles[0].label.toLowerCase()}
        </p>
      </div>

      {/* визуализация сигнала */}
      <VizPanel
        label={`осциллограф · ${signal.code}`}
        right={`${signal.freq} МГц`}
        glow={signal.accentGlow}
        className="w-full"
      >
        <SignalViz kind={signal.viz} accent={signal.accent} />
      </VizPanel>
    </div>
  );
}
