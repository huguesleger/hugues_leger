"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { usePathname, useRouter } from "next/navigation";
import { getIntroGate, isIntroGateOpen } from "@/lib/introGate";

gsap.registerPlugin(CustomEase);

CustomEase.create("pageCurtain", "M0,0 C0.76,0 0.47,0.95 1,1");
CustomEase.create("pageReveal", "0.18,0.66,0.18,1");

const DURATION = 1;
const NAV_TIMEOUT_MS = 4000;

let transitionToFn = null;

export function transitionTo(href) {
  if (transitionToFn) transitionToFn(href);
}

function pathnameFromHref(href) {
  try {
    return new URL(href, window.location.origin).pathname;
  } catch {
    return href;
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const overlayRef = useRef(null);
  const backRef = useRef(null);
  const blockRef = useRef(null);
  const leavingRef = useRef(false);
  const pendingTargetRef = useRef(null);
  const timelineRef = useRef(null);
  const navTimeoutRef = useRef(null);
  const prevPathnameRef = useRef(pathname);

  const getWrapper = () => document.querySelector("[data-page-wrapper]");

  const parkBlock = (block) => {
    gsap.set(block, {
      x: 0,
      y: 0,
      xPercent: 0,
      yPercent: 102,
      force3D: false,
    });
  };

  const resetOverlay = () => {
    const overlay = overlayRef.current;
    const back = backRef.current;
    const block = blockRef.current;
    if (!overlay || !back || !block) return;

    gsap.set(overlay, { autoAlpha: 0, visibility: "hidden" });
    gsap.set(back, { opacity: 0 });
    parkBlock(block);
  };

  const resetWrapper = () => {
    const wrapper = getWrapper();
    if (!wrapper) return;
    wrapper.classList.remove("is-leaving");
    gsap.set(wrapper, { clearProps: "transform,y" });
  };

  const finishLeaving = () => {
    leavingRef.current = false;
    pendingTargetRef.current = null;
    window.clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = null;
    window.lenisInstance?.start();
  };

  const revealPage = () => {
    const targets = document.querySelectorAll("[data-page-reveal]");
    if (!targets.length) return;

    gsap.set(targets, { yPercent: 105 });
    gsap.to(targets, {
      yPercent: 0,
      duration: 1.2,
      ease: "pageReveal",
      stagger: 0.08,
    });
  };

  const onEnterComplete = () => {
    resetOverlay();
    resetWrapper();
    finishLeaving();
    revealPage();
  };

  useEffect(() => {
    const overlay = overlayRef.current;
    const back = backRef.current;
    const block = blockRef.current;
    if (!overlay || !back || !block) return;

    gsap.set(overlay, { autoAlpha: 0, visibility: "hidden" });
    gsap.set(back, { opacity: 0 });
    parkBlock(block);
  }, []);

  useEffect(() => {
    const pending = pendingTargetRef.current;
    if (!pending || !leavingRef.current) {
      prevPathnameRef.current = pathname;
      return;
    }

    if (pathname !== pending) return;

    window.clearTimeout(navTimeoutRef.current);
    navTimeoutRef.current = null;

    const lenis = window.lenisInstance;
    if (lenis) {
      lenis.scrollTo(0, { immediate: true, force: true });
      lenis.start();
    } else {
      window.scrollTo(0, 0);
    }

    onEnterComplete();
    prevPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    transitionToFn = async (href) => {
      const targetPath = pathnameFromHref(href);
      if (leavingRef.current || targetPath === pathname) return;

      if (!isIntroGateOpen()) {
        await getIntroGate();
      }

      if (prefersReducedMotion()) {
        router.push(href);
        return;
      }

      const overlay = overlayRef.current;
      const back = backRef.current;
      const block = blockRef.current;
      const wrapper = getWrapper();
      if (!overlay || !back || !block || !wrapper) {
        router.push(href);
        return;
      }

      leavingRef.current = true;
      pendingTargetRef.current = targetPath;
      router.prefetch(href);

      timelineRef.current?.kill();
      window.clearTimeout(navTimeoutRef.current);

      window.lenisInstance?.stop();
      wrapper.classList.add("is-leaving");

      gsap.set(overlay, { autoAlpha: 1, visibility: "visible" });
      gsap.set(back, { opacity: 0, y: 0, yPercent: 0 });
      parkBlock(block);
      gsap.set(wrapper, { x: 0, y: 0, xPercent: 0, yPercent: 0 });

      const tl = gsap.timeline({
        onComplete: () => {
          router.push(href, { scroll: false });
          navTimeoutRef.current = window.setTimeout(() => {
            if (leavingRef.current && pendingTargetRef.current === targetPath) {
              resetOverlay();
              resetWrapper();
              finishLeaving();
            }
          }, NAV_TIMEOUT_MS);
        },
      });

      timelineRef.current = tl;

      tl.to(
        block,
        { y: 0, yPercent: 0, duration: DURATION, ease: "pageCurtain" },
        0,
      );
      tl.to(back, { opacity: 1, duration: DURATION, ease: "power1.inOut" }, 0);
      tl.to(
        wrapper,
        { y: "-7rem", duration: DURATION, ease: "pageCurtain" },
        0,
      );
    };

    return () => {
      transitionToFn = null;
      timelineRef.current?.kill();
      window.clearTimeout(navTimeoutRef.current);
    };
  }, [pathname, router]);

  return (
    <div
      ref={overlayRef}
      className="page-transition"
      aria-hidden="true"
    >
      <div ref={backRef} className="page-transition__back" />
      <div ref={blockRef} className="page-transition__block" />
    </div>
  );
}
