"use client";
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CanvasTexture, DoubleSide, PlaneGeometry, Quaternion, SRGBColorSpace, Vector3 } from "three";
import gsap from "gsap";
import { MOON_RADIUS, setCursorLabel } from "./sceneUtils";

const POLE_HEIGHT = 0.62;
const POLE_RADIUS = 0.012;
const CLOTH_WIDTH = 0.42;
const CLOTH_HEIGHT = 0.26;
// Le mât s'enfonce légèrement dans le sol lunaire
const SINK = 0.03;
// Emplacement de départ, dans le repère de la lune (en haut, côté caméra)
const START_DIRECTION = new Vector3(0.3, 0.88, 0.38).normalize();
const UP = new Vector3(0, 1, 0);

function createFlagTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0d1230";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ff8a3d";
  ctx.lineWidth = 14;
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 170px Jost, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("404", canvas.width / 2, canvas.height / 2 + 8);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Direction aléatoire sur l'hémisphère supérieur de la lune, pour que le drapeau reste bien visible
function randomDirection(previous) {
  const direction = new Vector3();
  do {
    const azimuth = Math.random() * Math.PI * 2;
    const elevation = 0.35 + Math.random() * 0.9;
    direction.set(
      Math.cos(azimuth) * Math.cos(elevation),
      Math.sin(elevation),
      Math.sin(azimuth) * Math.cos(elevation),
    );
  } while (direction.angleTo(previous) < 0.6);
  return direction;
}

// Drapeau « 404 » planté sur la lune : le tissu ondule, et un clic le replante ailleurs
export default function MoonFlag() {
  const anchorRef = useRef(null);
  const flagRef = useRef(null);
  const dustRef = useRef(null);
  const dustMaterialRef = useRef(null);
  const direction = useRef(START_DIRECTION.clone());
  const timelineRef = useRef(null);

  const texture = useMemo(() => createFlagTexture(), []);
  const cloth = useMemo(() => {
    const geometry = new PlaneGeometry(CLOTH_WIDTH, CLOTH_HEIGHT, 24, 12);
    // Le bord gauche du tissu est fixé au mât
    geometry.translate(CLOTH_WIDTH / 2, 0, 0);
    return { geometry, rest: geometry.attributes.position.array.slice() };
  }, []);
  const orientation = useMemo(() => new Quaternion().setFromUnitVectors(UP, START_DIRECTION), []);

  useEffect(
    () => () => {
      texture.dispose();
      cloth.geometry.dispose();
      timelineRef.current?.kill();
    },
    [texture, cloth],
  );

  // Font Jost chargée après coup : on redessine la texture quand elle est prête
  useEffect(() => {
    let cancelled = false;
    document.fonts?.load("700 170px Jost").then(() => {
      if (cancelled) return;
      const fresh = createFlagTexture();
      texture.image = fresh.image;
      texture.needsUpdate = true;
      fresh.dispose();
    });
    return () => {
      cancelled = true;
    };
  }, [texture]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const positions = cloth.geometry.attributes.position.array;
    const { rest } = cloth;

    // Ondulation qui part du mât et s'amplifie vers le bord libre
    for (let i = 0; i < positions.length; i += 3) {
      const x = rest[i];
      const y = rest[i + 1];
      const amount = x / CLOTH_WIDTH;
      positions[i + 2] =
        Math.sin(x * 14 - t * 4.5 + y * 3) * 0.035 * amount +
        Math.sin(x * 7 - t * 2.3) * 0.02 * amount;
      positions[i + 1] = y - amount * amount * 0.03;
    }
    cloth.geometry.attributes.position.needsUpdate = true;
    cloth.geometry.computeVertexNormals();
  });

  const handleClick = (event) => {
    event.stopPropagation();
    if (timelineRef.current?.isActive()) return;

    const flag = flagRef.current;
    const anchor = anchorRef.current;
    const dust = dustRef.current;
    const next = randomDirection(direction.current);

    timelineRef.current = gsap
      .timeline()
      // On l'arrache du sol…
      .to(flag.position, { y: MOON_RADIUS + 0.6, duration: 0.35, ease: "power2.out" })
      .to(flag.scale, { x: 0, y: 0, z: 0, duration: 0.25, ease: "back.in(2)" }, 0.15)
      // …on le déplace…
      .call(() => {
        direction.current.copy(next);
        anchor.quaternion.setFromUnitVectors(UP, next);
      })
      .set(flag.position, { y: MOON_RADIUS + 0.9 })
      .set(flag.scale, { x: 1, y: 1, z: 1 })
      // …et on le replante d'un coup sec, avec un nuage de poussière
      .to(flag.position, { y: MOON_RADIUS - SINK, duration: 0.45, ease: "power3.in" })
      .set(dust.scale, { x: 0.2, y: 0.2, z: 0.2 })
      .set(dustMaterialRef.current, { opacity: 0.8 })
      .to(dust.scale, { x: 1.6, y: 1.6, z: 1.6, duration: 0.7, ease: "power2.out" })
      .to(dustMaterialRef.current, { opacity: 0, duration: 0.7, ease: "power2.out" }, "<");
  };

  return (
    <group ref={anchorRef} quaternion={orientation}>
      <group
        ref={flagRef}
        position={[0, MOON_RADIUS - SINK, 0]}
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation();
          setCursorLabel("Replanter");
        }}
        onPointerOut={() => setCursorLabel("")}
      >
        <mesh position={[0, POLE_HEIGHT / 2, 0]}>
          <cylinderGeometry args={[POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 8]} />
          <meshStandardMaterial color="#d8dce6" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, POLE_HEIGHT + 0.015, 0]}>
          <sphereGeometry args={[0.025, 12, 8]} />
          <meshStandardMaterial color="#ffc48a" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh geometry={cloth.geometry} position={[0, POLE_HEIGHT - CLOTH_HEIGHT / 2 - 0.02, 0]}>
          <meshStandardMaterial map={texture} side={DoubleSide} roughness={0.8} />
        </mesh>
        {/* Zone de clic plus large que le mât, transparente */}
        <mesh position={[CLOTH_WIDTH / 2, POLE_HEIGHT / 2, 0]}>
          <boxGeometry args={[CLOTH_WIDTH + 0.1, POLE_HEIGHT + 0.1, 0.12]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
        </mesh>
      </group>

      <mesh ref={dustRef} position={[0, MOON_RADIUS + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0}>
        <ringGeometry args={[0.08, 0.22, 32]} />
        <meshBasicMaterial ref={dustMaterialRef} color="#c9c3b8" transparent opacity={0} depthWrite={false} side={DoubleSide} />
      </mesh>
    </group>
  );
}
