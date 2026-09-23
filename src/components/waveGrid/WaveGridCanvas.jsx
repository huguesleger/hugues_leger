'use client';

import { Canvas } from '@react-three/fiber';
import WaveGridScene from './WaveGridScene';

export default function WaveGridCanvas({ active = true }) {
  return (
    <div className="wave-grid-canvas">
      <Canvas
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true }}
        frameloop={active ? 'always' : 'demand'}
        onCreated={({ gl }) => {
          gl.autoRender = false;
        }}
        camera={{ fov: 40, near: 0.1, far: 200, position: [0, 12, 0] }}
      >
        <WaveGridScene active={active} />
      </Canvas>
    </div>
  );
}
