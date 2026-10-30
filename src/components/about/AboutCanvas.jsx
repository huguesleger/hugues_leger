"use client";

import React, { useRef, useState, useMemo, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const ABOUT_VERTEX_SHADER = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uHover;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float dist = distance(uv, uMouse);
    float wave = sin(dist * 12.0 - uTime * 2.5) * 0.02 * uHover;
    pos.z += wave;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const ABOUT_FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform sampler2D uTexture;
  uniform vec2 uPlaneResolution;
  uniform vec2 uImageResolution;
  uniform float uTime;
  uniform float uHover;
  uniform vec2 uMouse;

  void main() {
    vec2 imageRes = uImageResolution;
    vec2 planeRes = uPlaneResolution;

    vec2 ratio = vec2(
      min((planeRes.x / planeRes.y) / (imageRes.x / imageRes.y), 1.0),
      min((planeRes.y / planeRes.x) / (imageRes.y / imageRes.x), 1.0)
    );

    vec2 uv = vec2(
      vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
      vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
    );

    // Aspect ratio correction for perfectly circular spotlight
    float aspect = planeRes.x / max(planeRes.y, 0.0001);
    vec2 aspectUv = vec2(vUv.x * aspect, vUv.y);
    vec2 aspectMouse = vec2(uMouse.x * aspect, uMouse.y);
    float dist = distance(aspectUv, aspectMouse);

    // Spotlight / B&W reveal factor around cursor (soft feathering)
    float radius = 0.32;
    float softness = 0.16;
    float circle = 1.0 - smoothstep(radius - softness, radius + softness, dist);
    float bwFactor = clamp(circle * uHover, 0.0, 1.0);

    // Interactive ripple focused around cursor
    float ripple = sin(dist * 16.0 - uTime * 3.0) * 0.012 * bwFactor;
    vec2 dir = aspectUv - aspectMouse;
    vec2 distortedUv = uv + normalize(dir + 0.0001) * ripple;

    // Distorted texture sample under cursor
    vec4 distortedTex = texture2D(uTexture, distortedUv);
    float gray = dot(distortedTex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 bwColor = vec3(gray);

    // Base texture (clean color outside cursor)
    vec4 baseTex = texture2D(uTexture, uv);
    vec3 colorRgb = baseTex.rgb;

    // Blend: full color by default -> black & white under the cursor
    vec3 finalColor = mix(colorRgb, bwColor, bwFactor);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function AboutImageMesh({ image }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const { viewport } = useThree();
  const texture = useTexture(image);

  const [hovered, setHovered] = useState(false);
  const mouseTarget = useRef(new THREE.Vector2(0.5, 0.5));

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uPlaneResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
      uImageResolution: {
        value: new THREE.Vector2(
          texture.image?.width || 1,
          texture.image?.height || 1
        ),
      },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    [texture, viewport.width, viewport.height]
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uPlaneResolution.value.set(
        viewport.width,
        viewport.height
      );
      if (texture.image) {
        materialRef.current.uniforms.uImageResolution.value.set(
          texture.image.width,
          texture.image.height
        );
      }
    }
  }, [viewport.width, viewport.height, texture]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uHover.value,
      hovered ? 1 : 0,
      delta * 4
    );
    materialRef.current.uniforms.uMouse.value.lerp(mouseTarget.current, delta * 5);

  });

  const handlePointerMove = (e) => {
    if (!e.uv) return;
    mouseTarget.current.set(e.uv.x, e.uv.y);
  };

  return (
    <mesh
      ref={meshRef}
      scale={[viewport.width * 1.02, viewport.height * 1.02, 1]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => {
        setHovered(false);
        mouseTarget.current.set(0.5, 0.5);
      }}
      onPointerMove={handlePointerMove}
    >
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={ABOUT_VERTEX_SHADER}
        fragmentShader={ABOUT_FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function AboutCanvas({ image }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="page-about__canvas-placeholder" />;
  }

  return (
    <div className="page-about__canvas-inner">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => gl.setClearColor("#ffffff", 1)}
        style={{ background: "#ffffff" }}
      >
        <Suspense fallback={null}>
          <AboutImageMesh image={image} />
        </Suspense>
      </Canvas>
    </div>
  );
}
