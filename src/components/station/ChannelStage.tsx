"use client";

import { SIGNALS } from "@/data/projects";
import { useStation } from "@/lib/station-store";
import StationChannel from "./StationChannel";
import SignalCard from "./SignalCard";

/**
 * Сцена канала: контент появляется эффектом «дрожи настройки» (tune-in),
 * а не банальным фейдом. Каждый канал — свой ритм композиции.
 */
export default function ChannelStage() {
  const channel = useStation((s) => s.channel);

  // key={channel} пересоздаёт поддерево — анимация tune-in проигрывается заново
  return (
    <div
      key={channel}
      className="tune-in relative"
      role="region"
      aria-live="polite"
      aria-label={channel === 0 ? "Канал 00: Станция" : `Канал ${SIGNALS[channel - 1].code}: ${SIGNALS[channel - 1].name}`}
    >
      {/* гигантский глиф канала как фон — индивидуальный узор каждого сигнала */}
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-6 -top-10 md:-right-10 md:-top-16 font-display text-[220px] md:text-[360px] leading-none opacity-[0.05]"
        style={{ color: channel === 0 ? "#c084fc" : SIGNALS[channel - 1].accent }}
      >
        {channel === 0 ? "◉" : SIGNALS[channel - 1].glyph}
      </span>

      {channel === 0 ? (
        <StationChannel />
      ) : (
        <SignalCard index={channel - 1} />
      )}
    </div>
  );
}
