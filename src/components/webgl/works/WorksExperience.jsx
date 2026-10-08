"use client";

import { useRef } from "react";
import { GALLERY_PROJECTS } from "@/lib/galleryProjects";
import WorksCanvas from "./WorksCanvas";
import WorksLabels from "./WorksLabels";
import { useWorksScroll } from "./useWorksScroll";

export default function WorksExperience() {
  const containerRef = useRef(null);
  const syncRef = useRef({ activeIndex: 0, progress: 0, hidden: false });
  const scrollRef = useWorksScroll(containerRef);

  return (
    <div ref={containerRef} className="works">
      <div className="works__canvas">
        <WorksCanvas
          projects={GALLERY_PROJECTS}
          scrollRef={scrollRef}
          syncRef={syncRef}
        />
      </div>
      <WorksLabels projects={GALLERY_PROJECTS} syncRef={syncRef} />
    </div>
  );
}
