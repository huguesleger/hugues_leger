"use client";

import { useEffect, useState } from "react";
import { getIntroGate } from "@/lib/introGate";
import { getScrollWrapper } from "@/lib/scroll";

/**
 * Passe à `true` (une seule fois) quand l'élément entre dans le viewport,
 * après l'ouverture du loader d'intro. Sert à déclencher les reveals Splitting.
 */
export default function useRevealOnView(ref, { delay = 0, threshold = 0.25 } = {}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;
    let timeoutId = 0;
    let observer = null;

    getIntroGate().then(() => {
      if (cancelled) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          timeoutId = window.setTimeout(() => setVisible(true), delay);
        },
        { root: getScrollWrapper(), threshold },
      );
      observer.observe(el);
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, [ref, delay, threshold]);

  return visible;
}
