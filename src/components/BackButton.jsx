"use client";

import { useRef } from "react";
import gsap from "gsap";
import { MoveLeft } from "lucide-react";
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
      <MoveLeft className="back-button__arrow" size={18} aria-hidden="true" />
      {/* Même bascule au survol que les liens du header (.item / .item-hover). */}
      <span className="back-button__mask">
        <span className="back-button__wrap">
          <span className="back-button__label">retour à la galerie</span>
          <span className="back-button__label back-button__label--hover" aria-hidden="true">
            retour à la galerie
          </span>
        </span>
      </span>
    </button>
  );
}
