'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import LiquidIntroScene from './LiquidIntroScene';

export default function LiquidIntroCanvas({ active = true }) {
  if (!active) return null;

  return (
    <div className="liquid-intro-canvas">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <LiquidIntroScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
