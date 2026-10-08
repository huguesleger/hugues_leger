"use client";

import { useEffect, useRef } from "react";

const pad = (n) => String(n).padStart(2, "0");

export default function WorksLabels({ projects, syncRef }) {
  const rootRef = useRef(null);
  const headingRef = useRef(null);
  const titleRefs = useRef([]);
  const counterRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    let frameId = 0;
    let lastIndex = -1;

    const update = () => {
      const { activeIndex, progress, hidden } = syncRef.current;

      if (activeIndex !== lastIndex) {
        titleRefs.current.forEach((el, i) => {
          el?.classList.toggle("works-labels__title--active", i === activeIndex);
        });
        if (counterRef.current) {
          counterRef.current.textContent = pad(activeIndex + 1);
        }
        lastIndex = activeIndex;
      }

      if (rootRef.current) {
        rootRef.current.style.opacity = hidden ? "0" : "1";
      }
      if (headingRef.current) {
        headingRef.current.style.opacity = hidden ? "0" : "1";
        headingRef.current.style.setProperty("--works-progress", progress.toFixed(3));
      }
      if (hintRef.current) {
        hintRef.current.style.opacity = String(1 - Math.min(1, progress * 2));
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [syncRef]);

  return (
    <>
      <div ref={headingRef} className="works-labels__heading-layer">
        <h1 className="works-labels__heading">
          <span>Selected</span>
          <span>Works</span>
        </h1>
      </div>

      <div ref={rootRef} className="works-labels">
        <div className="works-labels__titles">
          {projects.map((project, i) => (
            <div
              key={project.id}
              ref={(node) => {
                titleRefs.current[i] = node;
              }}
              className="works-labels__title"
            >
              <span>{project.title}</span>
            </div>
          ))}
        </div>

        <div className="works-labels__counter">
          <span ref={counterRef}>01</span>
          <span className="works-labels__counter-sep">/</span>
          <span>{pad(projects.length)}</span>
        </div>

        <div ref={hintRef} className="works-labels__hint">
          Scroll / Drag
        </div>
      </div>
    </>
  );
}
