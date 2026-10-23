"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Environment,
  Float,
  Lightformer,
  OrbitControls,
  Sparkles,
  Stars,
  useGLTF,
} from "@react-three/drei";
import { Box3, MathUtils, Vector3 } from "three";
import gsap from "gsap";
import { cursorStore } from "@/lib/cursorStore";

const SPACEMAN_URL = "/models/spaceman.glb";
const MOON_URL = "/models/moon.glb";

const MOON_SIZE = 3.2;
const SPACEMAN_SIZE = 2.2;
const HOVER_SCALE = 1.12;
// Direction dans laquelle le spationaute flotte par rapport au centre de la lune (devant, en haut à droite)
const SPACEMAN_DIRECTION = new Vector3(0.75, 0.35, 0.6).normalize();
// Marge pour l'amplitude verticale de <Float>
const SPACEMAN_MARGIN = 0.3;

// Clone la scène GLTF, la recentre sur l'origine et calcule l'échelle pour qu'elle mesure `size`.
// `radius` est le rayon de la sphère englobante une fois mis à l'échelle.
function useFittedModel(url, size) {
  const { scene } = useGLTF(url);

  return useMemo(() => {
    const model = scene.clone(true);
    const box = new Box3().setFromObject(model);
    const dimensions = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());

    const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);

    model.position.sub(center);
    return { model, scale, radius: (dimensions.length() / 2) * scale };
  }, [scene, size]);
}

// Le curseur n'affiche un label qu'au survol d'un objet cliquable, le fond garde le curseur par défaut
function setCursorLabel(label) {
  if (label) cursorStore.set({ label, isHover: true });
  else cursorStore.reset();
}

// Groupe cliquable qui grossit légèrement au survol
function Hoverable({ label, onClick, children, ...props }) {
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
        onClick(ref.current);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        hovered.current = true;
        setCursorLabel(label);
      }}
      onPointerOut={() => {
        hovered.current = false;
        setCursorLabel("");
      }}
      {...props}
    >
      {children}
    </group>
  );
}

// Le spationaute perdu : il dérive devant la lune et fait un salto au clic.
// Il est placé assez loin pour que sa sphère englobante ne touche jamais la lune,
// quelle que soit sa rotation (dérive, salto) ou son agrandissement au survol.
function Spaceman() {
  const { model, scale, radius } = useFittedModel(SPACEMAN_URL, SPACEMAN_SIZE);
  const driftRef = useRef(null);
  const position = useMemo(() => {
    const distance = MOON_SIZE / 2 + radius * HOVER_SCALE + SPACEMAN_MARGIN;
    return SPACEMAN_DIRECTION.clone().multiplyScalar(distance);
  }, [radius]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    driftRef.current.rotation.z = Math.sin(t * 0.4) * 0.25;
    driftRef.current.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.4;
  });

  const handleClick = (target) => {
    gsap.to(target.rotation, {
      x: target.rotation.x - Math.PI * 2,
      duration: 1.4,
      ease: "power3.inOut",
    });
  };

  return (
    <group position={position}>
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.5}>
        <group ref={driftRef}>
          <Hoverable label="Salto !" onClick={handleClick}>
            <primitive object={model} scale={scale} />
          </Hoverable>
        </group>
      </Float>
    </group>
  );
}

// La lune : tourne lentement sur elle-même et accélère au clic
function Moon() {
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
    <group rotation={[0.2, 0, -0.15]}>
      <group ref={spinRef}>
        <Hoverable label="Spin" onClick={handleClick}>
          <primitive object={model} scale={scale} />
        </Hoverable>
      </group>
    </group>
  );
}

export default function NotFoundScene() {
  const reducedMotion = useMemo(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

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

      <Moon />
      <Spaceman />

      <OrbitControls
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

useGLTF.preload(SPACEMAN_URL);
useGLTF.preload(MOON_URL);
