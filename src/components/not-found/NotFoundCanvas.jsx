"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import NotFoundScene from "./NotFoundScene";

export default function NotFoundCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 1.2, 9], fov: 40 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <NotFoundScene />
      </Suspense>
    </Canvas>
  );
}
