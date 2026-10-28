"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { Vector3 } from "three";
import { Hoverable, MOON_RADIUS, useFittedModel } from "./sceneUtils";

// Objets perdus dans l'espace : position de repos, taille et rotation propre
const OBJECTS = [
  {
    url: "/models/cap.glb",
    label: "Ma casquette !",
    size: 0.85,
    home: [-3.4, 1.7, -0.5],
    spin: [0.15, 0.35, 0.1],
  },
  {
    url: "/models/sneaker.glb",
    label: "Mes Air Max !",
    size: 0.95,
    home: [-1.8, 2.5, -2.4],
    spin: [0.3, 0.2, -0.15],
  },
  {
    url: "/models/burger.glb",
    label: "Mon burger !",
    size: 0.75,
    home: [1.1, -2.2, 0.8],
    spin: [-0.2, 0.3, 0.25],
  },
];

const PUSH_SPEED = 3.2;
const PUSH_SPIN = 5;
const RETURN_STIFFNESS = 1.4;
const RETURN_DAMPING = 1.3;
const SPIN_DAMPING = 1.2;

function LostObject({ url, label, size, home, spin }, ref) {
  const { model, scale } = useFittedModel(url, size);
  const pushRef = useRef(null);
  const spinRef = useRef(null);
  const homePosition = useMemo(() => new Vector3(...home), [home]);
  const baseSpin = useMemo(() => new Vector3(...spin), [spin]);
  const state = useRef({ velocity: new Vector3(), angular: new Vector3() });
  const temp = useMemo(() => new Vector3(), []);
  // Distance minimale au centre de la lune pour ne jamais la traverser
  const minDistance = MOON_RADIUS + size / 2 + 0.1;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { velocity, angular } = state.current;
    const offset = pushRef.current.position;
    const object = spinRef.current;

    // Ressort très doux : l'objet dérive puis revient lentement à sa place
    velocity.addScaledVector(offset, -RETURN_STIFFNESS * delta);
    velocity.multiplyScalar(Math.exp(-RETURN_DAMPING * delta));
    offset.addScaledVector(velocity, delta);

    temp.copy(homePosition).add(offset);
    if (temp.length() < minDistance) {
      temp.setLength(minDistance);
      offset.copy(temp).sub(homePosition);
      const normal = temp.normalize();
      const inward = velocity.dot(normal);
      if (inward < 0) velocity.addScaledVector(normal, -inward * 1.6);
    }

    angular.multiplyScalar(Math.exp(-SPIN_DAMPING * delta));
    object.rotation.x += (baseSpin.x + angular.x) * delta;
    object.rotation.y += (baseSpin.y + angular.y) * delta;
    object.rotation.z += (baseSpin.z + angular.z) * delta;
  });

  const handleClick = (_, event) => {
    const { velocity, angular } = state.current;
    velocity.addScaledVector(event.ray.direction, PUSH_SPEED);
    angular.set(
      (Math.random() - 0.5) * PUSH_SPIN * 2,
      (Math.random() - 0.5) * PUSH_SPIN * 2,
      (Math.random() - 0.5) * PUSH_SPIN * 2,
    );
  };

  return (
    <group ref={ref} position={homePosition}>
      <group ref={pushRef}>
        <Float speed={1.2 + size} rotationIntensity={0.3} floatIntensity={1}>
          <group ref={spinRef}>
            <Hoverable label={label} onClick={handleClick}>
              <primitive object={model} scale={scale} />
            </Hoverable>
          </group>
        </Float>
      </group>
    </group>
  );
}

const LostObjectWithRef = forwardRef(LostObject);

// `ref.current.items` expose les groupes des objets pour l'animation d'entrée
const LostObjects = forwardRef(function LostObjects(_, ref) {
  const items = useRef([]);
  useImperativeHandle(ref, () => ({ items: items.current }));

  return OBJECTS.map((object, index) => (
    <LostObjectWithRef
      key={object.url}
      ref={(element) => {
        items.current[index] = element;
      }}
      {...object}
    />
  ));
});

export default LostObjects;

OBJECTS.forEach(({ url }) => useGLTF.preload(url));
