"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";
import CopyEmail from "@/components/CopyEmail";
import Parallax from "@/components/Parallax";
import RoundedTransition from "@/components/RoundedTransition";
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
  const bioRef = useRef(null);
  const bioWordRefs = useRef([]);
  const contactRef = useRef(null);

  const headerHeight = () => headerRef.current?.offsetHeight ?? window.innerHeight;

  useEffect(() => {
    // Petit délai pour laisser la transition de page / le montage se terminer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const bio = bioRef.current;
    const bioWordElements = bioWordRefs.current;
    if (!bio) return;

    BIO_WORDS.forEach((_, index) => {
      const el = bioWordElements[index];
      if (el) el.style.color = DIM_COLOR;
    });

    // Illumination mot par mot du texte bio (comme sur GalleryContactSection)
    const onUpdate = () => {
      const bioRect = bio.getBoundingClientRect();
      const windowH = window.innerHeight;
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
              <Parallax
                as="span"
                className="title-1"
                trigger={headerRef}
                unit="px"
                from={0}
                to={() => -headerHeight() * 0.85}
                start="top top"
                end="bottom top"
              >
                <SplittingWrapperWord>Creative developer</SplittingWrapperWord>
              </Parallax>
            </div>
            <div className="page-about__title-line page-about__title-line--2">
              <Parallax
                as="span"
                className="title-2"
                trigger={headerRef}
                unit="px"
                from={0}
                to={() => -headerHeight() * 0.25}
                start="top top"
                end="bottom top"
              >
                <SplittingWrapperWord>&amp; front developer</SplittingWrapperWord>
              </Parallax>
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
                  <Parallax
                    as="span"
                    className="title-bio"
                    trigger={bioRef}
                    from={115}
                    to={0}
                    start="top 60%"
                    end="top 15%"
                    ease="power1.out"
                  >
                    <SplittingWrapperWord>Hello</SplittingWrapperWord>
                  </Parallax>
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

      {/* Transition arrondie dynamique au scroll (folionextv2) */}
      <RoundedTransition trigger={contactRef} />

      {/* Section Contact (folionextv2) */}
      <section className="section-contact" ref={contactRef}>
        <div className="inner-contact">
          <Parallax
            className="wrap-content"
            trigger={contactRef}
            unit="px"
            from={40}
            to={0}
            start="top bottom"
            end="top top"
          >
            <div className="inner-title">
              <h2 className="title-contact">
                <Parallax
                  as="span"
                  trigger={contactRef}
                  from={115}
                  to={0}
                  start="top 75%"
                  end="top 15%"
                  ease="power1.out"
                  exit={-30}
                  exitEnd="top -85%"
                >
                  Connectons-nous
                </Parallax>
              </h2>
            </div>
            <div className="wrap-email">
              <CopyEmail
                email="contactme@huguesleger.fr"
                className="section-contact__email-block"
                cursorLabel="Copy"
              />
            </div>
          </Parallax>
          <div className="inner-footer">
            <Footer className="site-footer--contact" />
          </div>
        </div>
      </section>
    </div>
  );
}
