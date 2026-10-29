"use client";

import { useState } from "react";
import Gallery from "@/components/home/gallery/Gallery";
import LiquidIntroCanvas from "@/components/home/liquid-intro/LiquidIntroCanvas";
import { useHomeIntroTransition } from "@/hooks/useHomeIntroTransition";
import ScrollExploreBadge from "./ScrollExploreBadge";

export default function HomeExperience() {
  const [skipIntro] = useState(
    () =>
      typeof window !== "undefined" &&
      sessionStorage.getItem("returnTransitionFrom") != null,
  );

  const {
    phase,
    introPanelRef,
    coverRef,
    galleryRef,
    isGalleryActive,
    isWaveActive,
  } = useHomeIntroTransition({ skipIntro });

  const galleryScrollEnabled = phase === "gallery";

  return (
    <div className="home-experience">
      <div
        ref={galleryRef}
        className={`home-gallery${phase === "intro" ? " home-gallery--hidden" : ""}`}
      >
        <Gallery scrollEnabled={galleryScrollEnabled} />
      </div>

      <div ref={coverRef} className="home-intro-cover" aria-hidden="true" />

      <section
        ref={introPanelRef}
        className="home-intro"
        aria-labelledby="home-title"
      >
        {/* Le titre visible est dessiné dans le canvas. */}
        <h1 id="home-title" className="visually-hidden">
          Creative Developer
        </h1>
        <LiquidIntroCanvas active={isWaveActive} />
      </section>

      <ScrollExploreBadge phase={phase} />
    </div>
  );
}
