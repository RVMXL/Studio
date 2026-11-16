"use client";

import { type ReactNode } from "react";

/** Панель осциллографа с шапкой-лейблом. Обёртка всех визуализаций. */
export default function VizPanel({
  label,
  right,
  children,
  className = "",
  glow,
}: {
  label: string;
  right?: string;
  children: ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <figure
      className={`scope-panel scanline relative rounded-lg overflow-hidden ${className}`}
      style={glow ? { boxShadow: `0 0 40px -12px ${glow}, inset 0 1px 0 rgba(196,181,253,0.08)` } : undefined}
    >
      <figcaption className="flex items-center justify-between px-3 py-2 border-b border-[rgba(168,85,247,0.16)]">
        <span className="font-telemetry text-[9px] uppercase tracking-[0.28em] text-violet-300/70">
          {label}
        </span>
        {right && (
          <span className="font-telemetry text-[9px] text-fuchsia-300/80">{right}</span>
        )}
      </figcaption>
      <div className="relative h-[220px] md:h-[280px]">{children}</div>
    </figure>
  );
}
