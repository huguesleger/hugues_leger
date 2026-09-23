'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { MAX_TRAIL } from './constants';

export function useMouseTrail({ bounds, camera, domElement, enabled = true }) {
  const trailRef = useRef([]);
  const lastPointRef = useRef(null);
  const timeSinceLastMoveRef = useRef(0);
  const randomPointTimerRef = useRef(0);
  const isPlacingRandomRef = useRef(true);

  const paramsRef = useRef({
    fadeTime: 2.0,
    trailSpacing: 0.1,
  });

  const trailData = useMemo(() => new Float32Array(MAX_TRAIL * 4), []);

  const trailTexture = useMemo(() => {
    const texture = new THREE.DataTexture(
      trailData,
      MAX_TRAIL,
      1,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    texture.needsUpdate = true;
    return texture;
  }, [trailData]);

  const uniforms = useMemo(
    () => ({
      uTrailTexture: { value: trailTexture },
      uTrailCount: { value: 0 },
      uFadeTime: { value: paramsRef.current.fadeTime },
    }),
    [trailTexture]
  );

  const rayPlane = useMemo(() => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(bounds, bounds),
      new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, visible: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.updateMatrixWorld(true);
    return mesh;
  }, [bounds]);

  const mouseCoords = useMemo(() => new THREE.Vector2(), []);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    if (!domElement || !camera || !enabled) return;

    const onPointerMove = (e) => {
      const rect = domElement.getBoundingClientRect();
      mouseCoords.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouseCoords, camera);
      const hits = raycaster.intersectObject(rayPlane);
      if (hits.length === 0) return;

      const { x, z } = hits[0].point;
      let distDelta = 0;

      if (lastPointRef.current) {
        const dx = x - lastPointRef.current.x;
        const dz = z - lastPointRef.current.z;
        distDelta = Math.sqrt(dx * dx + dz * dz);
        if (distDelta < paramsRef.current.trailSpacing) return;
      }

      const trail = trailRef.current;
      if (trail.length >= MAX_TRAIL) trail.shift();
      trail.push({ x, z, age: 0, distDelta });
      lastPointRef.current = { x, z };

      timeSinceLastMoveRef.current = 0;
      isPlacingRandomRef.current = false;
      randomPointTimerRef.current = 0;
    };

    domElement.addEventListener('pointermove', onPointerMove);
    return () => domElement.removeEventListener('pointermove', onPointerMove);
  }, [camera, domElement, enabled, mouseCoords, rayPlane, raycaster]);

  const addRandomPoint = () => {
    const x = (Math.random() * 0.5 - 0.25) * bounds;
    const z = (Math.random() * 0.5 - 0.25) * bounds;
    const distDelta = 0.8 + Math.random() * 0.2;
    const trail = trailRef.current;
    if (trail.length >= MAX_TRAIL) trail.shift();
    trail.push({ x, z, age: 0, distDelta });
  };

  const update = (delta) => {
    if (!enabled) return;

    const params = paramsRef.current;
    const expiry = params.fadeTime * 4;
    const trail = trailRef.current;

    for (let i = trail.length - 1; i >= 0; i--) {
      trail[i].age += delta;
      if (trail[i].age > expiry) trail.splice(i, 1);
    }

    timeSinceLastMoveRef.current += delta;
    if (timeSinceLastMoveRef.current >= 3.0 && !isPlacingRandomRef.current) {
      isPlacingRandomRef.current = true;
      randomPointTimerRef.current = 0;
    }

    if (isPlacingRandomRef.current) {
      randomPointTimerRef.current += delta;
      if (randomPointTimerRef.current >= 1.5) {
        addRandomPoint();
        randomPointTimerRef.current = 0;
      }
    }

    const count = Math.min(trail.length, MAX_TRAIL);
    if (count > 0 || uniforms.uTrailCount.value > 0) {
      for (let i = 0; i < count; i++) {
        const ti = i * 4;
        trailData[ti] = trail[i].x;
        trailData[ti + 1] = trail[i].z;
        trailData[ti + 2] = trail[i].age;
        trailData[ti + 3] = trail[i].distDelta;
      }
      trailTexture.needsUpdate = true;
      uniforms.uTrailCount.value = count;
    }
  };

  useEffect(() => {
    return () => trailTexture.dispose();
  }, [trailTexture]);

  return { uniforms, update, rayPlane };
}
