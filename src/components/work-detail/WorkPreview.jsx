"use client";

import { useLayoutEffect, useRef } from "react";
import {
  finishProjectTransition,
  isProjectTransitionActive,
} from "@/components/transition/TransitionOverlay";

/** Image d'en-tête : reçoit la relève de l'image de transition venue du canvas. */
export default function WorkPreview({ src, alt }) {
  const figureRef = useRef(null);

  // Avant la première peinture : l'en-tête doit être en haut, pile sous la relève.
  useLayoutEffect(() => {
    if (!isProjectTransitionActive()) return;
    window.lenisInstance?.scrollTo(0, { immediate: true, force: true });
    finishProjectTransition(figureRef.current);
  }, []);

  return (
    <figure ref={figureRef} className="work-preview">
      {/* Même URL que l'image de transition, sinon elle saute à l'arrivée. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} />
    </figure>
  );
}
