"use client";

import { useEffect, useRef, useState } from "react";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import { getIntroGate } from "@/lib/introGate";

// Laisse le rideau de la transition de page se retirer avant l'entrée du titre.
const HEADING_REVEAL_DELAY_MS = 250;


export default function WorksLabels({ projects, syncRef }) {
  const rootRef = useRef(null);
  const headingRef = useRef(null);
  const titleRefs = useRef([]);
  const hintRef = useRef(null);
  const [headingVisible, setHeadingVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;
    getIntroGate().then(() => {
      if (cancelled) return;
      timeoutId = window.setTimeout(
        () => setHeadingVisible(true),
        HEADING_REVEAL_DELAY_MS,
      );
    });
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, []);
  useEffect(() => {
    let frameId = 0;
    let lastHoveredIndex = -1;
    let lastProgress = -1;

    const update = () => {
      const { progress, hidden, hoveredIndex } = syncRef.current;

      if (hoveredIndex !== lastHoveredIndex || progress !== lastProgress) {
        titleRefs.current.forEach((el, i) => {
          // Show title only when hovered and progress > 0.98 (in ribbon mode)
          const isActive = i === hoveredIndex && progress > 0.98;
          el?.classList.toggle("works-labels__title--active", isActive);
        });
        lastHoveredIndex = hoveredIndex;
        lastProgress = progress;
      }

      if (rootRef.current) {
        rootRef.current.style.opacity = hidden ? "0" : "1";
      }
      if (headingRef.current) {
        headingRef.current.style.opacity = hidden ? "0" : "1";
        headingRef.current.style.setProperty("--works-progress", progress.toFixed(3));
      }

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [syncRef]);

  return (
    <>
      <div ref={headingRef} className="works-labels__heading-layer">
        <h1
          className={`works-labels__heading${headingVisible ? " works-labels__heading--visible" : ""}`}
        >
          <span>
            <SplittingWrapperWord>Selected</SplittingWrapperWord>
          </span>
          <span>
            <SplittingWrapperWord>Works</SplittingWrapperWord>
          </span>
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
              <SplittingWrapperWord>{project.title}</SplittingWrapperWord>
            </div>
          ))}
        </div>

        <div ref={hintRef} className="works-labels__hint">
          Scroll / Drag
        </div>
      </div>
    </>
  );
}
