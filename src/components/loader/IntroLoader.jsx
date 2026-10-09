"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import {
  INTRO_ENTERED_KEY,
  openIntroGate,
  shouldPlayIntroLoader,
} from "@/lib/introGate";

const WORDS = ["Hello", "Salut", "Patience ça arrive..."];
const NAME_LINES = [
  { text: "hugues", className: "bold" },
  { text: "leger", className: "" },
];
const LOAD_CAP_MS = 1200;

function waitForPageReady() {
  const load = new Promise((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", resolve, { once: true });
  });
  const cap = new Promise((resolve) => setTimeout(resolve, LOAD_CAP_MS));
  return Promise.all([document.fonts.ready, Promise.race([load, cap])]);
}

export default function IntroLoader() {
  const [shouldRender, setShouldRender] = useState(true);

  const loaderRef = useRef(null);
  const brandRef = useRef(null);
  const logoRef = useRef(null);
  const slotRef = useRef(null);
  const nameRef = useRef(null);
  const wordRefs = useRef([]);

  useEffect(() => {
    if (!shouldPlayIntroLoader()) {
      openIntroGate();
      const frame = requestAnimationFrame(() => setShouldRender(false));
      return () => cancelAnimationFrame(frame);
    }

    const loader = loaderRef.current;
    const brand = brandRef.current;
    const logo = logoRef.current;
    const slot = slotRef.current;
    const name = nameRef.current;
    const words = wordRefs.current.filter(Boolean);
    const chars = Array.from(name.querySelectorAll(".intro-loader__char-rise"));

    document.documentElement.classList.add("intro-loading");

    let cancelled = false;
    let exitTl = null;

    const slotWidth = slot.getBoundingClientRect().width;
    const nameWidth = name.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(brand).columnGap) || 0;
    // Le logo seul au centre, puis logo + nom centrés ensemble.
    const startX = (gap + slotWidth) / 2;
    const endX = (slotWidth - nameWidth) / 2;

    gsap.set(brand, { x: startX });
    gsap.set([logo, ...words, ...chars], { y: 0, yPercent: 115 });

    const introTl = gsap.timeline({ paused: true });

    introTl
      .to(logo, { yPercent: 0, duration: 0.75, ease: "expo.out" })
      .to(brand, { x: endX, duration: 0.8, ease: "power3.inOut" }, "+=0.1");

    words.forEach((word, i) => {
      const hold = i === words.length - 1 ? 0.55 : 0.4;
      introTl
        .fromTo(
          word,
          { yPercent: 115 },
          { yPercent: 0, duration: 0.55, ease: "expo.out" },
          i === 0 ? "-=0.25" : ">",
        )
        .to(word, {
          yPercent: -115,
          duration: 0.4,
          ease: "power3.in",
          delay: hold,
        });
    });

    introTl.to(
      chars,
      { yPercent: 0, duration: 0.48, ease: "expo.out", stagger: 0.013 },
      ">-0.05",
    );

    const runExit = () => {
      if (cancelled) return;
      exitTl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem(INTRO_ENTERED_KEY, "true");
          document.documentElement.classList.remove("intro-loading");
          document.documentElement.classList.add("intro-entered");
          setShouldRender(false);
        },
      });

      exitTl
        .to([logo, ...chars], {
          yPercent: -130,
          opacity: 0,
          duration: 0.36,
          ease: "power3.in",
          stagger: 0.01,
        })
        .add(() => openIntroGate(), 0.19)
        .fromTo(
          loader,
          { clipPath: "inset(0% 0% 0% 0%)" },
          {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: 1.08,
            ease: "power4.inOut",
          },
          0.19,
        );
    };

    const introDone = new Promise((resolve) => {
      introTl.eventCallback("onComplete", resolve);
    });

    document.fonts.ready.then(() => {
      if (!cancelled) introTl.play();
    });

    Promise.all([introDone, waitForPageReady()]).then(() => {
      gsap.delayedCall(0.35, runExit);
    });

    return () => {
      cancelled = true;
      introTl.kill();
      exitTl?.kill();
      document.documentElement.classList.remove("intro-loading");
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className="intro-loader" ref={loaderRef} aria-hidden="true">
      <div className="intro-loader__brand" ref={brandRef}>
        <div className="intro-loader__logo-mask">
          <img
            ref={logoRef}
            className="intro-loader__logo"
            src="/logo/logo.png"
            alt=""
          />
        </div>

        <div className="intro-loader__slot" ref={slotRef}>
          {WORDS.map((word, i) => (
            <div key={word} className="intro-loader__word-mask">
              <span
                ref={(node) => {
                  wordRefs.current[i] = node;
                }}
                className="intro-loader__word"
              >
                {word}
              </span>
            </div>
          ))}

          <div className="intro-loader__name" ref={nameRef}>
            {NAME_LINES.map((line) => (
              <div
                key={line.text}
                className={`intro-loader__name-line ${line.className}`}
              >
                {line.text.split("").map((char, i) => (
                  <span key={i} className="intro-loader__char-mask">
                    <span className="intro-loader__char-rise">{char}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
