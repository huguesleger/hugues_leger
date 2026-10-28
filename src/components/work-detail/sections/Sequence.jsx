"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";
import GlImage from "@/components/work-detail/GlImage";

gsap.registerPlugin(ScrollTrigger);

export default function Sequence({ images, title }) {
  const sectionRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const setX = gsap.quickSetter(track, "x", "px");
    const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const st = ScrollTrigger.create({
      trigger: section,
      scroller: getScrollWrapper() ?? undefined,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: (self) => setX(-getDistance() * self.progress),
      onRefresh: (self) => setX(-getDistance() * self.progress),
    });

    return () => {
      st.kill();
      gsap.set(track, { clearProps: "x" });
    };
  }, [images.length]);

  return (
    <section
      ref={sectionRef}
      className="work-sequence"
      style={{ "--count": images.length }}
    >
      <div className="work-sequence__sticky">
        <div ref={trackRef} className="work-sequence__track">
          {images.map((src, i) => (
            <GlImage
              key={`${src}-${i}`}
              src={src}
              alt={`${title} — vue ${i + 1}`}
              className="work-sequence__item"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
