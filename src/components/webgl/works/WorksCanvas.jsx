"use client";
/* eslint-disable react-hooks/immutability */

import { Suspense, useLayoutEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import WorksScene from "./WorksScene";

const FOV = 35;

function PixelPerspectiveCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const distance = size.height / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.fov = FOV;
    camera.near = 1;
    camera.far = distance * 6;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

export default function WorksCanvas({ projects, scrollRef, syncRef }) {
  return (
    <Canvas
      camera={{ fov: FOV, position: [0, 0, 1000] }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <PixelPerspectiveCamera />
      <Suspense fallback={null}>
        <WorksScene projects={projects} scrollRef={scrollRef} syncRef={syncRef} />
      </Suspense>
    </Canvas>
  );
}
