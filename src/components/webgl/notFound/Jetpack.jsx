"use client";
/* eslint-disable react-hooks/immutability */

import { forwardRef, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ConeGeometry,
  DoubleSide,
  Quaternion,
  Vector3,
} from "three";

const FLAME_LENGTH = 0.6;
const FLAME_RADIUS = 0.07;

const SMOKE_COUNT = 400;
const SMOKE_RATE = 110; // particules par seconde et par réacteur, à pleine poussée
const SMOKE_SPEED = 1.8;

const flameVertex = /* glsl */ `
  uniform float uTime;
  uniform float uLength;
  varying float vProgress;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 transformed = position;
    // 0 à la sortie de la tuyère, 1 au bout de la flamme
    vProgress = clamp(-position.y / uLength, 0.0, 1.0);
    float flicker = 1.0 + 0.18 * sin(uTime * 55.0 + position.y * 30.0) * vProgress;
    transformed.xz *= flicker;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const flameFragment = /* glsl */ `
  uniform float uThrust;
  varying float vProgress;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 core = vec3(0.85, 0.92, 1.0);
    vec3 mid = vec3(1.0, 0.62, 0.22);
    vec3 tip = vec3(1.0, 0.25, 0.05);
    vec3 color = mix(core, mid, smoothstep(0.0, 0.35, vProgress));
    color = mix(color, tip, smoothstep(0.35, 1.0, vProgress));

    // Bords adoucis : la flamme est plus dense là où on la voit de face
    float facing = abs(dot(normalize(vViewPosition), normalize(vNormal)));
    float alpha = pow(1.0 - vProgress, 1.4) * pow(facing, 1.2) * uThrust;
    gl_FragColor = vec4(color * 1.6, alpha);
  }
`;

const smokeVertex = /* glsl */ `
  attribute float aLife;
  attribute float aSize;
  attribute float aSoot;
  uniform float uViewportHeight;
  varying float vLife;
  varying float vSoot;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vLife = aLife;
    vSoot = aSoot;
    // Taille en unités monde convertie en pixels, la fumée grossit en se dissipant
    float size = aSize * mix(0.5, 2.6, aLife);
    gl_PointSize = aLife >= 1.0 ? 0.0 : size * uViewportHeight * projectionMatrix[1][1] * 0.5 / -mvPosition.z;
  }
`;

const smokeFragment = /* glsl */ `
  varying float vLife;
  varying float vSoot;

  void main() {
    float distance = length(gl_PointCoord - 0.5);
    if (distance > 0.5) discard;

    float soft = smoothstep(0.5, 0.0, distance);
    float fade = smoothstep(0.0, 0.06, vLife) * (1.0 - smoothstep(0.3, 1.0, vLife));
    // Les premières particules sont encore chaudes, puis deviennent une fumée grise
    vec3 color = mix(vec3(1.0, 0.6, 0.3), vec3(0.72, 0.75, 0.82), smoothstep(0.0, 0.2, vLife));
    // Fumée de panne : noire et plus opaque
    color = mix(color, vec3(0.16, 0.14, 0.13), vSoot);
    gl_FragColor = vec4(color, soft * fade * mix(0.5, 0.85, vSoot));
  }
