"use client";

import { useRef } from "react";
import gsap from "gsap";
import { triggerReverseTransition } from "./TransitionOverlay";

const MIN_SCROLL_DURATION = 0.6;
const MAX_SCROLL_DURATION = 1.4;
const PX_PER_SECOND = 1800;

function smoothScrollToTop(onComplete) {
  const startY = window.lenisInstance?.scroll ?? window.scrollY;
  if (startY <= 1) {
    onComplete();
    return;
  }

  const duration = Math.min(
    MAX_SCROLL_DURATION,
    Math.max(MIN_SCROLL_DURATION, startY / PX_PER_SECOND),
  );
  const easing = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const lenis = window.lenisInstance;
  if (lenis) {
    lenis.scrollTo(0, {
      duration,
      easing,
      force: true,
      lock: true,
      onComplete,
    });
    return;
  }

  const state = { y: startY };
  gsap.to(state, {
    y: 0,
    duration,
    ease: "power3.inOut",
    onUpdate: () => window.scrollTo(0, state.y),
    onComplete,
  });
}

export default function BackButton({ id, src }) {
  const isLeavingRef = useRef(false);

  return (
    <button
      onClick={() => {
        if (isLeavingRef.current) return;
        isLeavingRef.current = true;

        smoothScrollToTop(() => {
          sessionStorage.setItem("returnTransitionFrom", id);
          triggerReverseTransition(src);
        });
      }}
      className="content__back back-button"
    >
      &larr; retour à la galerie
    </button>
  );
}
