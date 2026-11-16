"use client";

// ─── Синтезаторный блок станции: блипы при настройке частоты ─────────
// Ленивый AudioContext; включается только когда пользователь включил звук.

let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function blip(
  audio: AudioContext,
  freq: number,
  at: number,
  dur: number,
  gainPeak: number,
  type: OscillatorType = "sine"
) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(gainPeak, at + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(gain).connect(audio.destination);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}

function noiseSweep(audio: AudioContext, at: number, dur: number, peak: number) {
  const bufferSize = Math.floor(audio.sampleRate * dur);
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1800, at);
  filter.frequency.exponentialRampToValueAtTime(300, at + dur);
  filter.Q.value = 0.8;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(gain).connect(audio.destination);
  src.start(at);
}

/** Звук захвата сигнала: шум → двойной тон захвата. */
export function playTuning(channelIndex: number) {
  const audio = ensureCtx();
  if (!audio) return;
  const t = audio.currentTime;
  noiseSweep(audio, t, 0.22, 0.05);
  const base = 220 + channelIndex * 55; // каждая частота — свой тон
  blip(audio, base, t + 0.16, 0.12, 0.10);
  blip(audio, base * 1.5, t + 0.26, 0.16, 0.08);
}

/** Тихий такт телеметрии при переключении тумблера звука (подтверждение). */
export function playToggleConfirm(on: boolean) {
  const audio = ensureCtx();
  if (!audio) return;
  const t = audio.currentTime;
  blip(audio, on ? 660 : 330, t, 0.09, 0.07, "triangle");
}
