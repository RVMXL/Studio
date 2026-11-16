"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { SIGNALS } from "@/data/projects";
import { useStation } from "@/lib/station-store";

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec3 vNormal;
  varying float vDisp;

  // классический simplex-ish шум (hash-based)
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                       dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                   mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                       dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                       dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                   mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                       dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
  }

  void main() {
    float n = noise(normal * 2.4 + uTime * 0.35);
    float n2 = noise(normal * 5.5 - uTime * 0.6) * 0.4;
    float disp = (n + n2) * uAmp;
    vDisp = disp;
    vec3 pos = position + normal * disp;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  varying vec3 vNormal;
  varying float vDisp;

  void main() {
    // fresnel: край ядра светится сильнее
    float fres = pow(1.0 - abs(vNormal.z), 2.2);
    float energy = smoothstep(-0.25, 0.45, vDisp);
    vec3 col = mix(uColorA, uColorB, energy);
    col += fres * uColorB * 1.35;
    // пульсация ядра
    float pulse = 0.82 + 0.18 * sin(uTime * 2.1);
    gl_FragColor = vec4(col * pulse, 1.0);
  }
`;

/** Пурпурный пульсар — ядро студии. Реагирует на мышь и смену частоты. */
export default function PulsarVoid() {
  const hostRef = useRef<HTMLDivElement>(null);
  const accentRef = useRef(new THREE.Color("#a855f7"));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      42,
      host.clientWidth / host.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 7.2);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return; // нет WebGL — фон остаётся CSS-градиентом
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    // на узких экранах отдаляем камеру, чтобы пульсар не съедал контент
    const fitCamera = () => {
      const aspect = host.clientWidth / Math.max(1, host.clientHeight);
      const zoomOut = THREE.MathUtils.clamp(1 / (aspect * 1.5), 1, 1.75);
      camera.position.z = 7.2 * zoomOut;
    };
    fitCamera();

    const group = new THREE.Group();
    scene.add(group);

    // ── ядро: шумовая деформация + fresnel ──
    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.34 },
      uColorA: { value: new THREE.Color("#2a0a4a") },
      uColorB: { value: accentRef.current.clone() },
    };
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.45, 48),
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        uniforms,
      })
    );
    group.add(core);

    // ── гало: аддитивная оболочка частиц ──
    const haloCount = 1400;
    const haloPos = new Float32Array(haloCount * 3);
    const haloSeed = new Float32Array(haloCount);
    for (let i = 0; i < haloCount; i++) {
      const r = 2.0 + Math.random() * 1.6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      haloPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      haloPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      haloPos[i * 3 + 2] = r * Math.cos(phi);
      haloSeed[i] = Math.random();
    }
    const haloGeo = new THREE.BufferGeometry();
    haloGeo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));
    haloGeo.setAttribute("aSeed", new THREE.BufferAttribute(haloSeed, 1));
    const haloMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: accentRef.current.clone() } },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        varying float vA;
        void main() {
          vec3 p = position;
          float sway = sin(uTime * (0.6 + aSeed) + aSeed * 40.0);
          p += normalize(p) * sway * 0.22;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = (1.6 + aSeed * 3.2) * (7.0 / -mv.z);
          vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 90.0));
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vA;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d) * vA;
          gl_FragColor = vec4(uColor, a * 0.85);
        }
      `,
    });
    const halo = new THREE.Points(haloGeo, haloMat);
    group.add(halo);

    // ── кольца пульсара ──
    const rings: THREE.Mesh[] = [];
    const ringSpecs: Array<[number, number, number, number]> = [
      [2.5, 0.02, 0.55, 0.24],
      [3.3, 0.015, -0.35, 0.16],
      [4.2, 0.01, 0.18, 0.1],
    ];
    for (const [r, tube, tilt, opacity] of ringSpecs) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, tube, 8, 128),
        new THREE.MeshBasicMaterial({
          color: accentRef.current.clone(),
          transparent: true,
          opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ring.rotation.x = Math.PI / 2 + tilt;
      rings.push(ring);
      group.add(ring);
    }

    // ── космическая пыль вокруг ──
    const dustCount = 700;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 22;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 14;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: new THREE.Color("#7e5cc8"),
        size: 0.035,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        sizeAttenuation: true,
      })
    );
    scene.add(dust);

    // ── взаимодействие: параллакс + drag с инерцией ──
    const mouse = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };
    const spin = {
      vx: reduced ? 0.0005 : 0.0016,
      vy: reduced ? 0.0003 : 0.0009,
      dx: 0,
      dy: 0,
    };
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      target.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      target.y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      if (dragging) {
        spin.dx = (e.clientX - lastX) * 0.006;
        spin.dy = (e.clientY - lastY) * 0.006;
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      // drag вращает пульсар только вне интерактивных элементов
      if (e.target instanceof Element && e.target.closest("a,button,input,[role='button']")) {
        return;
      }
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      // drag не должен выделять текст сцены
      document.body.style.userSelect = "none";
      window.getSelection()?.removeAllRanges();
    };
    const onPointerUp = () => {
      dragging = false;
      document.body.style.userSelect = "";
    };
    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
      fitCamera();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("resize", onResize);

    // ── смена частоты перекрашивает ядро ──
    let targetAccent = new THREE.Color("#a855f7");
    const unsub = useStation.subscribe((s) => {
      const accent = s.channel === 0 ? "#c084fc" : SIGNALS[s.channel - 1].accent;
      targetAccent.set(accent);
    });

    // таймер вместо deprecated THREE.Clock
    let elapsed = 0;
    let lastFrame = performance.now();
    let raf = 0;
    let running = true;
    const onVis = () => {
      running = document.visibilityState === "visible";
      lastFrame = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!running) return;
      const now = performance.now();
      const dt = Math.min(50, now - lastFrame);
      lastFrame = now;
      elapsed += dt / 1000;
      const t = elapsed;

      uniforms.uTime.value = t;
      haloMat.uniforms.uTime.value = t;

      // плавная перекраска
      accentRef.current.lerp(targetAccent, 0.04);
      (haloMat.uniforms.uColor.value as THREE.Color).copy(accentRef.current);
      (uniforms.uColorB.value as THREE.Color).copy(accentRef.current);
      for (const r of rings) {
        (r.material as THREE.MeshBasicMaterial).color.copy(accentRef.current);
      }

      // параллакс камеры
      mouse.x += (target.x - mouse.x) * 0.03;
      mouse.y += (target.y - mouse.y) * 0.03;
      camera.position.x = mouse.x * 0.7;
      camera.position.y = -mouse.y * 0.5;
      camera.lookAt(0, 0, 0);

      // вращение ядра + инерция drag
      if (!dragging) {
        spin.dx *= 0.95;
        spin.dy *= 0.95;
      }
      group.rotation.y += spin.vx + spin.dx;
      group.rotation.x += spin.vy + spin.dy;
      group.rotation.x = THREE.MathUtils.clamp(group.rotation.x, -1.2, 1.2);
      halo.rotation.y -= 0.0011;
      dust.rotation.y += 0.0004;
      rings.forEach((r, i) => {
        r.rotation.z += 0.0016 * (i % 2 === 0 ? 1 : -1);
      });

      // усиление амплитуды при настройке
      const { tuning } = useStation.getState();
      const ampTarget = tuning && !reduced ? 0.55 : 0.34;
      uniforms.uAmp.value += (ampTarget - uniforms.uAmp.value) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      unsub();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const m = obj.material as THREE.Material & { dispose?: () => void };
          if (m && typeof m.dispose === "function") m.dispose();
        }
      });
      host.removeChild(renderer.domElement);
    };
    // reduced используется только для амплитуды начальной настройки
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="fixed inset-0 -z-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
