"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";
import GlImage from "../GlImage";

gsap.registerPlugin(ScrollTrigger);

/**
 * Section « scène » : l'image part d'une petite carte et s'ouvre jusqu'au
 * plein écran pendant que la section reste collée au viewport.
 */
export default function Stage({ image, title }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      section.style.setProperty("--stage-p", "1");
      return;
    }

    const st = ScrollTrigger.create({
      trigger: section,
      scroller: getScrollWrapper() ?? undefined,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) =>
        section.style.setProperty("--stage-p", self.progress.toFixed(4)),
    });

    return () => st.kill();
  }, []);

  return (
    <section ref={sectionRef} className="rea-stage">
      <div className="rea-stage__sticky">
        <GlImage src={image} alt={title} className="rea-stage__media" />
        <div className="rea-stage__captions" aria-hidden="true">
          <span className="rea-stage__caption-title">{title}</span>
        </div>
      </div>
    </section>
  );
}
