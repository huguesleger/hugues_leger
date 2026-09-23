'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { WAVE_GRID_CAMERA } from './constants';

export default function WaveGridCamera() {
  const { camera, size } = useThree();
  const mouse = useRef(new THREE.Vector2(0, 0));
  const lerpedMouse = useRef(new THREE.Vector2(0, 0));
  const cfg = WAVE_GRID_CAMERA;

  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useFrame(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    lerpedMouse.current.x += (mouse.current.x - lerpedMouse.current.x) * cfg.mouseLerp;
    lerpedMouse.current.y += (mouse.current.y - lerpedMouse.current.y) * cfg.mouseLerp;

    const mx = lerpedMouse.current.x;
    const my = lerpedMouse.current.y;
    const alpha = my * cfg.alphaRange;
    const beta = mx * cfg.betaRange;
    const r = cfg.radius;

    camera.position.set(
      -r * Math.cos(alpha) * Math.sin(beta),
      r * Math.cos(alpha) * Math.cos(beta),
      r * Math.sin(alpha)
    );
    camera.up.set(0, 0, -1);
    camera.lookAt(0, 0, 0);
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  });

  return null;
}
