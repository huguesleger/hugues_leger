"use client";

import Parallax from "@/components/ui/Parallax";
import GlImage from "@/components/work-detail/GlImage";

const LAYOUT = [
  { className: "work-grid__item--tall", speed: 0 },
  { className: "work-grid__item--small", speed: 1.4 },
  { className: "work-grid__item--wide", speed: 0.6 },
];

export default function Grid({ images, title }) {
  return (
    <section className="work-grid">
      <div className="work-grid__layout">
        {images.slice(0, LAYOUT.length).map((src, i) => {
          const { className, speed } = LAYOUT[i];
          return (
            <Parallax
              key={src}
              speed={speed || undefined}
              className={`work-grid__item ${className}`}
            >
              <GlImage src={src} alt={`${title} — détail ${i + 1}`} />
              <span className="work-grid__caption">
                <span className="work-grid__caption-num">0{i + 1}</span>
                {title}
              </span>
            </Parallax>
          );
        })}
      </div>
    </section>
  );
}
