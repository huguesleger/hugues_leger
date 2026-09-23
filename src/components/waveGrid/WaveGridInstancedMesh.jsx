'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { WAVE_GRID_CONFIG, WAVE_GRID_LIGHTING } from './constants';
import { overrideVertexShader, patchFragmentShader } from './shaderPatches';

function applyWaveUniforms(shader, trailUniforms, params) {
  shader.uniforms.uTrailTexture = trailUniforms.uTrailTexture;
  shader.uniforms.uTrailCount = trailUniforms.uTrailCount;
  shader.uniforms.uFadeTime = trailUniforms.uFadeTime;
  shader.uniforms.uWaveSpeed = { value: params.waveSpeed };
  shader.uniforms.uWaveFreq = { value: params.waveFrequency };
  shader.uniforms.uWaveWidth = { value: params.waveWidth };
  shader.uniforms.uAmplitude = { value: params.waveAmplitude };
  shader.uniforms.uJitter = { value: params.waveJitter };
  shader.uniforms.uMaxHeight = { value: params.waveMaxHeight };
  shader.uniforms.uColorBase = { value: new THREE.Color(params.colorBase) };
  shader.uniforms.uColorHigh = { value: new THREE.Color(params.colorHigh) };
  shader.vertexShader = overrideVertexShader(shader.vertexShader);
  shader.fragmentShader = patchFragmentShader(shader.fragmentShader);
}

export default function WaveGridInstancedMesh({ trailUniforms }) {
  const meshRef = useRef(null);
  const params = WAVE_GRID_CONFIG;
  const gridSize = params.gridSize;
  const count = gridSize * gridSize;

  const { geometry, offsetAttribute } = useMemo(() => {
    const geo = new THREE.BoxGeometry(
      params.cubeWidth,
      params.cubeHeight,
      params.cubeWidth
    );
    const offsets = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2);
    geo.setAttribute('aOffset', offsets);
    return { geometry: geo, offsetAttribute: offsets };
  }, [count, params.cubeHeight, params.cubeWidth]);

  const material = useMemo(() => {
    const mat = new THREE.MeshPhongMaterial({ color: 0xffffff });
    mat.onBeforeCompile = (shader) => {
      applyWaveUniforms(shader, trailUniforms, params);
    };
    return mat;
  }, [params, trailUniforms]);

  const depthMaterial = useMemo(() => {
    const mat = new THREE.MeshDepthMaterial();
    mat.onBeforeCompile = (shader) => {
      const mu = trailUniforms;
      shader.uniforms.uTrailTexture = mu.uTrailTexture;
      shader.uniforms.uTrailCount = mu.uTrailCount;
      shader.uniforms.uFadeTime = mu.uFadeTime;
      shader.uniforms.uWaveSpeed = { value: params.waveSpeed };
      shader.uniforms.uWaveFreq = { value: params.waveFrequency };
      shader.uniforms.uWaveWidth = { value: params.waveWidth };
      shader.uniforms.uAmplitude = { value: params.waveAmplitude };
      shader.uniforms.uJitter = { value: params.waveJitter };
      shader.uniforms.uMaxHeight = { value: params.waveMaxHeight };
      shader.vertexShader = overrideVertexShader(shader.vertexShader);
    };
    return mat;
  }, [params, trailUniforms]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    mesh.customDepthMaterial = depthMaterial;

    const dummy = new THREE.Object3D();
    const spacing = params.cubeWidth + params.gap;
    const offset = ((gridSize - 1) * spacing) / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const index = i * gridSize + j;
        const x = i * spacing - offset;
        const z = j * spacing - offset;
        dummy.position.set(x, 0, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
        offsetAttribute.setXY(index, x, z);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    offsetAttribute.needsUpdate = true;
  }, [depthMaterial, gridSize, offsetAttribute, params.cubeWidth, params.gap]);

  return (
    <>
      <ambientLight
        color={WAVE_GRID_LIGHTING.ambientColor}
        intensity={WAVE_GRID_LIGHTING.ambientIntensity}
      />
      <directionalLight
        color={WAVE_GRID_LIGHTING.directionalColor}
        intensity={WAVE_GRID_LIGHTING.directionalIntensity}
        position={[-20, 10, 6]}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={6}
        shadow-camera-near={0.1}
        shadow-camera-far={60}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={0.0001}
      />
      <directionalLight
        color={WAVE_GRID_LIGHTING.directional2Color}
        intensity={WAVE_GRID_LIGHTING.directional2Intensity}
        position={[10, 5, -3]}
      />
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, count]}
        castShadow
        receiveShadow
        frustumCulled={false}
      />
    </>
  );
}
