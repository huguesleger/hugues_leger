"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, useGLTF } from "@react-three/drei";
import { Plane, Quaternion, Vector3 } from "three";
import gsap from "gsap";
import { SmokeTrail, Thruster } from "./Jetpack";
import {
  HOVER_SCALE,
  Hoverable,
  MOON_RADIUS,
  setCursorLabel,
  useFittedModel,
} from "./sceneUtils";

const SPACEMAN_URL = "/models/spaceman.glb";
const SPACEMAN_SIZE = 2.2;
// Direction dans laquelle le spationaute flotte par rapport au centre de la lune (devant, en haut à droite)
const SPACEMAN_DIRECTION = new Vector3(0.75, 0.35, 0.6).normalize();
// Marge pour l'amplitude verticale de <Float>
const SPACEMAN_MARGIN = 0.3;
// Sorties des deux tuyères sous le sac à dos, dans les coordonnées d'origine du GLB
const THRUSTER_NOZZLES = [
  new Vector3(-0.2, 1.52, -2.45),
  new Vector3(0.43, 1.52, -2.45),
];
// Centre de la boîte englobante du GLB d'origine (centre visuel du spationaute)
const MODEL_CENTER = new Vector3(0.11, 2.71, -1.69);

// Lancer : vitesse max, amortissement en vol et ressort de retour
const MAX_THROW_SPEED = 9;
const FLIGHT_DAMPING = 0.9;
const FLIGHT_DURATION = 0.9;
const RETURN_STIFFNESS = 5;
const RETURN_DAMPING = 4;
const MAX_OFFSET = 7;
// En dessous de ce déplacement (en pixels), un appui-relâché compte comme un clic
const CLICK_TOLERANCE = 5;

// Point de départ de l'entrée en scène, relatif à la position de repos
const ENTRY_OFFSET = new Vector3(7, 3, -6);

const REACTIONS = ["salto", "vrille", "panne"];
const REACTION_LABELS = { salto: "Salto !", vrille: "Vrille !", panne: "Panne ?" };

