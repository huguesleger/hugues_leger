"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { getScrollY } from "@/lib/scroll";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";
import AboutCanvas from "./AboutCanvas";

export default function AboutContent() {
  const [isVisible, setIsVisible] = useState(false);
  const headerRef = useRef(null);
  const line1Ref = useRef(null);
  const line2Ref = useRef(null);
  const bioRef = useRef(null);
  const bioTitleRef = useRef(null);

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
    if (!line1 || !line2) return;

    const setY1 = gsap.quickSetter(line1, "y", "px");
    const setY2 = gsap.quickSetter(line2, "y", "px");
    const setBioY = bioTitle ? gsap.quickSetter(bioTitle, "yPercent") : null;

    if (setBioY) {
      setBioY(115);
    }

    const onUpdate = () => {
      const scrollY = getScrollY();
      const clamped = Math.max(0, scrollY);
      const maxDist = header ? header.offsetHeight * 1.5 : window.innerHeight * 1.5;

      // Parallax du titre principal dans le header
      if (clamped <= maxDist) {
        // Le premier texte monte beaucoup plus vite que l'autre
        setY1(-clamped * 0.85);
        // Le second texte monte plus lentement
        setY2(-clamped * 0.25);
      }

      // Parallax du titre Hello : se déclenche une fois la section bien visible à l'écran
      if (setBioY && bio) {
        const bioRect = bio.getBoundingClientRect();
        const windowH = window.innerHeight;
        // On doit déjà voir la section (plus de 40% entrée dans l'écran) avant de déclencher la montée
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
                Hugues Leger, basé sur Montpellier. Toujours amoureux du code et
                du design, j&apos;aime apprendre de nouvelles choses chaque jour et me
                lancer des défis avec de nouveaux projets, traduire des concepts
                en design visuel en prêtant une attention particulière aux
                détails, et les convertir en expériences hautement interactives.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer className="site-footer--page-about" />
    </div>
  );
}
