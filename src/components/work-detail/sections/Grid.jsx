"use client";

import Parallax from "@/components/ui/Parallax";
import GlImage from "@/components/work-detail/GlImage";

const LAYOUT = [
  { className: "work-grid__item--tall", speed: 0 },
  { className: "work-grid__item--small", speed: 1.4 },
  { className: "work-grid__item--wide", speed: 0.6 },
];

export default function Grid({ items, title }) {
  return (
    <section className="work-grid">
      <div className="work-grid__layout">
        {items.slice(0, LAYOUT.length).map(({ image, caption }, i) => {
          const { className, speed } = LAYOUT[i];
          return (
            <Parallax
              key={image}
              speed={speed || undefined}
              className={`work-grid__item ${className}`}
            >
              <GlImage src={image} alt={caption || `${title} — détail ${i + 1}`} />
              <span className="work-grid__caption">
                <span className="work-grid__caption-num">0{i + 1}</span>
                {caption}
              </span>
            </Parallax>
          );
        })}
      </div>
    </section>
  );
}
