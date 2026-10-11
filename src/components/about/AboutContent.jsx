"use client";

import { useEffect, useState } from "react";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import Footer from "@/components/layout/Footer";
import AboutCanvas from "./AboutCanvas";

export default function AboutContent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Petit délai pour laisser la transition de page / le montage se terminer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`page-about__wrap${isVisible ? " page-about--visible" : ""}`}>
      <header className="page-about__header">
        <div className="page-about__inner">
          <h1 className="page-about__title">
            <span className="title-1">
              <SplittingWrapperWord>Creative developer</SplittingWrapperWord>
            </span>
            <span className="title-2">
              <SplittingWrapperWord>& front developer</SplittingWrapperWord>
            </span>
          </h1>
        </div>
      </header>

      <section className="page-about__section page-about__bio" id="hello">
        <div className="page-about__inner">
          <div className="page-about__bio-grid">
            <div className="page-about__bio-media">
              <div className="page-about__canvas-container">
                <AboutCanvas image="/assets/4.webp" />
              </div>
            </div>

            <div className="page-about__bio-content">
              <h2 className="page-about__bio-title">
                <span className="title-bio">
                  <SplittingWrapperWord>Hello</SplittingWrapperWord>
                </span>
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
