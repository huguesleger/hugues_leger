"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

// Singleton to trigger transition from anywhere
let triggerTransitionFn = null;
let triggerReverseTransitionFn = null;

export const triggerTransition = (bounds, src, id) => {
  if (triggerTransitionFn) triggerTransitionFn(bounds, src, id);
};

export const triggerReverseTransition = (src) => {
  if (triggerReverseTransitionFn) triggerReverseTransitionFn(src);
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
      setData({ bounds, src, id });
      setIsReverse(false);
      setActive(true);
    };
    triggerReverseTransitionFn = (src) => {
      setData(prev => ({ ...prev, src: src || prev.src }));
      setIsReverse(true);
      setActive(true);
    };
    return () => {
      triggerTransitionFn = null;
      triggerReverseTransitionFn = null;
    };
  }, []);

  useEffect(() => {
    if (active && bgRef.current) {
      if (!isReverse) {
        // --- FORWARD TRANSITION (WebGL Canvas handles image expansion) ---
        gsap.set(bgRef.current, {
          autoAlpha: 0,
          position: "fixed",
          inset: 0,
          backgroundColor: "var(--color-bg)",
          zIndex: 10000,
          pointerEvents: "none"
        });

        const tl = gsap.timeline({
          onComplete: () => {
            // Keep the image on screen for a moment while the new page renders, then hide it
            setTimeout(() => setActive(false), 300);
          },
        });

        // Fade in background smoothly behind the expanding 3D mesh
        // We must set z-index to -1 so it's BEHIND the canvas during forward transition!
        gsap.set(bgRef.current, { zIndex: -1 });
        
        // Prepare the static image but hide it initially
        if (imgRef.current && data.src) {
          gsap.set(imgRef.current, {
            autoAlpha: 0,
            top: 0, left: 0, height: "600px", width: "100vw",
            position: "fixed", zIndex: 10001,
          });
        }
        
        tl.to(bgRef.current, { autoAlpha: 1, duration: 1.0, ease: "power2.inOut" }, 0);
        
        // Exactly at the end of the 1s WebGL animation, snap the static HTML image over the canvas
        // This will cover the screen while Next.js changes the route, preventing any white flash.
        if (imgRef.current && data.src) {
          tl.set(imgRef.current, { autoAlpha: 1 }, 1.0);
        }
        
      } else {
        // --- REVERSE TRANSITION (Detail -> Home) ---
        // 1. Instantly navigate to home (loads behind the overlay)
        router.push('/', { scroll: false });

        // Wait, for Reverse transition, we want the WebGL Canvas to handle shrinking the image back!
        // But the WebGL canvas was destroyed. When we route back to '/', it re-mounts UnwovenCanvas.
        // We need to tell UnwovenCanvas to START in a "full screen" state and shrink!
        // For now, let's just fade out the black background and let the canvas appear.
        
        gsap.set(bgRef.current, {
          autoAlpha: 0, position: "fixed", inset: 0,
          backgroundColor: "var(--color-bg)", zIndex: -1,
        });

        // Show the static image perfectly overlapping the detail page image
        if (imgRef.current) {
          gsap.set(imgRef.current, {
            autoAlpha: 1,
            top: 0, left: 0, height: "600px", width: "100vw",
            position: "fixed", zIndex: 10001,
          });
        }

        const tl = gsap.timeline({
          onComplete: () => setActive(false),
        });

        if (imgRef.current) {
          tl.to(imgRef.current, { autoAlpha: 0, duration: 0.4, ease: "power2.inOut" }, 0.1);
        }
      }
    } 
  }, [active, data, isReverse, router]);

  if (!active) return null;

  return (
    <>
      <div ref={bgRef} />
      {data.src && (
        <div ref={imgRef} style={{ overflow: "hidden", pointerEvents: "none" }}>
          <img 
            src={data.src} 
            alt="" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        </div>
      )}
    </>
  );
}

