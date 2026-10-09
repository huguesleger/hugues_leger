"use client";

import { useEffect, useRef } from "react";
import { GALLERY_PROJECTS } from "@/lib/galleryProjects";
import { getGalleryItemScreenLayout } from "@/lib/galleryLayout";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";

function getGalleryScroll() {
  const lenis = window.lenisInstance;
  if (lenis && typeof lenis.scroll === "number") {
    return lenis.scroll;
  }
  return window.scrollY;
}

export default function GalleryProjectLabels({ scrollEnabled, layoutSyncRef }) {
  const labelRefs = useRef([]);

  useEffect(() => {
    if (!scrollEnabled) return;

    let frameId = 0;

    const update = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = getGalleryScroll();
      const sync = layoutSyncRef?.current ?? {};
      const opacities = sync.opacities;
      const hideAll = sync.hideAll === true;

      GALLERY_PROJECTS.forEach((project, index) => {
        const el = labelRefs.current[index];
        if (!el) return;

        const layout = getGalleryItemScreenLayout(
          index,
          scrollY,
          viewportWidth,
          viewportHeight,
        );

        const materialOpacity = opacities?.[index] ?? 1;
        const opacity = hideAll ? 0 : materialOpacity;

        const margin = layout.cardHeight * 0.6;
        const inView =
          layout.centerY > -margin &&
          layout.centerY < viewportHeight + margin;

        const shouldShow = inView && opacity >= 0.02;

        if (!shouldShow) {
          el.style.visibility = "hidden";
          el.style.opacity = "0";
          el.classList.remove("gallery-project-label--visible");
          return;
        }

        el.style.visibility = "visible";
        el.style.opacity = String(opacity);
        el.classList.add("gallery-project-label--visible");

        el.style.top = `${layout.centerY}px`;
      });

      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);

    return () => cancelAnimationFrame(frameId);
  }, [scrollEnabled, layoutSyncRef]);

  if (!scrollEnabled) return null;

  return (
    <div className="gallery-project-labels" aria-hidden={false}>
      {GALLERY_PROJECTS.map((project, index) => (
        <div
          key={project.id}
          ref={(node) => {
            labelRefs.current[index] = node;
          }}
          className="gallery-project-label"
        >
          <div className="gallery-project-label__inner">
            <div className="gallery-project-label__text">
              <SplittingWrapperWord>{project.title}</SplittingWrapperWord>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
