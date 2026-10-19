"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getScrollY } from "@/lib/scroll";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";
import AboutCanvas from "./AboutCanvas";
import AboutCircleSection from "./AboutCircleSection";
import AboutToolkit from "./AboutToolkit";

const BIO_STATEMENT =
  "Hugues Leger, basé sur Montpellier. Toujours amoureux du code et du design, j'aime apprendre de nouvelles choses chaque jour et me lancer des défis avec de nouveaux projets, traduire des concepts en design visuel en prêtant une attention particulière aux détails, et les convertir en expériences hautement interactives.";
const BIO_WORDS = BIO_STATEMENT.split(" ");
const COLOR_DIM = { r: 180, g: 180, b: 180 };
const COLOR_BRIGHT = { r: 23, g: 23, b: 23 };
const DIM_COLOR = "rgb(180, 180, 180)";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerpColor(t) {
  const r = Math.round(COLOR_DIM.r + (COLOR_BRIGHT.r - COLOR_DIM.r) * t);
  const g = Math.round(COLOR_DIM.g + (COLOR_BRIGHT.g - COLOR_DIM.g) * t);
  const b = Math.round(COLOR_DIM.b + (COLOR_BRIGHT.b - COLOR_DIM.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function AboutContent() {
  const [isVisible, setIsVisible] = useState(false);
  const headerRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const bioRef = useRef(null);
  const bioTitleRef = useRef(null);
  const bioWordRefs = useRef([]);

  useEffect(() => {
    // Petit délai pour laisser la transition de page / le montage se terminer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const line1 = line1Ref.current;
    const line2 = line2Ref.current;
    const header = headerRef.current;
    const bio = bioRef.current;
    const bioTitle = bioTitleRef.current;
    const bioWordElements = bioWordRefs.current;
    if (!line1 || !line2) return;

    const setY1 = gsap.quickSetter(line1, "y", "px");
    const setY2 = gsap.quickSetter(line2, "y", "px");
    const setBioY = bioTitle ? gsap.quickSetter(bioTitle, "yPercent") : null;

    if (setBioY) {
      setBioY(115);
    }

    BIO_WORDS.forEach((_, index) => {
      const el = bioWordElements[index];
      if (el) el.style.color = DIM_COLOR;
    });

    const onUpdate = () => {
      const scrollY = getScrollY();
      const clamped = Math.max(0, scrollY);
      const maxDist = header ? header.offsetHeight * 1.5 : window.innerHeight * 1.5;

      // Parallax du titre principal dans le header
      if (clamped <= maxDist) {
        setY1(-clamped * 0.85);
        setY2(-clamped * 0.25);
      }

      // Parallax du titre Hello et illumination progressive du texte
      if (bio) {
        const bioRect = bio.getBoundingClientRect();
        const windowH = window.innerHeight;

        // 1. Parallax du titre Hello
        if (setBioY) {
          const start = windowH * 0.60;
          const end = windowH * 0.15;

          if (bioRect.top >= start) {
            setBioY(115);
          } else if (bioRect.top <= end) {
            setBioY(0);
          } else {
            const p = (start - bioRect.top) / (start - end);
            const pEased = p * (2 - p);
            setBioY((1 - pEased) * 115);
          }
        }

        // 2. Illumination mot par mot du texte bio (comme sur GalleryContactSection)
        const textStart = windowH * 0.40;
        const textEnd = windowH * -0.15;
        const textProgress = clamp((textStart - bioRect.top) / (textStart - textEnd), 0, 1);

        BIO_WORDS.forEach((_, index) => {
          const el = bioWordElements[index];
          if (!el) return;
          if (textProgress <= 0) {
            el.style.color = DIM_COLOR;
            return;
          }
          const wordProgress = clamp(textProgress * BIO_WORDS.length - index, 0, 1);
          el.style.color = lerpColor(wordProgress);
        });
      }
    };

    gsap.ticker.add(onUpdate);

    return () => {
      gsap.ticker.remove(onUpdate);
    };
  }, []);

  return (
    <div className={`page-about__wrap${isVisible ? " page-about--visible" : ""}`}>
      <header className="page-about__header" ref={headerRef}>
        <div className="page-about__inner">
          <h1 className="page-about__title">
            <div className="page-about__title-line page-about__title-line--1">
              <span className="title-1 title-parallax" ref={line1Ref}>
                <SplittingWrapperWord>Creative developer</SplittingWrapperWord>
              </span>
            </div>
            <div className="page-about__title-line page-about__title-line--2">
              <span className="title-2 title-parallax" ref={line2Ref}>
                <SplittingWrapperWord>& front developer</SplittingWrapperWord>
              </span>
            </div>
          </h1>
        </div>
      </header>

      <section className="page-about__section page-about__bio" id="hello" ref={bioRef}>
        <div className="page-about__inner">
          <div className="page-about__bio-grid">
            <div className="page-about__bio-media">
              <div className="page-about__canvas-container">
                <AboutCanvas image="/assets/4.webp" />
              </div>
            </div>

            <div className="page-about__bio-content">
              <h2 className="page-about__bio-title">
                <div className="page-about__bio-title-mask">
                  <span className="title-bio title-parallax" ref={bioTitleRef}>
                    <SplittingWrapperWord>Hello</SplittingWrapperWord>
                  </span>
                </div>
              </h2>
              <p className="page-about__bio-text">
                {BIO_WORDS.map((word, index) => (
                  <span
                    key={`${word}-${index}`}
                    ref={(node) => {
                      bioWordRefs.current[index] = node;
                    }}
                    className="page-about__bio-word"
                  >
                    {word}
                    {index < BIO_WORDS.length - 1 ? " " : ""}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AboutCircleSection />

      <AboutToolkit />

      <Footer className="site-footer--page-about" />
    </div>
  );
}
