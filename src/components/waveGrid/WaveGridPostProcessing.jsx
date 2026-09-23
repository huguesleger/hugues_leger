'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { VignetteRGBShiftShader } from './VignetteRGBShiftShader';
import { WAVE_GRID_POST } from './constants';

export default function WaveGridPostProcessing({ enabled = true }) {
  const { gl, scene, camera, size } = useThree();
  const composerRef = useRef(null);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = WAVE_GRID_POST.toneMappingExposure;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap;
    gl.setClearColor('#808080');
  }, [gl]);

  useEffect(() => {
    const composer = new EffectComposer(gl);
    composer.addPass(new RenderPass(scene, camera));
    const vignettePass = new ShaderPass(VignetteRGBShiftShader);
    vignettePass.uniforms.shiftAmount.value = WAVE_GRID_POST.shiftAmount;
    vignettePass.uniforms.vignetteRadius.value = WAVE_GRID_POST.vignetteRadius;
    vignettePass.uniforms.vignetteSoftness.value = WAVE_GRID_POST.vignetteSoftness;
    composer.addPass(vignettePass);
    composer.addPass(new OutputPass());
    composerRef.current = composer;

    return () => {
      composer.dispose();
      composerRef.current = null;
    };
  }, [gl, scene, camera]);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    composer.setSize(size.width, size.height);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }, [size.height, size.width]);

  useFrame(() => {
    if (!enabled) return;
    composerRef.current?.render();
  }, 1);

  return null;
}
