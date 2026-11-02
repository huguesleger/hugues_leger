"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getScrollWrapper } from "@/lib/scroll";

gsap.registerPlugin(ScrollTrigger);

// Structured Text DatoCMS → [{ word: "Une" }, { word: "NUIT", strong }, …]
// Chaque paragraphe commence par un retour à la ligne (`breakBefore`).
function parseStatement(document) {
  const paragraphs = (document?.children ?? []).filter((node) => node.type === "paragraph");
  const words = paragraphs.flatMap((paragraph, p) =>
    paragraph.children
      .filter((node) => node.type === "span")
      .flatMap((span) => {
        const strong = span.marks?.includes("strong") ?? false;
        return span.value
          .split(/\s+/)
          .filter(Boolean)
          .map((word) => ({ word, strong }));
      })
      .map((item, i) => (p > 0 && i === 0 ? { ...item, breakBefore: true } : item)),
  );

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

export default function Statement({ document }) {
  const sectionRef = useRef(null);
  const words = useMemo(() => parseStatement(document), [document]);

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
        {words.map(({ word, strong, after, breakBefore }, i) => (
          <Fragment key={i}>
            {breakBefore && <br />}
            <span className="work-statement__word">
              {strong ? <strong>{word}</strong> : word}
              {after}{" "}
            </span>
          </Fragment>
        ))}
      </p>
    </section>
  );
}
