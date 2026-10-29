"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Intro from "@/components/work-detail/sections/Intro";
import Stage from "@/components/work-detail/sections/Stage";
import Statement from "@/components/work-detail/sections/Statement";
import Grid from "@/components/work-detail/sections/Grid";
import Sequence from "@/components/work-detail/sections/Sequence";
import Next from "@/components/work-detail/sections/Next";

const WorkDetailCanvas = dynamic(
  () => import("./WorkDetailCanvas"),
  { ssr: false },
);

export default function WorkDetail({ project, next, children }) {
  const rootRef = useRef(null);
  const [stageImage, ...rest] = project.images;

  return (
    <div ref={rootRef} className="work-detail">
      <Intro project={project}>
        {children}
      </Intro>
      <Stage image={stageImage} title={project.title} />
      <Statement text={project.statement} />
      <Grid images={rest.slice(0, 3)} title={project.title} />
      <Sequence images={[project.image, ...rest]} title={project.title} />
      <Next next={next} />
      <WorkDetailCanvas key={project.id} rootRef={rootRef} />
    </div>
  );
}
