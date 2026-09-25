'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import LiquidIntroScene from './LiquidIntroScene';

export default function LiquidIntroCanvas({ active = true }) {
  // On ne démonte plus le canvas pour éviter de recréer le contexte WebGL au retour
  // L'optimisation se fait via frameloop="demand" ou en désactivant le useFrame dans la scène si besoin

  return (
    <div className="liquid-intro-canvas">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <LiquidIntroScene active={active} />
        </Suspense>
      </Canvas>
    </div>
  );
}
