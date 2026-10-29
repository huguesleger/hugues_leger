"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";
import GlImage from "@/components/work-detail/GlImage";

gsap.registerPlugin(ScrollTrigger);

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
    <section ref={sectionRef} className="work-stage">
      <div className="work-stage__sticky">
        <GlImage src={image} alt={title} className="work-stage__media" />
        <div className="work-stage__captions" aria-hidden="true">
          <span className="work-stage__caption-title">{title}</span>
        </div>
      </div>
    </section>
  );
}
