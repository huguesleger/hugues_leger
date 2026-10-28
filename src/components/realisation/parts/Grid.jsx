"use client";

import Parallax from "@/components/Parallax";
import GlImage from "../GlImage";

const LAYOUT = [
  { className: "rea-grid__item--tall", speed: 0 },
  { className: "rea-grid__item--small", speed: 1.4 },
  { className: "rea-grid__item--wide", speed: 0.6 },
];

/** Grille éditoriale asymétrique : trois images, vitesses de parallaxe différentes. */
export default function Grid({ images, title }) {
  return (
    <section className="rea-grid">
      <div className="rea-grid__layout">
        {images.slice(0, LAYOUT.length).map((src, i) => {
          const { className, speed } = LAYOUT[i];
          return (
            <Parallax
              key={src}
              speed={speed || undefined}
              className={`rea-grid__item ${className}`}
            >
              <GlImage src={src} alt={`${title} — détail ${i + 1}`} />
              <span className="rea-grid__caption">
                <span className="rea-grid__caption-num">0{i + 1}</span>
                {title}
              </span>
            </Parallax>
          );
        })}
      </div>
    </section>
  );
}
