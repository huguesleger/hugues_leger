"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import gsap from "gsap";
import { getIntroGate } from "@/lib/introGate";
import LostObjects from "./LostObjects";
import Moon from "./Moon";
import Spaceman from "./Spaceman";

const CAMERA_POSITION = [0, 1.2, 9];
const INTRO_CAMERA_POSITION = [0, 4, 26];

export default function NotFoundScene() {
  const camera = useThree((state) => state.camera);
  const controlsRef = useRef(null);
  const moonRef = useRef(null);
  const spacemanRef = useRef(null);
  const objectsRef = useRef(null);
  const locks = useRef(new Set());

  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  // Les contrôles de caméra sont coupés tant qu'un élément les verrouille (intro, glisser…)
  const setControlsLock = useCallback((key, locked) => {
    if (locked) locks.current.add(key);
    else locks.current.delete(key);
    if (controlsRef.current) controlsRef.current.enabled = locks.current.size === 0;
  }, []);

  // Avant la première image : tout est caché et la caméra est reculée pour l'intro
  useLayoutEffect(() => {
    if (reducedMotion) return;
    setControlsLock("intro", true);
    camera.position.set(...INTRO_CAMERA_POSITION);
    camera.lookAt(0, 0, 0);
    moonRef.current.scale.setScalar(0.001);
    objectsRef.current.items.forEach((item) => item.scale.setScalar(0.001));
    spacemanRef.current.prepareEntrance();
  }, [camera, reducedMotion, setControlsLock]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    let timeline = null;
    let cancelled = false;

    getIntroGate().then(() => {
      if (cancelled) return;
      const items = objectsRef.current.items.map((item) => item.scale);

      timeline = gsap
        .timeline({ onComplete: () => setControlsLock("intro", false) })
        .to(
          camera.position,
          {
            x: CAMERA_POSITION[0],
            y: CAMERA_POSITION[1],
            z: CAMERA_POSITION[2],
            duration: 2.8,
            ease: "power3.inOut",
            onUpdate: () => camera.lookAt(0, 0, 0),
          },
          0,
        )
        .to(moonRef.current.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: "back.out(1.4)" }, 0.3)
        .add(spacemanRef.current.entrance(), 1)
        .to(items, { x: 1, y: 1, z: 1, duration: 0.9, ease: "back.out(2)", stagger: 0.15 }, 1.8);
    });

    return () => {
      cancelled = true;
      timeline?.kill();
    };
  }, [camera, reducedMotion, setControlsLock]);

  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[6, 4, 5]} intensity={2.4} color="#fff1dc" />
      <directionalLight position={[-6, -2, -5]} intensity={2.5} color="#5b7cff" />

      <Environment resolution={256}>
        <Lightformer form="ring" intensity={2} color="#7d9bff" position={[-5, 3, -6]} scale={6} />
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[5, 5, 5]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#ff8a5c" position={[0, -5, 3]} scale={[8, 2, 1]} />
      </Environment>

      <Stars radius={60} depth={40} count={4000} factor={3} saturation={0} fade speed={0.6} />
      <Sparkles count={60} scale={[10, 6, 10]} size={2.5} speed={0.3} opacity={0.6} color="#cfd8ff" />

      <Moon ref={moonRef} />
      <Spaceman ref={spacemanRef} setControlsLock={setControlsLock} />
      <LostObjects ref={objectsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.06}
        minDistance={6.5}
        maxDistance={14}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        autoRotate={!reducedMotion}
        autoRotateSpeed={0.4}
      />
    </>
  );
}
