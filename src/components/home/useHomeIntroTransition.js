"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";

export const INTRO_WHEEL_THRESHOLD = 140;
const PREVIEW_MAX_Y_PERCENT = -12;
const IDLE_RESET_MS = 450;
const INTRO_EXIT_DURATION = 1.2;
const GALLERY_FADE_DURATION = 0.85;
const GALLERY_RISE_DURATION = 0.9;

const GALLERY_ENTER_Y_PERCENT = 14;

export function useHomeIntroTransition({ skipIntro = false } = {}) {
  const introPanelRef = useRef(null);
  const coverRef = useRef(null);
  const galleryRef = useRef(null);

  const [phase, setPhase] = useState(() => (skipIntro ? "gallery" : "intro"));

  const accumulatedRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const idleResetTimerRef = useRef(null);

  const unlockScroll = useCallback((resetScroll = true) => {
    document.documentElement.classList.remove("home-intro-lock");
    window.lenisInstance?.start();
    window.lenisInstance?.resize();
    if (resetScroll) {
      window.lenisInstance?.scrollTo(0, { immediate: true });
    }
    window.dispatchEvent(new CustomEvent("home-intro-complete"));
  }, []);

  const lockScroll = useCallback(() => {
    document.documentElement.classList.add("home-intro-lock");
    window.lenisInstance?.stop();
  }, []);

  const clearIdleReset = useCallback(() => {
    if (idleResetTimerRef.current) {
      clearTimeout(idleResetTimerRef.current);
      idleResetTimerRef.current = null;
    }
  }, []);

  const releaseIntroPreview = useCallback(() => {
    const intro = introPanelRef.current;
    if (!intro || isAnimatingRef.current) return;

    clearIdleReset();
    const startProgress = accumulatedRef.current / INTRO_WHEEL_THRESHOLD;
    accumulatedRef.current = 0;
    gsap.to(
      { p: startProgress },
      {
        p: 0,
        duration: 0.65,
        ease: "power2.out",
        onUpdate: function () {
          const val = this.targets()[0].p;
          window.dispatchEvent(
            new CustomEvent("intro-scroll-progress", { detail: val }),
          );
          const opacity = 1 - val * 0.3;
          gsap.set(intro, { opacity });
        },
      },
    );
  }, [clearIdleReset]);

  const scheduleIdleReset = useCallback(() => {
    clearIdleReset();
    idleResetTimerRef.current = setTimeout(() => {
      if (
        accumulatedRef.current > 0 &&
        accumulatedRef.current < INTRO_WHEEL_THRESHOLD &&
        !isAnimatingRef.current
      ) {
        releaseIntroPreview();
      }
    }, IDLE_RESET_MS);
  }, [clearIdleReset, releaseIntroPreview]);

  const applyIntroPreview = useCallback(
    (progress, { animate = false } = {}) => {
      const intro = introPanelRef.current;
      if (!intro || isAnimatingRef.current) return;
      window.dispatchEvent(
        new CustomEvent("intro-scroll-progress", { detail: progress }),
      );

      if (animate) {
        gsap.to(intro, {
          duration: 0.2,
          ease: "power2.out",
          overwrite: true,
        });
      }
    },
    [],
  );

  const runExitTimeline = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    clearIdleReset();
    setPhase("transitioning");

    const intro = introPanelRef.current;
    const cover = coverRef.current;
    const gallery = galleryRef.current;
    if (!intro || !gallery) {
      setPhase("gallery");
      unlockScroll();
      isAnimatingRef.current = false;
      return;
    }

    const unwovenCanvas = gallery.querySelector(".unwoven-canvas");

    gsap.set(gallery, { visibility: "visible", opacity: 0 });
    if (unwovenCanvas) {
      window.dispatchEvent(new CustomEvent("prepare-gallery-enter"));
    }

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        if (unwovenCanvas) {
          gsap.set(unwovenCanvas, { clearProps: "opacity" });
        }
        gsap.set(gallery, { clearProps: "opacity,transform" });
        setPhase("gallery");
        unlockScroll();
        isAnimatingRef.current = false;
      },
    });

    gsap.set(intro, { pointerEvents: "none" });

    tl.addLabel("introExit", 0);
    tl.to(
      intro,
      {
        opacity: 0,
        duration: INTRO_EXIT_DURATION,
      },
      "introExit",
    );
    tl.add(() => {
      window.dispatchEvent(
        new CustomEvent("intro-scroll-progress", { detail: 1.5 }),
      );
    }, "introExit");

    if (cover) {
      tl.to(
        cover,
        { opacity: 0, duration: INTRO_EXIT_DURATION * 0.85 },
        "introExit+=0.12",
      );
    }

    tl.addLabel("galleryEnter", `introExit+=${INTRO_EXIT_DURATION}`);

    tl.to(
      gallery,
      {
        opacity: 1,
        duration: GALLERY_FADE_DURATION,
        ease: "power2.out",
      },
      "galleryEnter",
    );

    if (unwovenCanvas) {
      tl.add(() => {
        window.dispatchEvent(
          new CustomEvent("start-gallery-enter", {
            detail: { duration: GALLERY_RISE_DURATION },
          }),
        );
      }, "galleryEnter");
    }
  }, [clearIdleReset, unlockScroll]);

  const runEnterTimeline = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setPhase("transitioning");
    lockScroll();

    const intro = introPanelRef.current;
    const cover = coverRef.current;
    const gallery = galleryRef.current;

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        gsap.set(gallery, { visibility: "hidden", opacity: 0 });
        gsap.set(intro, { pointerEvents: "auto" });
        setPhase("intro");
        isAnimatingRef.current = false;
        accumulatedRef.current = 0;
      },
    });

    tl.addLabel("galleryExit", 0);
    tl.to(
      gallery,
      { opacity: 0, duration: GALLERY_FADE_DURATION },
      "galleryExit",
    );

    tl.addLabel("introEnter", `galleryExit+=${GALLERY_FADE_DURATION * 0.5}`);
    tl.to(intro, { opacity: 1, duration: INTRO_EXIT_DURATION }, "introEnter");

    const unwovenCanvas = gallery.querySelector(".unwoven-canvas");
    if (unwovenCanvas) {
      tl.add(() => {
        window.dispatchEvent(
          new CustomEvent("start-gallery-exit", {
            detail: { duration: INTRO_EXIT_DURATION },
          }),
        );
      }, "galleryExit");
    }
    window.dispatchEvent(
      new CustomEvent("intro-scroll-snap", { detail: -1.5 }),
    );
    tl.add(() => {
      gsap.to(
        { p: -1.5 },
        {
          p: 0,
          duration: INTRO_EXIT_DURATION,
          ease: "power2.out",
          onUpdate: function () {
            const val = this.targets()[0].p;
            window.dispatchEvent(
              new CustomEvent("intro-scroll-progress", { detail: val }),
            );
          },
        },
      );
    }, "introEnter");

    if (cover) {
      tl.to(cover, { opacity: 1, duration: INTRO_EXIT_DURATION }, "introEnter");
    }
  }, [lockScroll]);

  const handleScrollIntent = useCallback(
    (delta) => {
      if (isAnimatingRef.current) return;

      accumulatedRef.current = Math.max(
        0,
        Math.min(INTRO_WHEEL_THRESHOLD, accumulatedRef.current + delta),
      );

      const progress = accumulatedRef.current / INTRO_WHEEL_THRESHOLD;

      if (progress >= 1) {
        applyIntroPreview(1);
        runExitTimeline();
        return;
      }

      if (progress === 0) {
        releaseIntroPreview();
        return;
      }
      applyIntroPreview(progress, { animate: true });
    },
    [
      applyIntroPreview,
      releaseIntroPreview,
      runExitTimeline,
      scheduleIdleReset,
    ],
  );

  useEffect(() => {
    if (skipIntro) {
      const intro = introPanelRef.current;
      const cover = coverRef.current;
      const gallery = galleryRef.current;
      if (intro) {
        gsap.set(intro, {
          opacity: 0,
          pointerEvents: "none",
        });
        window.dispatchEvent(
          new CustomEvent("intro-scroll-snap", { detail: 1.5 }),
        );
      }
      if (cover) gsap.set(cover, { opacity: 0, pointerEvents: "none" });
      if (gallery) {
        gsap.set(gallery, { opacity: 1, visibility: "visible" });
        const unwovenCanvas = gallery.querySelector(".unwoven-canvas");
        if (unwovenCanvas) gsap.set(unwovenCanvas, { opacity: 1 });
      }
      unlockScroll(false);
      return;
    }

    lockScroll();
    accumulatedRef.current = 0;
    applyIntroPreview(0);

    const intro = introPanelRef.current;
    if (intro) gsap.set(intro, { pointerEvents: "auto" });

    return () => {
      clearIdleReset();
      document.documentElement.classList.remove("home-intro-lock");
    };
  }, [applyIntroPreview, clearIdleReset, lockScroll, skipIntro, unlockScroll]);

  useEffect(() => {
    if (phase !== "intro") return;

    const onWheel = (e) => {
      e.preventDefault();
      if (isAnimatingRef.current) return;
      handleScrollIntent(e.deltaY);
    };

    let touchStartY = 0;
    const onTouchStart = (e) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e) => {
      if (isAnimatingRef.current) return;
      const y = e.touches[0]?.clientY ?? touchStartY;
      const delta = touchStartY - y;
      touchStartY = y;
      if (delta === 0) return;

      e.preventDefault();
      handleScrollIntent(delta);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [handleScrollIntent, phase]);
  useEffect(() => {
    if (phase !== "gallery") return;

    const onWheelGallery = (e) => {
      if (isAnimatingRef.current) return;

      const lenis = window.lenisInstance;
      const scrollY = lenis ? lenis.scroll : window.scrollY;
      if (scrollY <= 0 && e.deltaY < -10) {
        runEnterTimeline();
      }
    };

    window.addEventListener("wheel", onWheelGallery, { passive: true });
    return () => window.removeEventListener("wheel", onWheelGallery);
  }, [phase, runEnterTimeline]);

  return {
    phase,
    introPanelRef,
    coverRef,
    galleryRef,
    isGalleryActive: phase === "gallery",
    isWaveActive: phase !== "gallery",
  };
}
