"use client";

import { forwardRef, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import gsap from "gsap";
import MoonFlag from "./MoonFlag";
import { Hoverable, MOON_SIZE, useFittedModel } from "./sceneUtils";

const MOON_URL = "/models/moon.glb";

const Moon = forwardRef(function Moon(_, ref) {
  const { model, scale } = useFittedModel(MOON_URL, MOON_SIZE);
  const spinRef = useRef(null);
  const boost = useRef({ value: 0 });

  useFrame((_, delta) => {
    spinRef.current.rotation.y += delta * (0.05 + boost.current.value);
  });

  const handleClick = () => {
    gsap.fromTo(
      boost.current,
      { value: 2.5 },
      { value: 0, duration: 2.4, ease: "power3.out", overwrite: true },
    );
  };

  return (
    <group ref={ref}>
      <group rotation={[0.2, 0, -0.15]}>
        <group ref={spinRef}>
          <Hoverable label="Spin" onClick={handleClick}>
            <primitive object={model} scale={scale} />
            <MoonFlag />
          </Hoverable>
        </group>
      </group>
    </group>
  );
});

export default Moon;

useGLTF.preload(MOON_URL);
