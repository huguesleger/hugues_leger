"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { getScrollY } from "@/lib/scroll";
import CircleText from "./CircleText";

const DESIGN_TEXTS = [
  "Dessins Maquettes Typographies Webdesign Visuels",
  "Illustrations Vectorielle Tablette Graphique Couleurs",
  "Graphisme Design Conception Retouches",
  "Logos Chartes graphiques Identitees",
];

const DEV_TEXTS = [
  "Interface Structure Interaction Responsive Accessibilite",
  "Animations Creativite Exploration Innovation Immersion",
  "Typographie Concept Motion Prototypage Esthetique",
  "WebGL Three.js Shader Interactivite Emotion",
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default function AboutCircleSection() {
  const trackRef = useRef(null);
  const curtainRef = useRef(null);
  const curtainInnerRef = useRef(null);
  const circle1Ref = useRef(null);
  const circle2Ref = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    const curtain = curtainRef.current;
    const curtainInner = curtainInnerRef.current;
    const svg1 = circle1Ref.current;
    const svg2 = circle2Ref.current;

    if (!track || !curtain || !curtainInner) return;

    // QuickSetters pour le rideau de fond et la contre-translation du contenu
    const setCurtainX = gsap.quickSetter(curtain, "xPercent");
    const setCurtainInnerX = gsap.quickSetter(curtainInner, "xPercent");

    const group1 = svg1 ? svg1.querySelector(".circles-group") : null;
    const group2 = svg2 ? svg2.querySelector(".circles-group") : null;

    const onUpdate = () => {
      const rect = track.getBoundingClientRect();
      const windowH = window.innerHeight;
      const totalScrollable = track.offsetHeight - windowH;

      if (totalScrollable <= 0) return;

      // Progression du scroll dans la section (0 à 1)
      const progress = clamp(-rect.top / totalScrollable, 0, 1);

      // Le fond blanc (curtain) glisse de la droite (100%) vers la gauche (0%)
      const offsetPercent = (1 - progress) * 100;
      setCurtainX(offsetPercent);

      // Le contenu intérieur est contre-translaté de la même valeur exacte (-offsetPercent),
      // garantissant que le cercle reste ABSOLUMENT FIXE au centre de l'écran pendant que le fond se déplace !
      setCurtainInnerX(-offsetPercent);

      // Rotation continue au scroll (autour du centre absolu 700.5, 700.5)
      const scrollY = getScrollY();
      const angle = scrollY / 10;

      if (group1) {
        group1.setAttribute("transform", `rotate(${angle} 700.5 700.5)`);
      }
      if (group2) {
        group2.setAttribute("transform", `rotate(${angle} 700.5 700.5)`);
      }
    };

    gsap.ticker.add(onUpdate);

    return () => {
      gsap.ticker.remove(onUpdate);
    };
  }, []);

  return (
    <section className="page-about__circle-track" ref={trackRef}>
      <div className="page-about__circle-sticky">
        {/* Calque 1 de base : Fond sombre (CircleText Design & Graphisme) */}
        <div className="page-about__circle-layer page-about__circle-layer--dark">
          <div className="page-about__circle-container">
            <CircleText
              ref={circle1Ref}
              idPrefix="design-circle"
              texts={DESIGN_TEXTS}
              theme="dark"
            />
          </div>
        </div>

        {/* Calque 2 (Curtain) : Fond blanc qui glisse au scroll avec contre-translation du cercle */}
        <div
          className="page-about__circle-layer page-about__circle-layer--light page-about__circle-curtain"
          ref={curtainRef}
        >
          <div
            className="page-about__circle-curtain-inner"
            ref={curtainInnerRef}
          >
            <div className="page-about__circle-container">
              <CircleText
                ref={circle2Ref}
                idPrefix="dev-circle"
                texts={DEV_TEXTS}
                theme="light"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
