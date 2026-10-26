"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Ajoute à `tl` la séquence « montée en masque » des mots du loader
 * (entrée, pause, sortie vers le haut). Utilisée par IntroLoader.
 */
export function appendWordsTimeline(tl, words) {
  words.forEach((word, i) => {
    const hold = i === words.length - 1 ? 0.55 : 0.4;
    tl.fromTo(
      word,
      { yPercent: 115 },
      { yPercent: 0, duration: 0.55, ease: "expo.out" },
      i === 0 ? "-=0.25" : ">",
    ).to(word, {
      yPercent: -115,
      duration: 0.4,
      ease: "power3.in",
      delay: hold,
    });
  });
  return tl;
}

/**
 * Liste de mots animés.
 * - variant "loader" : rend les mots masqués de l'intro ; l'animation est pilotée
 *   par le parent via `wordRefs` + `appendWordsTimeline`.
 * - variant "loop"   : boucle infinie fondu + glissement (page d'erreur).
 */
export default function WordSwitcher({
  words,
  variant = "loop",
  className = "",
  wordRefs,
}) {
  const rootRef = useRef(null);
  const loopRefs = useRef([]);

  useEffect(() => {
    if (variant !== "loop") return;

    const els = loopRefs.current.filter(Boolean);
    if (!els.length) return;

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(els[0], { opacity: 1, y: 0 });
      return;
    }

    gsap.set(els, { opacity: 0, y: 10 });

    const tl = gsap.timeline({ repeat: -1, delay: 0.3 });
    els.forEach((el) => {
      tl.to(el, { duration: 1, ease: "power3.out", y: 0, opacity: 1 }).to(
        el,
        {
          delay: 0.5,
          duration: 0.5,
          ease: "power1.inOut",
          y: -10,
          opacity: 0,
        },
      );
    });

    return () => {
      tl.kill();
    };
  }, [variant, words]);

  if (variant === "loader") {
    return words.map((word, i) => (
      <div key={word} className="intro-loader__word-mask">
        <span
          ref={(node) => {
            if (wordRefs) wordRefs.current[i] = node;
          }}
          className="intro-loader__word"
        >
          {word}
        </span>
      </div>
    ));
  }

  return (
    <div className={`change-word ${className}`.trim()} ref={rootRef}>
      {words.map((word, i) => (
        <div
          key={word}
          className="word"
          ref={(node) => {
            loopRefs.current[i] = node;
          }}
        >
          {word}
        </div>
      ))}
    </div>
  );
}
