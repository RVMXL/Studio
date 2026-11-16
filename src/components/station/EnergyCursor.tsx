"use client";

import { useEffect, useRef } from "react";

/** Энергетический след за курсором: 14 частиц с инерцией. Только desktop. */
export default function EnergyCursor() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    host.classList.remove("hidden");
    const COUNT = 14;
    const dots: Array<HTMLSpanElement> = [];
    for (let i = 0; i < COUNT; i++) {
      const s = document.createElement("span");
      s.className = "station-cursor-dot";
      s.style.width = `${9 - i * 0.5}px`;
      s.style.height = `${9 - i * 0.5}px`;
      s.style.opacity = `${1 - i / COUNT}`;
      host.appendChild(s);
      dots.push(s);
    }

    const pos = { x: -100, y: -100 };
    const trail: Array<{ x: number; y: number }> = dots.map(() => ({
      x: -100,
      y: -100,
    }));
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const animate = () => {
      raf = requestAnimationFrame(animate);
      let prev = pos;
      for (let i = 0; i < dots.length; i++) {
        const t = trail[i];
        t.x += (prev.x - t.x) * (0.42 - i * 0.02);
        t.y += (prev.y - t.y) * (0.42 - i * 0.02);
        dots[i].style.transform = `translate(${t.x - 4}px, ${t.y - 4}px)`;
        prev = t;
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      dots.forEach((d) => d.remove());
      host.classList.add("hidden");
    };
  }, []);

  return <div ref={hostRef} aria-hidden="true" className="hidden" />;
}
