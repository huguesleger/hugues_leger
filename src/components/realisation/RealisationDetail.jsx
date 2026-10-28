"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import Intro from "./parts/Intro";
import Stage from "./parts/Stage";
import Statement from "./parts/Statement";
import Grid from "./parts/Grid";
import Sequence from "./parts/Sequence";
import Next from "./parts/Next";

const RealisationCanvas = dynamic(
  () => import("@/components/webgl/realisation/RealisationCanvas"),
  { ssr: false },
);

export default function RealisationDetail({ project, next, children }) {
  const rootRef = useRef(null);
  const [stageImage, ...rest] = project.images;

  return (
    <div ref={rootRef} className="rea-detail">
      <Intro project={project}>
        {children}
      </Intro>
      <Stage image={stageImage} title={project.title} />
      <Statement text={project.statement} />
      <Grid images={rest.slice(0, 3)} title={project.title} />
      <Sequence images={[project.image, ...rest]} title={project.title} />
      <Next next={next} />
      <RealisationCanvas key={project.id} rootRef={rootRef} />
    </div>
  );
}