const Spaceman = forwardRef(function Spaceman({ setControlsLock }, ref) {
  const { model, scale, radius, toLocal } = useFittedModel(SPACEMAN_URL, SPACEMAN_SIZE);
  const camera = useThree((state) => state.camera);

  const throwRef = useRef(null);
  const driftRef = useRef(null);
  const tumbleRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const nozzlesRef = useRef([]);

  // Poussée lue par les réacteurs : max entre la réaction en cours et le retour après un lancer
  const thrust = useRef({ value: 0 });
  const reactionThrust = useRef({ value: 0 });
  const soot = useRef({ value: 0 });
  const reactionTimelineRef = useRef(null);
  const reactionIndex = useRef(0);
  const hovered = useRef(false);
  const [label, setLabel] = useState(REACTION_LABELS[REACTIONS[0]]);

  const physics = useRef({
    phase: "idle", // idle | intro | dragging | flying | returning
    velocity: new Vector3(),
    spin: new Vector3(),
    flightTime: 0,
    returnThrust: 0,
    pointerStart: { x: 0, y: 0 },
    samples: [],
    plane: new Plane(),
    grab: new Vector3(),
  });
  const temp = useMemo(
    () => ({
      pivot: new Vector3(),
      visual: new Vector3(),
      visualOffset: new Vector3(),
      hit: new Vector3(),
      normal: new Vector3(),
      axis: new Vector3(),
      quaternion: new Quaternion(),
      identity: new Quaternion(),
    }),
    [],
  );

  const position = useMemo(() => {
    const distance = MOON_RADIUS + radius * HOVER_SCALE + SPACEMAN_MARGIN;
    return SPACEMAN_DIRECTION.clone().multiplyScalar(distance);
  }, [radius]);
  const nozzles = useMemo(() => THRUSTER_NOZZLES.map(toLocal), [toLocal]);
  const visualCenter = useMemo(() => toLocal(MODEL_CENTER), [toLocal]);
  // Distance minimale entre le centre visuel du spationaute et le centre de la lune
  const minVisualDistance = MOON_RADIUS + radius + 0.15;

  useEffect(
    () => () => {
      reactionTimelineRef.current?.kill();
      setControlsLock?.("spaceman-hover", false);
      setControlsLock?.("spaceman-drag", false);
    },
    [setControlsLock],
  );

  useImperativeHandle(ref, () => ({
    // Place le spationaute hors champ en attendant l'intro
    prepareEntrance() {
      physics.current.phase = "intro";
      throwRef.current.position.copy(ENTRY_OFFSET);
    },
    entrance() {
      physics.current.phase = "intro";
      throwRef.current.position.copy(ENTRY_OFFSET);
      return gsap
        .timeline({
          onComplete: () => {
            physics.current.phase = "idle";
          },
        })
        .to(reactionThrust.current, { value: 1, duration: 0.3, ease: "power2.out" }, 0)
        .to(throwRef.current.position, { x: 0, y: 0, z: 0, duration: 2.2, ease: "power3.out" }, 0)
        .to(reactionThrust.current, { value: 0, duration: 0.6, ease: "power2.in" }, 1.7);
    },
  }));

  // Empêche le centre visuel de rentrer dans la lune et annule la vitesse qui l'y pousse
  const keepOutOfMoon = (offset, velocity) => {
    const { pivot, visual, visualOffset, normal } = temp;
    centerMarkerRef.current.getWorldPosition(visual);
    throwRef.current.getWorldPosition(pivot);
    visualOffset.subVectors(visual, pivot);

    pivot.copy(position).add(offset);
    visual.addVectors(pivot, visualOffset);
    if (visual.length() >= minVisualDistance) return;

    normal.copy(visual).normalize();
    visual.copy(normal).multiplyScalar(minVisualDistance);
    offset.copy(visual).sub(visualOffset).sub(position);
    if (velocity) {
      const inward = velocity.dot(normal);
      if (inward < 0) velocity.addScaledVector(normal, -inward * 1.5);
    }
  };

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const t = state.clock.elapsedTime;
    const p = physics.current;
    const offset = throwRef.current.position;
    const tumble = tumbleRef.current;

    driftRef.current.rotation.z = Math.sin(t * 0.4) * 0.25;
    driftRef.current.rotation.y = -0.5 + Math.sin(t * 0.25) * 0.4;

    if (p.phase === "flying") {
      offset.addScaledVector(p.velocity, delta);
      p.velocity.multiplyScalar(Math.exp(-FLIGHT_DAMPING * delta));
      p.flightTime += delta;
      if (p.flightTime > FLIGHT_DURATION) p.phase = "returning";
    } else if (p.phase === "returning") {
      // Ressort amorti vers la position de repos
      p.velocity.addScaledVector(offset, -RETURN_STIFFNESS * delta);
      p.velocity.multiplyScalar(Math.exp(-RETURN_DAMPING * delta));
      offset.addScaledVector(p.velocity, delta);

      const target = Math.min(1, offset.length() / 2 + p.velocity.length() / 4);
      p.returnThrust += (target - p.returnThrust) * Math.min(1, delta * 6);

      if (offset.length() < 0.02 && p.velocity.length() < 0.05) {
        offset.set(0, 0, 0);
        p.phase = "idle";
      }
    }

    if (p.phase !== "returning") p.returnThrust += (0 - p.returnThrust) * Math.min(1, delta * 4);

    if (p.phase === "flying" || p.phase === "returning") {
      if (offset.length() > MAX_OFFSET) offset.setLength(MAX_OFFSET);
      keepOutOfMoon(offset, p.velocity);
    }

    // Rotation du lancer autour du centre visuel, qui se stabilise au retour
    if (p.spin.lengthSq() > 1e-6) {
      temp.axis.copy(p.spin).normalize();
      temp.quaternion.setFromAxisAngle(temp.axis, p.spin.length() * delta);
      tumble.quaternion.premultiply(temp.quaternion);
    }
    const spinDamping = p.phase === "flying" ? 0.5 : 4;
    p.spin.multiplyScalar(Math.exp(-spinDamping * delta));
    if (p.phase === "returning" || p.phase === "idle") {
      tumble.quaternion.slerp(temp.identity, 1 - Math.exp(-3 * delta));
    }

    thrust.current.value = Math.max(reactionThrust.current.value, p.returnThrust);
  });

  const lockHover = (isHovered) => {
    hovered.current = isHovered;
    setControlsLock?.("spaceman-hover", isHovered);
  };

  const handlePointerDown = (event) => {
    const p = physics.current;
    if (p.phase === "intro") return;
    event.stopPropagation();
    event.target.setPointerCapture(event.pointerId);

    p.phase = "dragging";
    p.velocity.set(0, 0, 0);
    p.pointerStart = { x: event.clientX, y: event.clientY };
    p.samples = [];

    // Plan de glisser face à la caméra, passant par le point attrapé
    throwRef.current.getWorldPosition(temp.pivot);
    camera.getWorldDirection(temp.normal);
    p.plane.setFromNormalAndCoplanarPoint(temp.normal, event.point);
    p.grab.subVectors(event.point, temp.pivot);

    setControlsLock?.("spaceman-drag", true);
  };

  const handlePointerMove = (event) => {
    const p = physics.current;
    if (p.phase !== "dragging") return;
    event.stopPropagation();
    if (!event.ray.intersectPlane(p.plane, temp.hit)) return;

    const offset = throwRef.current.position;
    offset.copy(temp.hit).sub(p.grab).sub(position);
    if (offset.length() > MAX_OFFSET) offset.setLength(MAX_OFFSET);
    keepOutOfMoon(offset);

    const now = performance.now();
    p.samples.push({ time: now, position: offset.clone() });
    while (p.samples.length > 2 && now - p.samples[0].time > 90) p.samples.shift();

    if (Math.hypot(event.clientX - p.pointerStart.x, event.clientY - p.pointerStart.y) > CLICK_TOLERANCE) {
      setCursorLabel("Wiiii !");
    }
  };

  const handlePointerUp = (event) => {
    const p = physics.current;
    if (p.phase !== "dragging") return;
    event.stopPropagation();
    event.target.releasePointerCapture?.(event.pointerId);
    setControlsLock?.("spaceman-drag", false);

    const moved = Math.hypot(event.clientX - p.pointerStart.x, event.clientY - p.pointerStart.y);
    if (moved <= CLICK_TOLERANCE) {
      // Simple clic : on ne lance pas, il revient doucement si on l'avait déplacé
      p.phase = throwRef.current.position.lengthSq() > 1e-4 ? "returning" : "idle";
      return;
    }

    // Vitesse du lancer estimée sur les dernières ~90 ms de glisser
    const first = p.samples[0];
    const last = p.samples[p.samples.length - 1];
    if (first && last && last.time > first.time) {
      p.velocity
        .subVectors(last.position, first.position)
        .divideScalar((last.time - first.time) / 1000);
      if (p.velocity.length() > MAX_THROW_SPEED) p.velocity.setLength(MAX_THROW_SPEED);
    }

    // Il part en tournoyant perpendiculairement à la direction du lancer
    camera.getWorldDirection(temp.normal);
    p.spin.crossVectors(temp.normal, p.velocity).multiplyScalar(-1.2);
    if (p.spin.length() > 8) p.spin.setLength(8);

    p.phase = "flying";
    p.flightTime = 0;
    if (hovered.current) setCursorLabel(label);
  };

  const playReaction = (target) => {
    const reaction = REACTIONS[reactionIndex.current];
    reactionIndex.current = (reactionIndex.current + 1) % REACTIONS.length;
    const nextLabel = REACTION_LABELS[REACTIONS[reactionIndex.current]];
    setLabel(nextLabel);
    if (hovered.current) setCursorLabel(nextLabel);

    reactionTimelineRef.current?.kill();
    const timeline = gsap.timeline();
    reactionTimelineRef.current = timeline;

    if (reaction === "salto" || reaction === "vrille") {
      const axis = reaction === "salto" ? "x" : "y";
      timeline
        .to(
          target.rotation,
          {
            [axis]: target.rotation[axis] - Math.PI * 2,
            duration: reaction === "salto" ? 1.4 : 1.3,
            ease: "power3.inOut",
          },
          0,
        )
        // Réacteurs allumés pendant la figure, puis extinction progressive
        .to(reactionThrust.current, { value: 1, duration: 0.2, ease: "power2.out" }, 0)
        .to(reactionThrust.current, { value: 0, duration: 0.6, ease: "power2.in" }, 1.2);
      return;
    }

    // Panne : les réacteurs toussent, crachent une fumée noire et le spationaute tremble
    timeline.set(soot.current, { value: 1 }, 0);
    let at = 0;
    for (let i = 0; i < 7; i++) {
      timeline
        .to(reactionThrust.current, { value: 0.4 + Math.random() * 0.6, duration: 0.05 }, at)
        .to(reactionThrust.current, { value: 0, duration: 0.12 }, at + 0.08);
      at += 0.18 + Math.random() * 0.16;
    }
    timeline
      .to(target.rotation, { z: target.rotation.z + 0.2, duration: 0.08, yoyo: true, repeat: 9, ease: "sine.inOut" }, 0)
      .to(target.position, { y: target.position.y - 0.25, duration: 0.5, ease: "power2.in" }, at - 0.4)
      .to(target.position, { y: target.position.y, duration: 1, ease: "back.out(2)" }, at + 0.1)
      .set(soot.current, { value: 0 }, at + 0.2);
  };

  const handleClick = (target, event) => {
    const p = physics.current;
    if (p.phase === "intro" || p.phase === "flying" || p.phase === "dragging") return;
    if (event.delta > CLICK_TOLERANCE) return;
    if (reactionTimelineRef.current?.isActive()) return;
    playReaction(target);
  };

  return (
    <>
      <group position={position}>
        <group ref={throwRef}>
          <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.5}>
            <group ref={driftRef}>
              <Hoverable
                label={label}
                onClick={handleClick}
                onHoverChange={lockHover}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                {/* Le lancer fait tournoyer le spationaute autour de son centre visuel */}
                <group position={visualCenter}>
                  <group ref={tumbleRef}>
                    <group position={visualCenter.clone().negate()}>
                      <primitive object={model} scale={scale} />
                      <object3D ref={centerMarkerRef} position={visualCenter} />
                      {nozzles.map((nozzle, index) => (
                        <Thruster
                          key={index}
                          ref={(element) => {
                            nozzlesRef.current[index] = element;
                          }}
                          position={nozzle}
                          thrust={thrust}
                        />
                      ))}
                    </group>
                  </group>
                </group>
              </Hoverable>
            </group>
          </Float>
        </group>
      </group>
      <SmokeTrail nozzles={nozzlesRef} thrust={thrust} soot={soot} />
    </>
  );
});

export default Spaceman;

useGLTF.preload(SPACEMAN_URL);
