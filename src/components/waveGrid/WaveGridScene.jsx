'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { WAVE_GRID_CONFIG, getGridBounds } from './constants';
import { useMouseTrail } from './useMouseTrail';
import WaveGridCamera from './WaveGridCamera';
import WaveGridInstancedMesh from './WaveGridInstancedMesh';
import WaveGridPostProcessing from './WaveGridPostProcessing';

export default function WaveGridScene({ active = true }) {
  const { camera, gl, scene } = useThree();
  const bounds = useMemo(() => getGridBounds(), []);

  const { uniforms: trailUniforms, update, rayPlane } = useMouseTrail({
    bounds,
    camera,
    domElement: gl.domElement,
    enabled: active,
  });

  useEffect(() => {
    scene.background = new THREE.Color(WAVE_GRID_CONFIG.colorBase).multiplyScalar(0.5);
  }, [scene]);

  useFrame((_, delta) => {
    if (active) update(delta);
  });

  return (
    <>
      <WaveGridCamera />
      <WaveGridInstancedMesh trailUniforms={trailUniforms} />
      <primitive object={rayPlane} />
      <WaveGridPostProcessing enabled={active} />
    </>
  );
}
