"use client";

import { useEffect, useRef, useState } from "react";

const INTRO_DEG_PER_PROGRESS = 360;
const GALLERY_DEG_PER_PX = 0.16;
const INTRO_EXIT_EXTRA_DEG = 120;

export function useScrollExploreRotation(phase) {
  const rotationRef = useRef(0);
  const introBaseRef = useRef(0);
  const galleryScrollOffsetRef = useRef(0);
  const prevGalleryScrollRef = useRef(null);
  const reducedMotionRef = useRef(false);
  const [rotationDeg, setRotationDeg] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onChange = (e) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const publish = () => {
      setRotationDeg(rotationRef.current);
    };

    const onIntroProgress = (e) => {
      const progress = Number(e.detail) || 0;
      const introDeg =
        progress <= 1
          ? progress * INTRO_DEG_PER_PROGRESS
          : INTRO_DEG_PER_PROGRESS +
            (progress - 1) * INTRO_EXIT_EXTRA_DEG;
      introBaseRef.current = introDeg;
      rotationRef.current = introBaseRef.current + galleryScrollOffsetRef.current;
      publish();
    };

    window.addEventListener("intro-scroll-progress", onIntroProgress);
    return () =>
      window.removeEventListener("intro-scroll-progress", onIntroProgress);
  }, []);

  useEffect(() => {
    if (phase !== "gallery") {
      prevGalleryScrollRef.current = null;
      return;
    }

    const lenis = window.lenisInstance;
    if (!lenis) return;

    const syncScrollBaseline = () => {
      prevGalleryScrollRef.current = lenis.scroll;
    };

    syncScrollBaseline();

    const onScroll = () => {
      if (reducedMotionRef.current) return;

      const scroll = lenis.scroll;
      const prev = prevGalleryScrollRef.current;
      if (prev == null) {
        prevGalleryScrollRef.current = scroll;
        return;
      }

      const delta = scroll - prev;
      prevGalleryScrollRef.current = scroll;
      if (delta === 0) return;

      galleryScrollOffsetRef.current += delta * GALLERY_DEG_PER_PX;
      rotationRef.current =
        introBaseRef.current + galleryScrollOffsetRef.current;
      setRotationDeg(rotationRef.current);
    };

    lenis.on("scroll", onScroll);
    return () => {
      lenis.off("scroll", onScroll);
    };
  }, [phase]);

  return rotationDeg;
}
