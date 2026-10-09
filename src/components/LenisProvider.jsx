"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Le scroll se fait dans un conteneur `position: fixed` (comme `#app` sur
 * l'ancien site) et non sur `window` : le document ne bouge jamais, donc la
 * barre d'URL mobile ne se masque pas et ne fait plus « sauter » la page.
 */
export default function LenisProvider({ children }) {
  const wrapperRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      eventsTarget: wrapper,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      // Le tactile est géré par Lenis : sur un élément `position: fixed`
      // (canvas plein écran), le scroll natif remonterait vers le document
      // et non vers le conteneur.
      syncTouch: true,
      syncTouchLerp: 0.08,
      touchMultiplier: 1.4,
    });

    window.lenisInstance = lenis;

    ScrollTrigger.defaults({ scroller: wrapper });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      if (window.lenisInstance === lenis) window.lenisInstance = null;
    };
  }, []);

  return (
    <div ref={wrapperRef} className="app-scroll" data-scroll-wrapper>
      <div ref={contentRef} className="app-scroll__content" data-scroll-content>
        {children}
      </div>
    </div>
  );
}
