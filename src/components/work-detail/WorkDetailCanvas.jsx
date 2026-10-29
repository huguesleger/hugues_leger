"use client";
/* eslint-disable react-hooks/immutability */

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import {
  WORK_DETAIL_FRAGMENT_SHADER,
  WORK_DETAIL_VERTEX_SHADER,
} from "./workDetailShaders";

const FOV = 45;
// Vitesse Lenis (px / frame) correspondant à une déformation maximale.
const MAX_VELOCITY = 60;
const REVEAL_START = 0.88; // part du viewport où l'image commence à apparaître
const REVEAL_SPEED = 1.1;

const velocityState = { value: 0 };

/** Caméra en perspective où 1 unité = 1 pixel CSS sur le plan z = 0. */
function PixelPerspectiveCamera() {
  const { camera, size } = useThree();

  useLayoutEffect(() => {
    const distance = size.height / 2 / Math.tan((FOV * Math.PI) / 360);
    camera.fov = FOV;
    camera.near = 1;
    camera.far = distance * 4;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  return null;
}

/** Vitesse de scroll lissée et normalisée (-1..1), partagée par tous les plans. */
function ScrollVelocity({ reducedMotion }) {
  useFrame((_, delta) => {
    const raw = reducedMotion ? 0 : window.lenisInstance?.velocity ?? 0;
    const target = THREE.MathUtils.clamp(raw / MAX_VELOCITY, -1, 1);
    const ease = 1 - Math.pow(0.001, delta);
    velocityState.value += (target - velocityState.value) * ease;
  }, -1);
  return null;
}

function GlPlane({ el, src, reducedMotion }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const texture = useTexture(src);
  const { size } = useThree();
  const hoverRef = useRef({ active: false, mouse: new THREE.Vector2(0.5, 0.5) });
  const revealedRef = useRef(reducedMotion);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uSize: { value: new THREE.Vector2(1, 1) },
      uImage: {
        value: new THREE.Vector2(texture.image?.width || 1, texture.image?.height || 1),
      },
      uReveal: { value: reducedMotion ? 1 : 0 },
      uVelocity: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
    }),
    [texture, reducedMotion],
  );

  // Le plan est prêt : on masque l'image DOM qui servait de fallback.
  useEffect(() => {
    el.classList.add("is-gl");
    return () => el.classList.remove("is-gl");
  }, [el]);

  // Survol : le canvas ne capte pas la souris, on écoute la zone DOM.
  useEffect(() => {
    const target = el.closest("a") ?? el;
    const state = hoverRef.current;
    const onEnter = () => (state.active = true);
    const onLeave = () => {
      state.active = false;
      state.mouse.set(0.5, 0.5);
    };
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      state.mouse.set(
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      );
    };
    target.addEventListener("pointerenter", onEnter);
    target.addEventListener("pointerleave", onLeave);
    target.addEventListener("pointermove", onMove);
    return () => {
      target.removeEventListener("pointerenter", onEnter);
      target.removeEventListener("pointerleave", onLeave);
      target.removeEventListener("pointermove", onMove);
    };
  }, [el]);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    const material = materialRef.current;
    if (!mesh || !material) return;

    const rect = el.getBoundingClientRect();
    const visible =
      rect.width > 0 &&
      rect.bottom > -100 &&
      rect.top < size.height + 100 &&
      rect.right > -100 &&
      rect.left < size.width + 100;
    mesh.visible = visible;
    if (!visible) return;

    mesh.position.set(
      rect.left + rect.width / 2 - size.width / 2,
      size.height / 2 - (rect.top + rect.height / 2),
      0,
    );
    mesh.scale.set(rect.width, rect.height, 1);

    // R3F copie l'objet `uniforms` passé en prop : on passe par le matériau.
    const u = material.uniforms;
    u.uSize.value.set(rect.width, rect.height);
    u.uTime.value += delta;
    u.uVelocity.value = velocityState.value;

    if (!revealedRef.current && rect.top < size.height * REVEAL_START) {
      revealedRef.current = true;
    }
    if (revealedRef.current && u.uReveal.value < 1) {
      u.uReveal.value = Math.min(1, u.uReveal.value + delta * REVEAL_SPEED);
    }

    const hover = hoverRef.current;
    const hoverEase = 1 - Math.pow(0.002, delta);
    u.uHover.value += ((hover.active ? 1 : 0) - u.uHover.value) * hoverEase;
    u.uMouse.value.lerp(hover.mouse, hoverEase);
  });

  return (
    <mesh ref={meshRef} visible={false}>
      <planeGeometry args={[1, 1, 24, 24]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={WORK_DETAIL_VERTEX_SHADER}
        fragmentShader={WORK_DETAIL_FRAGMENT_SHADER}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Canvas fixe plein écran : chaque `[data-gl-src]` de la page devient un plan
 * dont la position et la taille suivent son emplacement DOM à chaque frame.
 */
export default function WorkDetailCanvas({ rootRef }) {
  const [items, setItems] = useState([]);
  const [reducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    setItems(
      Array.from(root.querySelectorAll("[data-gl-src]")).map((el) => ({
        el,
        src: el.dataset.glSrc,
      })),
    );
  }, [rootRef]);

  return (
    <div className="work-canvas" aria-hidden="true">
      <Canvas
        camera={{ fov: FOV, position: [0, 0, 1000] }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: "none" }}
      >
        <PixelPerspectiveCamera />
        <ScrollVelocity reducedMotion={reducedMotion} />
        {items.map(({ el, src }, i) => (
          <Suspense key={i} fallback={null}>
            <GlPlane el={el} src={src} reducedMotion={reducedMotion} />
          </Suspense>
        ))}
      </Canvas>
    </div>
  );
}
