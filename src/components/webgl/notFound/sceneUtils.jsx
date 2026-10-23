"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, MathUtils, Vector3 } from "three";
import { cursorStore } from "@/lib/cursorStore";

export const MOON_SIZE = 3.2;
export const MOON_RADIUS = MOON_SIZE / 2;
export const HOVER_SCALE = 1.12;

// Clone la scène GLTF, la recentre sur l'origine et calcule l'échelle pour qu'elle mesure `size`.
// `radius` est le rayon de la sphère englobante une fois mis à l'échelle,
// `toLocal` convertit un point du GLB d'origine dans le repère où le modèle est affiché.
export function useFittedModel(url, size) {
  const { scene } = useGLTF(url);

  return useMemo(() => {
    const model = scene.clone(true);
    const box = new Box3().setFromObject(model);
    const dimensions = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);

    const origin = model.position.clone();
    const originScale = model.scale.x;
    model.position.sub(center);

    return {
      model,
      scale,
      radius: (dimensions.length() / 2) * scale,
      toLocal: (point) =>
        point.clone().sub(origin).multiplyScalar(scale / originScale).add(model.position),
    };
  }, [scene, size]);
}

// Le curseur n'affiche un label qu'au survol d'un objet cliquable, le fond garde le curseur par défaut
export function setCursorLabel(label) {
  if (label) cursorStore.set({ label, isHover: true });
  else cursorStore.reset();
}

// Groupe cliquable qui grossit légèrement au survol.
// `onHoverChange` est appelé à l'entrée et à la sortie du survol.
export function Hoverable({ label, onClick, onHoverChange, children, ...props }) {
  const ref = useRef(null);
  const hovered = useRef(false);

  useFrame((_, delta) => {
    const target = hovered.current ? HOVER_SCALE : 1;
    ref.current.scale.setScalar(MathUtils.damp(ref.current.scale.x, target, 8, delta));
  });

  return (
    <group
      ref={ref}
      onClick={(event) => {
        event.stopPropagation();
        onClick(ref.current, event);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        hovered.current = true;
        setCursorLabel(label);
        onHoverChange?.(true);
      }}
      onPointerOut={() => {
        hovered.current = false;
        setCursorLabel("");
        onHoverChange?.(false);
      }}
      {...props}
    >
      {children}
    </group>
  );
}
