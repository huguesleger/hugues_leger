'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export const INTRO_WHEEL_THRESHOLD = 140;
const PREVIEW_MAX_Y_PERCENT = -12;
const IDLE_RESET_MS = 450;
/** Galerie : part plus bas (yPercent > 0) et remonte en même temps que l’intro wave */
const GALLERY_ENTER_Y_PERCENT = 14;

export function useHomeIntroTransition({ skipIntro = false } = {}) {
  const introPanelRef = useRef(null);
  const coverRef = useRef(null);
  const galleryRef = useRef(null);

  const [phase, setPhase] = useState(() =>
    skipIntro ? 'gallery' : 'intro'
  );

  const accumulatedRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const idleResetTimerRef = useRef(null);

  const unlockScroll = useCallback((resetScroll = true) => {
    document.documentElement.classList.remove('home-intro-lock');
    window.lenisInstance?.start();
    window.lenisInstance?.resize();
    if (resetScroll) {
      window.lenisInstance?.scrollTo(0, { immediate: true });
    }
    window.dispatchEvent(new CustomEvent('home-intro-complete'));
  }, []);

  const lockScroll = useCallback(() => {
    document.documentElement.classList.add('home-intro-lock');
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
    accumulatedRef.current = 0;

    gsap.to(intro, {
      yPercent: 0,
      duration: 0.65,
      ease: 'power2.out',
      overwrite: true,
    });
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

      const yPercent = PREVIEW_MAX_Y_PERCENT * progress;
      if (animate) {
        gsap.to(intro, {
          yPercent,
          duration: 0.2,
          ease: 'power2.out',
          overwrite: true,
        });
      } else {
        gsap.set(intro, { yPercent });
      }
    },
    []
  );

  const runExitTimeline = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    clearIdleReset();
    setPhase('transitioning');

    const intro = introPanelRef.current;
    const cover = coverRef.current;
    const gallery = galleryRef.current;
    if (!intro || !gallery) {
      setPhase('gallery');
      unlockScroll();
      isAnimatingRef.current = false;
      return;
    }

    const unwovenCanvas = gallery.querySelector('.unwoven-canvas');

    gsap.set(gallery, { visibility: 'visible' });
    if (unwovenCanvas) {
      gsap.set(unwovenCanvas, {
        yPercent: GALLERY_ENTER_Y_PERCENT,
        opacity: 0.85,
      });
    }

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      onComplete: () => {
        gsap.set(intro, { pointerEvents: 'none' });
        if (unwovenCanvas) {
          gsap.set(unwovenCanvas, { clearProps: 'transform,opacity' });
        }
        gsap.set(gallery, { clearProps: 'transform' });
        setPhase('gallery');
        unlockScroll();
        isAnimatingRef.current = false;
      },
    });

    tl.to(
      intro,
      {
        yPercent: -150,
        opacity: 0,
        duration: 1.2,
      },
      0
    );

    if (cover) {
      tl.to(cover, { opacity: 0, duration: 1.0 }, 0.15);
    }

    tl.to(
      gallery,
      {
        opacity: 1,
        duration: 1.2,
      },
      0
    );

    if (unwovenCanvas) {
      tl.to(
        unwovenCanvas,
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.2,
        },
        0
      );
    }
  }, [clearIdleReset, unlockScroll]);

  const handleScrollIntent = useCallback(
    (delta) => {
      if (isAnimatingRef.current) return;

      accumulatedRef.current = Math.max(
        0,
        Math.min(
          INTRO_WHEEL_THRESHOLD,
          accumulatedRef.current + delta
        )
      );

      const progress =
        accumulatedRef.current / INTRO_WHEEL_THRESHOLD;

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
      scheduleIdleReset();
    },
    [
      applyIntroPreview,
      releaseIntroPreview,
      runExitTimeline,
      scheduleIdleReset,
    ]
  );

  useEffect(() => {
    if (skipIntro) {
      const intro = introPanelRef.current;
      const cover = coverRef.current;
      const gallery = galleryRef.current;
      if (intro) {
        gsap.set(intro, {
          yPercent: -150,
          opacity: 0,
          pointerEvents: 'none',
        });
      }
      if (cover) gsap.set(cover, { opacity: 0, pointerEvents: 'none' });
      if (gallery) {
        gsap.set(gallery, { opacity: 1, visibility: 'visible', yPercent: 0 });
        const unwoven = gallery.querySelector('.unwoven-canvas');
        if (unwoven) gsap.set(unwoven, { yPercent: 0, opacity: 1 });
      }
      unlockScroll(false);
      return;
    }

    lockScroll();
    accumulatedRef.current = 0;
    applyIntroPreview(0);

    return () => {
      clearIdleReset();
      document.documentElement.classList.remove('home-intro-lock');
    };
  }, [
    applyIntroPreview,
    clearIdleReset,
    lockScroll,
    skipIntro,
    unlockScroll,
  ]);

  useEffect(() => {
    if (phase !== 'intro') return;

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

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [handleScrollIntent, phase]);

  return {
    phase,
    introPanelRef,
    coverRef,
    galleryRef,
    isGalleryActive: phase === 'gallery',
    isWaveActive: phase !== 'gallery',
  };
}
