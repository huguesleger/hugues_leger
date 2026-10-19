"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const resolve = (v) => (typeof v === "function" ? v() : v);

function resolveTrigger(trigger, fallback) {
  if (!trigger) return fallback;
  if (typeof trigger === "string") return document.querySelector(trigger) ?? fallback;
  if ("current" in trigger) return trigger.current ?? fallback;
  return trigger;
}

/**
 * Parallaxe pilotée par le scroll (Lenis + ScrollTrigger).
 *
 * Deux modes :
 * - Vitesse : `speed` → l'élément se décale proportionnellement au scroll
 *   pendant sa traversée du viewport (équivalent data-scroll-speed).
 * - Keyframes : `from` → `to` entre `start` et `end` (avec `ease`), puis
 *   optionnellement `to` → `exit` entre `end` et `exitEnd` (linéaire).
 *
 * `from`, `to`, `exit` acceptent un nombre ou une fonction (réévaluée à chaque frame).
 */
export default function useParallax(ref, options = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const o = optionsRef.current;
    const axis = o.axis ?? "y";
    const isSpeed = o.speed != null;
    const unit = o.unit ?? (isSpeed ? "px" : "%");
    const prop = unit === "%" ? `${axis}Percent` : axis;
    const setValue = gsap.quickSetter(el, prop, unit === "%" ? "" : "px");

    const scroller = getScrollWrapper() ?? undefined;
    const trigger = resolveTrigger(o.trigger, el.parentElement ?? el);

    const start = isSpeed ? "top bottom" : o.start ?? "top bottom";
    const end = isSpeed ? "bottom top" : o.end ?? "top top";
    const ease = gsap.parseEase(o.ease ?? "none");
    let main = null;
    let exitST = null;

    const render = () => {
      if (!main) return;
      const opts = optionsRef.current;
      const scroll = main.scroll();

      if (isSpeed) {
        const amp = window.innerHeight * opts.speed * 0.1;
        const p = clamp01((scroll - main.start) / (main.end - main.start || 1));
        setValue(amp - 2 * amp * p);
        return;
      }

      const from = resolve(opts.from ?? 0);
      const to = resolve(opts.to ?? 0);
      const p = clamp01((scroll - main.start) / (main.end - main.start || 1));

      if (exitST && p >= 1) {
        const exit = resolve(opts.exit);
        const p2 = clamp01((scroll - exitST.start) / (exitST.end - exitST.start || 1));
        setValue(to + (exit - to) * p2);
        return;
      }
      setValue(from + (to - from) * ease(p));
    };

    const base = { trigger, scroller, onUpdate: render, onRefresh: render };

    main = ScrollTrigger.create({ ...base, start, end });
    if (!isSpeed && o.exit != null) {
      exitST = ScrollTrigger.create({ ...base, start: end, end: o.exitEnd ?? "bottom top" });
    }

    render();

    return () => {
      main.kill();
      exitST?.kill();
      gsap.set(el, { clearProps: prop });
    };
  }, [ref]);
}
