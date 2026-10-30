"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { getGalleryItemScreenLayout } from "@/lib/galleryLayout";
import TransitionLink from "@/components/transition/TransitionLink";

function getGalleryScroll() {
  const lenis = window.lenisInstance;
  if (lenis && typeof lenis.scroll === "number") {
    return lenis.scroll;
  }
  return window.scrollY;
}

/**
 * Bouton « Voir + » qui suit le scroll virtuel de la galerie, juste sous la
 * dernière image. Il disparaît avec les images pendant les transitions.
 */
export default function GalleryWorksLink({
  projectCount,
  scrollEnabled,
  layoutSyncRef,
}) {
  const linkRef = useRef(null);

  useEffect(() => {
    if (!scrollEnabled || projectCount < 1) return;

    let frameId = 0;

    const update = () => {
      const el = linkRef.current;
      if (el) {
        const viewportHeight = window.innerHeight;
        const layout = getGalleryItemScreenLayout(
          projectCount - 1,
          getGalleryScroll(),
          window.innerWidth,
          viewportHeight,
        );
        const top = layout.centerY + layout.cardHeight / 2 + layout.gap * 2.5;

        const sync = layoutSyncRef?.current ?? {};
        const opacity = sync.hideAll
          ? 0
          : Math.min(1, ...(sync.opacities ?? [1]));
        const inView = top > -100 && top < viewportHeight;

        el.style.top = `${top}px`;
        el.style.opacity = String(opacity);
        el.style.visibility = inView && opacity > 0.02 ? "visible" : "hidden";
        el.style.pointerEvents = inView && opacity >= 0.99 ? "auto" : "none";
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [projectCount, scrollEnabled, layoutSyncRef]);

  if (!scrollEnabled) return null;

  return (
    <TransitionLink ref={linkRef} href="/works" className="gallery-works-link">
      <span className="gallery-works-link-text">En voir +</span>
      <span className="gallery-works-link-arrow" aria-hidden="true">
        <ArrowUpRight size={15} />
      </span>
    </TransitionLink>
  );
}
