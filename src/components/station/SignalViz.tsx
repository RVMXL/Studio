"use client";

import dynamic from "next/dynamic";
import type { VizKind } from "@/data/projects";
import HumNoteViz from "./viz/HumNoteViz";

// Каждая визуализация тяжёлая (canvas + rAF) — грузим только активную.
const EndoscopeViz = dynamic(() => import("./viz/EndoscopeViz"), { ssr: false });
const DocRainViz = dynamic(() => import("./viz/DocRainViz"), { ssr: false });
const AlarmViz = dynamic(() => import("./viz/AlarmViz"), { ssr: false });
const BarcodeViz = dynamic(() => import("./viz/BarcodeViz"), { ssr: false });
const RadarViz = dynamic(() => import("./viz/RadarViz"), { ssr: false });
const LinkShiftViz = dynamic(() => import("./viz/LinkShiftViz"), { ssr: false });

export default function SignalViz({ kind, accent }: { kind: VizKind; accent: string }) {
  switch (kind) {
    case "pianoroll":
      return <HumNoteViz accent={accent} />;
    case "endoscope":
      return <EndoscopeViz accent={accent} />;
    case "docrain":
      return <DocRainViz accent={accent} />;
    case "alarm":
      return <AlarmViz accent={accent} />;
    case "barcode":
      return <BarcodeViz accent={accent} />;
    case "radar":
      return <RadarViz accent={accent} />;
    case "linkshift":
      return <LinkShiftViz accent={accent} />;
    default:
      return <HumNoteViz accent={accent} />;
  }
}
