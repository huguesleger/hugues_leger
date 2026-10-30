"use client";

import { useEffect, useRef, useState } from "react";
import SplittingWrapperWord from "@/components/ui/splitting/SplittingWrapperWord";
import { getIntroGate } from "@/lib/introGate";
import { WORKS_INTERACTIVE_PROGRESS } from "@/lib/worksLayout";

// Laisse le rideau de la transition de page se retirer avant l'entrée du titre.
const HEADING_REVEAL_DELAY_MS = 250;


export default function WorksLabels({ title, projects, syncRef }) {
  const rootRef = useRef(null);
  const headingRef = useRef(null);
  const titleRefs = useRef([]);
  const hintRef = useRef(null);
  const barRef = useRef(null);
  const currentRef = useRef(null);
  const paginationRef = useRef(null);
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
    let lastActiveIndex = -1;

    const update = () => {
      const { progress, hidden, hoveredIndex, activeIndex } = syncRef.current;

      paginationRef.current?.classList.toggle(
        "works-labels__pagination--visible",
        progress > 0.98,
      );

      if (activeIndex !== lastActiveIndex) {
        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${(activeIndex + 1) / projects.length})`;
        }
        if (currentRef.current) {
          currentRef.current.textContent = String(activeIndex + 1).padStart(2, "0");
        }
        lastActiveIndex = activeIndex;
      }

      if (hoveredIndex !== lastHoveredIndex || progress !== lastProgress) {
        titleRefs.current.forEach((el, i) => {
          const isActive = i === hoveredIndex && progress >= WORKS_INTERACTIVE_PROGRESS;
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
  }, [syncRef, projects.length]);

  return (
    <>
      <div ref={headingRef} className="works-labels__heading-layer">
        <h1
          className={`works-labels__heading${headingVisible ? " works-labels__heading--visible" : ""}`}
        >
          <span>
            <SplittingWrapperWord>{title.firstLine}</SplittingWrapperWord>
          </span>
          <span>
            <SplittingWrapperWord>{title.secondLine}</SplittingWrapperWord>
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

        <div className="works-labels__footer">
          <div ref={hintRef} className="works-labels__hint">
            Scroll / Drag
          </div>
          <div ref={paginationRef} className="works-labels__pagination">
            <span ref={currentRef} className="works-labels__pagination-number">
              01
            </span>
            <div className="works-labels__pagination-bar">
              <div ref={barRef} className="works-labels__pagination-line" />
            </div>
            <span className="works-labels__pagination-number">
              {String(projects.length).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
