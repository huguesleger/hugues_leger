"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

// Singleton to trigger transition from anywhere
let triggerTransitionFn = null;
let triggerReverseTransitionFn = null;

export const triggerTransition = (startBounds, imageSrc, projectId) => {
  if (triggerTransitionFn) triggerTransitionFn(startBounds, imageSrc, projectId);
};

export const triggerReverseTransition = () => {
  if (triggerReverseTransitionFn) triggerReverseTransitionFn();
};

export default function TransitionOverlay() {
  const [active, setActive] = useState(false);
  const [isReverse, setIsReverse] = useState(false);
  const [data, setData] = useState({ bounds: null, src: "", id: null });
  const imgRef = useRef(null);
  const bgRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    triggerTransitionFn = (bounds, src, id) => {
      sessionStorage.setItem('galleryScroll', window.scrollY);
      setData({ bounds, src, id });
      setIsReverse(false);
      setActive(true);
    };
    triggerReverseTransitionFn = () => {
      setIsReverse(true);
      setActive(true);
    };
    return () => {
      triggerTransitionFn = null;
      triggerReverseTransitionFn = null;
    };
  }, []);

  useEffect(() => {
    if (active && imgRef.current && data.bounds) {
      if (!isReverse) {
        // --- FORWARD TRANSITION (Home -> Detail) ---
        gsap.set(imgRef.current, {
          top: data.bounds.top,
          left: data.bounds.left,
          width: data.bounds.width,
          height: data.bounds.height,
          position: "fixed",
          zIndex: 10001,
        });

        gsap.set(bgRef.current, {
          autoAlpha: 0,
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--color-bg)",
          zIndex: 10000,
        });

        const tl = gsap.timeline({
          onComplete: () => {
            router.push(`/realisation/${data.id}`);
            setTimeout(() => setActive(false), 500);
          },
        });

        tl.to(bgRef.current, { autoAlpha: 1, duration: 0.4, ease: "power2.inOut" }, 0);
        tl.to(imgRef.current, {
          top: 0, left: 0, height: "100vh", width: "75vh",
          duration: 0.8, ease: "power3.inOut",
        }, 0);

      } else {
        // --- REVERSE TRANSITION (Detail -> Home) ---
        // 1. Instantly navigate to home (loads behind the overlay)
        router.push('/');

        // 2. Set overlay to full detail view state
        gsap.set(imgRef.current, {
          top: 0, left: 0, height: "100vh", width: "75vh",
          position: "fixed", zIndex: 10001,
        });
        gsap.set(bgRef.current, {
          autoAlpha: 1, position: "fixed", inset: 0,
          backgroundColor: "var(--color-bg)", zIndex: 10000,
        });

        // 3. Animate back to original WebGL bounds
        const tl = gsap.timeline({
          onComplete: () => setActive(false),
        });

        // Wait a tiny bit for the route to actually push and render the canvas underneath
        tl.to(bgRef.current, { autoAlpha: 0, duration: 0.6, ease: "power2.inOut" }, 0.2);
        tl.to(imgRef.current, {
          top: data.bounds.top,
          left: data.bounds.left,
          width: data.bounds.width,
          height: data.bounds.height,
          duration: 0.8, ease: "power3.inOut",
        }, 0);
      }
    } else if (active && isReverse && !data.bounds) {
      // If user reloaded on detail page, state is lost. Just route back natively.
      router.push('/');
      setActive(false);
    }
  }, [active, data, isReverse, router]);

  if (!active) return null;

  return (
    <>
      <div ref={bgRef} />
      <div ref={imgRef} style={{ overflow: "hidden" }}>
        <img 
          src={data.src} 
          alt="" 
          style={{ width: "100%", height: "100%", objectFit: "cover" }} 
        />
      </div>
    </>
  );
}
