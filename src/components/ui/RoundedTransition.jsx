"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

const getRoundHeight = () => (window.innerWidth >= 1200 ? 94 : 35);

/**
 * Dôme arrondi qui s'aplatit à mesure que la section `trigger`
 * (placée juste après) entre dans le viewport.
 */
export default function RoundedTransition({ trigger, color }) {
  const innerRef = useRef(null);

  useEffect(() => {
    const inner = innerRef.current;
    const triggerEl = trigger?.current;
    if (!inner || !triggerEl) return;

    const tween = gsap.fromTo(
      inner,
      { height: getRoundHeight },
      {
        height: 0,
        ease: "none",
        scrollTrigger: {
          trigger: triggerEl,
          scroller: getScrollWrapper() ?? undefined,
          start: "top bottom",
          end: "top top",
          scrub: true,
          invalidateOnRefresh: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(inner, { clearProps: "height" });
    };
  }, [trigger]);

  return (
    <div className="wrap-rounded" style={color ? { "--rounded-color": color } : undefined}>
      <div className="inner-rounded" ref={innerRef}>
        <div className="rounded" />
      </div>
    </div>
  );
}
