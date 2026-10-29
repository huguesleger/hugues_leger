"use client";

import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

// "Une *nuit sans fin*" → [{ word: "Une" }, { word: "nuit", strong }, …]
function parseStatement(text) {
  const words = text.split(/(\*[^*]+\*)/).flatMap((chunk) => {
    const strong = chunk.startsWith("*") && chunk.endsWith("*");
    const clean = strong ? chunk.slice(1, -1) : chunk;
    return clean
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => ({ word, strong }));
  });

  // La ponctuation seule (« . », « , ») reste collée au mot précédent.
  return words.reduce((acc, item) => {
    const prev = acc[acc.length - 1];
    if (prev && /^[.,;:!?…]+$/.test(item.word)) {
      prev.after = (prev.after ?? "") + item.word;
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

export default function Statement({ text }) {
  const sectionRef = useRef(null);
  const words = useMemo(() => parseStatement(text), [text]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = section.querySelectorAll(".work-statement__word");
    const tween = gsap.fromTo(
      targets,
      { opacity: 0.12 },
      {
        opacity: 1,
        ease: "none",
        stagger: 0.1,
        scrollTrigger: {
          trigger: section,
          scroller: getScrollWrapper() ?? undefined,
          start: "top 75%",
          end: "bottom 55%",
          scrub: true,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [words]);

  return (
    <section ref={sectionRef} className="work-statement">
      <span className="work-section-label">Intention</span>
      <p className="work-statement__text">
        {words.map(({ word, strong, after }, i) => (
          <span key={i} className="work-statement__word">
            {strong ? <strong>{word}</strong> : word}
            {after}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}
