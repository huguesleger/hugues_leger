"use client";

import { useRef } from "react";
import WorksCanvas from "./WorksCanvas";
import WorksLabels from "./WorksLabels";
import { useWorksScroll } from "@/hooks/useWorksScroll";

export default function WorksExperience({ title, projects }) {
  const containerRef = useRef(null);
  const syncRef = useRef({ activeIndex: 0, progress: 0, hidden: false });
  const scrollRef = useWorksScroll(containerRef);

  return (
    <div ref={containerRef} className="works">
      <div className="works__canvas">
        <WorksCanvas
          projects={projects}
          scrollRef={scrollRef}
          syncRef={syncRef}
        />
      </div>
      <WorksLabels title={title} projects={projects} syncRef={syncRef} />
    </div>
  );
}