`;

// Flamme d'un réacteur, orientée vers -Y de son groupe. `thrust` est un ref { value: 0..1 }.
export const Thruster = forwardRef(function Thruster({ thrust, ...props }, ref) {
  const flameRef = useRef(null);
  const flameMaterialRef = useRef(null);
  const lightRef = useRef(null);

  const geometry = useMemo(() => {
    const cone = new ConeGeometry(FLAME_RADIUS, FLAME_LENGTH, 24, 12, true);
    cone.rotateX(Math.PI);
    cone.translate(0, -FLAME_LENGTH / 2, 0);
    return cone;
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uThrust: { value: 0 },
      uLength: { value: FLAME_LENGTH },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const value = thrust.current.value;
    const flame = flameRef.current;
    const t = state.clock.elapsedTime;
    // R3F ne garde pas la référence de l'objet `uniforms` passé en prop : on passe par le matériau
    const { uTime, uThrust } = flameMaterialRef.current.uniforms;

    uTime.value = t;
    uThrust.value = value;
    flame.visible = value > 0.01;
    flame.scale.set(1, value * (0.85 + Math.sin(t * 37) * 0.1), 1);
    lightRef.current.intensity = value * (2.5 + Math.sin(t * 43) * 0.6);
  });

  return (
    <group ref={ref} {...props}>
      <mesh ref={flameRef} geometry={geometry} raycast={() => null} visible={false}>
        <shaderMaterial
          ref={flameMaterialRef}
          vertexShader={flameVertex}
          fragmentShader={flameFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          side={DoubleSide}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, -0.15, 0]} color="#ff8a3d" distance={2.5} intensity={0} />
    </group>
  );
});

// Traînée de fumée en coordonnées monde : elle reste derrière l'astronaute quand il bouge.
// `nozzles` est un ref vers la liste des groupes <Thruster>, `soot` un ref { value: 0..1 }
// optionnel qui noircit la fumée émise (panne de réacteur).
export function SmokeTrail({ nozzles, thrust, soot }) {
  const materialRef = useRef(null);
  const size = useThree((state) => state.size);
  const dpr = useThree((state) => state.viewport.dpr);

  const particles = useMemo(() => {
    const geometry = new BufferGeometry();
    const life = new Float32Array(SMOKE_COUNT).fill(1);
    const sizes = new Float32Array(SMOKE_COUNT);
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(SMOKE_COUNT * 3), 3));
    geometry.setAttribute("aLife", new BufferAttribute(life, 1));
    geometry.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geometry.setAttribute("aSoot", new BufferAttribute(new Float32Array(SMOKE_COUNT), 1));

    return {
      geometry,
      velocities: new Float32Array(SMOKE_COUNT * 3),
      lifetimes: new Float32Array(SMOKE_COUNT).fill(1),
      ages: new Float32Array(SMOKE_COUNT).fill(1),
      cursor: 0,
      pending: 0,
      previous: [],
    };
  }, []);

  const uniforms = useMemo(() => ({ uViewportHeight: { value: 1 } }), []);
  const temp = useMemo(
    () => ({ position: new Vector3(), direction: new Vector3(), quaternion: new Quaternion() }),
    [],
  );

  useEffect(() => () => particles.geometry.dispose(), [particles]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const { geometry, velocities, lifetimes, ages, previous } = particles;
    const positions = geometry.attributes.position.array;
    const life = geometry.attributes.aLife.array;
    const sizes = geometry.attributes.aSize.array;
    const soots = geometry.attributes.aSoot.array;
    const value = thrust.current.value;
    const sootValue = soot?.current.value ?? 0;

    materialRef.current.uniforms.uViewportHeight.value = size.height * dpr;

    // Émission : on interpole entre la position précédente et actuelle de chaque tuyère
    // pour garder une traînée continue pendant les rotations rapides du salto
    particles.pending += SMOKE_RATE * value * delta;
    const perNozzle = Math.floor(particles.pending);
    particles.pending -= perNozzle;

    nozzles.current.forEach((nozzle, index) => {
      if (!nozzle) return;
      nozzle.getWorldPosition(temp.position);
      nozzle.getWorldQuaternion(temp.quaternion);
      temp.direction.set(0, -1, 0).applyQuaternion(temp.quaternion);

      const from = previous[index] ?? temp.position.clone();
      for (let i = 0; i < perNozzle; i++) {
        const k = particles.cursor;
        particles.cursor = (particles.cursor + 1) % SMOKE_COUNT;

        const mix = (i + Math.random()) / perNozzle;
        const speed = SMOKE_SPEED * (0.7 + Math.random() * 0.6);
        positions[k * 3] = from.x + (temp.position.x - from.x) * mix;
        positions[k * 3 + 1] = from.y + (temp.position.y - from.y) * mix;
        positions[k * 3 + 2] = from.z + (temp.position.z - from.z) * mix;
        velocities[k * 3] = temp.direction.x * speed + (Math.random() - 0.5) * 0.35;
        velocities[k * 3 + 1] = temp.direction.y * speed + (Math.random() - 0.5) * 0.35;
        velocities[k * 3 + 2] = temp.direction.z * speed + (Math.random() - 0.5) * 0.35;
        ages[k] = 0;
        lifetimes[k] = 1.1 + Math.random() * 0.9;
        sizes[k] = (0.1 + Math.random() * 0.08) * (1 + sootValue * 0.6);
        soots[k] = sootValue;
      }

      previous[index] = (previous[index] ?? new Vector3()).copy(temp.position);
    });

    // Simulation : la fumée ralentit et se disperse
    const damping = Math.exp(-2.4 * delta);
    for (let k = 0; k < SMOKE_COUNT; k++) {
      if (ages[k] >= lifetimes[k]) {
        life[k] = 1;
        continue;
      }
      ages[k] += delta;
      velocities[k * 3] *= damping;
      velocities[k * 3 + 1] *= damping;
      velocities[k * 3 + 2] *= damping;
      positions[k * 3] += velocities[k * 3] * delta;
      positions[k * 3 + 1] += velocities[k * 3 + 1] * delta;
      positions[k * 3 + 2] += velocities[k * 3 + 2] * delta;
      life[k] = Math.min(ages[k] / lifetimes[k], 1);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.aLife.needsUpdate = true;
    geometry.attributes.aSize.needsUpdate = true;
    geometry.attributes.aSoot.needsUpdate = true;
  });

  return (
    <points geometry={particles.geometry} frustumCulled={false} raycast={() => null}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={smokeVertex}
        fragmentShader={smokeFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  );
}
