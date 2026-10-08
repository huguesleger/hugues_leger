"use client";

import { useEffect, useRef } from "react";
import { WORKS_CONFIG } from "@/lib/worksLayout";

const DRAG_THRESHOLD = 6;

function normalizeWheel(e) {
  const factor = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
  const dx = e.deltaX * factor;
  const dy = e.deltaY * factor;
  return Math.abs(dx) > Math.abs(dy) ? dx : dy;
}

/**
 * Scroll virtuel : la page ne défile pas, on accumule wheel / touch / drag
 * dans `target` et `step()` lisse `current` à chaque frame.
 */
export function useWorksScroll(containerRef, { enabled = true } = {}) {
  const stateRef = useRef({
    target: 0,
    current: 0,
    velocity: 0,
    dragging: false,
    moved: false,
    locked: false,
  });

  useEffect(() => {
    if (!enabled) return;
    const state = stateRef.current;
    const container = containerRef.current;

    window.scrollTo(0, 0);
    document.documentElement.classList.add("is-works");

    let lenisFrame = 0;
    const stopLenis = () => {
      const lenis = window.lenisInstance;
      if (lenis) {
        lenis.scrollTo(0, { immediate: true, force: true });
        lenis.stop();
        return;
      }
      lenisFrame = requestAnimationFrame(stopLenis);
    };
    stopLenis();

    const push = (delta) => {
      if (state.locked) return;
      state.target = Math.max(0, state.target + delta);
    };

    const onWheel = (e) => {
      e.preventDefault();
      push(normalizeWheel(e) * WORKS_CONFIG.wheelMultiplier);
    };

    let lastX = 0;
    let lastY = 0;
    let startX = 0;
    let startY = 0;
    let pointerId = null;

    const onPointerDown = (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      pointerId = e.pointerId;
      state.dragging = true;
      state.moved = false;
      lastX = startX = e.clientX;
      lastY = startY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!state.dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      if (
        !state.moved &&
        Math.hypot(e.clientX - startX, e.clientY - startY) > DRAG_THRESHOLD
      ) {
        state.moved = true;
        document.documentElement.classList.add("is-works-dragging");
      }
      if (!state.moved) return;

      const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      push(-delta * WORKS_CONFIG.dragMultiplier);
    };

    const onPointerUp = (e) => {
      if (e.pointerId !== pointerId) return;
      pointerId = null;
      state.dragging = false;
      document.documentElement.classList.remove("is-works-dragging");
      // Laisse le click R3F lire `moved` avant de le réinitialiser.
      setTimeout(() => {
        state.moved = false;
      }, 0);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    container?.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(lenisFrame);
      window.lenisInstance?.start();
      document.documentElement.classList.remove("is-works", "is-works-dragging");
      window.removeEventListener("wheel", onWheel);
      container?.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [containerRef, enabled]);

  return stateRef;
}

/** Avance le lissage d'une frame ; `delta` en secondes. */
export function stepWorksScroll(state, delta) {
  const previous = state.current;
  const ease = 1 - Math.pow(1 - WORKS_CONFIG.lerp, delta * 60);
  state.current += (state.target - state.current) * ease;
  if (Math.abs(state.target - state.current) < 0.01) {
    state.current = state.target;
  }
  const frameVelocity = (state.current - previous) / Math.max(delta * 60, 0.0001);
  state.velocity += (frameVelocity - state.velocity) * 0.2;
}
