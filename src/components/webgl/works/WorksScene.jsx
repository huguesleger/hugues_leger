"use client";
/* eslint-disable react-hooks/immutability */

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useRouter } from "next/navigation";
import { setCursorCanvasHover } from "@/lib/cursorDom";
import {
  WORKS_CONFIG,
  WORKS_TRANSITION_TARGET_HEIGHT,
  getArcTransform,
  getLineTransform,
  getUnrolledX,
  getWorksDimensions,
  lerp,
  normalizeSheetVelocity,
  smoothstep,
} from "@/lib/worksLayout";
import { stepWorksScroll } from "./useWorksScroll";
import { WORKS_FRAGMENT_SHADER, WORKS_VERTEX_SHADER } from "./worksShaders";

export const WORKS_STORAGE = {
  scroll: "worksScroll",
  drift: "worksDrift",
  card: "worksCard",
  origin: "transitionOrigin",
  returnFrom: "returnTransitionFrom",
};

export default function WorksScene({ projects, scrollRef, syncRef }) {
  const { size } = useThree();
  const router = useRouter();
  const groupRef = useRef();
  const meshRefs = useRef([]);
  const driftRef = useRef(0);
  const hoveredRef = useRef(-1);

  const textures = useTexture(projects.map((p) => p.image));

  const dims = useMemo(
    () => getWorksDimensions(size.width, size.height, projects.length),
    [size.width, size.height, projects.length],
  );

  const geometry = useMemo(
    () =>
      new THREE.PlaneGeometry(1, 1, WORKS_CONFIG.segments, WORKS_CONFIG.segments),
    [],
  );

  const transitionState = useMemo(() => {
    if (typeof window === "undefined") return { isReturning: false, targetIndex: -1 };
    const returnId = sessionStorage.getItem(WORKS_STORAGE.returnFrom);
    const origin = sessionStorage.getItem(WORKS_STORAGE.origin);
    if (!returnId || origin !== "/works") return { isReturning: false, targetIndex: -1 };
    
    let index = Number(sessionStorage.getItem(WORKS_STORAGE.card) ?? -1);
    if (index < 0 || index >= dims.count) {
      const pIndex = projects.findIndex((p) => String(p.id) === returnId);
      index = pIndex >= 0 ? pIndex : -1;
    }
    return { isReturning: true, targetIndex: index };
  }, [dims.count, projects]);

  const cards = useMemo(() => {
    return Array.from({ length: dims.count }, (_, i) => {
      const projectIndex = i % projects.length;
      const baseTex = textures[projectIndex];
      const tex = baseTex.clone();
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;

      const isTarget = transitionState.isReturning && transitionState.targetIndex === i;
      const initialFade = transitionState.isReturning && !isTarget ? 0 : 1;

      const material = new THREE.ShaderMaterial({
        vertexShader: WORKS_VERTEX_SHADER,
        fragmentShader: WORKS_FRAGMENT_SHADER,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          uMap: { value: tex },
          uImageAspect: { value: tex.image.width / tex.image.height },
          uSheetW: { value: 1 },
          uSheetD: { value: 0 },
          uSheetT: { value: 1 },
          uSheetC: { value: 1 },
          uSheetP: { value: 0 },
          uSheetV: { value: 0 },
          uLeanA: { value: 0 },
          uDent: { value: WORKS_CONFIG.sheet.dent },
          uShade: { value: WORKS_CONFIG.sheet.shade },
          uTransition: { value: isTarget ? 1 : 0 },
          uOpacity: { value: initialFade },
          uHover: { value: 0 },
          uMouse: { value: new THREE.Vector2(-9999, -9999) },
          uTime: { value: 0 },
          uCardSize: { value: new THREE.Vector2() },
          uTargetSize: { value: new THREE.Vector2() },
          uTargetPosition: { value: new THREE.Vector2() },
        },
      });

      return { material, projectIndex, fade: { value: initialFade } };
    });
  }, [dims.count, projects.length, textures, transitionState]);

  useEffect(() => {
    return () => cards.forEach((card) => card.material.dispose());
  }, [cards]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useEffect(() => {
    const state = scrollRef.current;
    const returnId = sessionStorage.getItem(WORKS_STORAGE.returnFrom);
    const origin = sessionStorage.getItem(WORKS_STORAGE.origin);
    if (!returnId || origin !== "/works") return;

    const savedScroll = Number(sessionStorage.getItem(WORKS_STORAGE.scroll) || 0);
    const savedDrift = Number(sessionStorage.getItem(WORKS_STORAGE.drift) || 0);
    const savedCard = Number(sessionStorage.getItem(WORKS_STORAGE.card) ?? -1);

    state.target = state.current = savedScroll;
    driftRef.current = savedDrift;

    let index = savedCard >= 0 && savedCard < cards.length ? savedCard : -1;
    if (index < 0) {
      index = cards.findIndex(
        (card) => String(projects[card.projectIndex].id) === returnId,
      );
    }

    [WORKS_STORAGE.returnFrom, WORKS_STORAGE.origin, WORKS_STORAGE.card].forEach(
      (key) => sessionStorage.removeItem(key),
    );
    if (index < 0) return;

    state.locked = true;
    cards.forEach((card, i) => {
      card.fade.value = i === index ? 1 : 0;
    });
    cards[index].material.uniforms.uTransition.value = 1;

    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        gsap.to(cards[index].material.uniforms.uTransition, {
          value: 0,
          duration: 1,
          ease: "power3.inOut",
          onComplete: () => {
            state.locked = false;
            cards.forEach((card, i) => {
              if (i === index) return;
              gsap.to(card.fade, {
                value: 1,
                duration: 0.45,
                ease: "power2.inOut",
              });
            });
          },
        });
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [cards, projects, scrollRef]);

  const getOffset = () => scrollRef.current.current + driftRef.current;

  const openProject = (index) => {
    const state = scrollRef.current;
    const card = cards[index];
    const project = projects[card.projectIndex];
    state.locked = true;
    state.target = state.current;
    setCursorCanvasHover(false);

    sessionStorage.setItem(WORKS_STORAGE.scroll, String(state.current));
    sessionStorage.setItem(WORKS_STORAGE.drift, String(driftRef.current));
    sessionStorage.setItem(WORKS_STORAGE.card, String(index));
    sessionStorage.setItem(WORKS_STORAGE.origin, "/works");

    cards.forEach((other, i) => {
      if (i === index) return;
      gsap.to(other.fade, { value: 0, duration: 0.4, ease: "power2.out" });
    });

    import("@/components/TransitionOverlay").then((m) =>
      m.triggerTransition(null, project.image, project.id),
    );

    gsap.to(card.material.uniforms.uTransition, {
      value: 1,
      duration: 1,
      ease: "power3.inOut",
      onComplete: () => router.push(`/realisation/${project.id}`),
    });
  };

  const handleClick = (index) => {
    const state = scrollRef.current;
    if (state.locked || state.moved) return;

    const progress = smoothstep(0, dims.introDistance, state.current);
    if (progress < 0.98) return;

    openProject(index);
  };

  const getCursorLabel = () => "View";

  const currentMouse = useRef(new THREE.Vector2(-9999, -9999));

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const scrollState = scrollRef.current;
    stepWorksScroll(scrollState, dt);

    const targetX = (state.pointer.x * size.width) / 2;
    const targetY = (state.pointer.y * size.height) / 2;

    if (currentMouse.current.x === -9999) {
      currentMouse.current.set(targetX, targetY);
    } else {
      currentMouse.current.x += (targetX - currentMouse.current.x) * 0.1;
      currentMouse.current.y += (targetY - currentMouse.current.y) * 0.1;
    }

    const progress = smoothstep(0, dims.introDistance, scrollState.current);
    const arcAmount = 1 - progress;

    if (!scrollState.locked && !scrollState.dragging) {
      driftRef.current += dt * WORKS_CONFIG.idleDrift * arcAmount;
    }
    const offset = getOffset();

    const group = groupRef.current;
    if (group) {
      group.position.z = -arcAmount * dims.arc.radius * WORKS_CONFIG.arcDepthRatio;
      group.rotation.x = arcAmount * WORKS_CONFIG.arcTilt;
      group.rotation.z = arcAmount * WORKS_CONFIG.arcRoll;
    }

    const targetHeight = Math.min(WORKS_TRANSITION_TARGET_HEIGHT, size.height);
    const { arc: arcDims, line: lineDims } = dims;
    const arcScale = arcDims.pitch / lineDims.pitch;
    const cardWidth = lerp(arcDims.width, lineDims.width, progress);
    const cardHeight = lerp(arcDims.height, lineDims.height, progress);
    const sheetConfig = dims.sheet;
    const halfWidth = size.width / 2;
    const sheetV = normalizeSheetVelocity(scrollState.velocity * 60, sheetConfig.velNorm);
    const sheetD =
      halfWidth * sheetConfig.depth * (1 + WORKS_CONFIG.sheet.velDepth * sheetV);
    let activeIndex = 0;
    let activeDistance = Infinity;

    cards.forEach((card, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;

      const u = getUnrolledX(i, offset, lineDims.pitch, lineDims.totalWidth);
      const arc = getArcTransform(u * arcScale, arcDims.radius);
      const line = getLineTransform(u, lineDims.totalWidth, lineDims.pitch);

      mesh.position.set(lerp(arc.x, line.x, progress), 0, lerp(arc.z, line.z, progress));
      mesh.rotation.y = lerp(arc.rotY, line.rotY, progress);
      mesh.scale.set(cardWidth, cardHeight, 1);

      const visibility = lerp(arc.opacity, line.opacity, progress);
      mesh.visible = visibility * card.fade.value > 0.003;

      const isHovered = hoveredRef.current === i && !scrollState.locked;
      const uniforms = card.material.uniforms;
      uniforms.uMouse.value.copy(currentMouse.current);
      uniforms.uTime.value = state.clock.elapsedTime;
      uniforms.uSheetW.value = halfWidth;
      uniforms.uSheetD.value = sheetD;
      uniforms.uSheetT.value = sheetConfig.span;
      uniforms.uSheetC.value = sheetConfig.curve;
      uniforms.uSheetP.value = progress * (1 - uniforms.uTransition.value);
      uniforms.uSheetV.value = sheetV;
      uniforms.uLeanA.value = halfWidth * sheetConfig.door;
      uniforms.uOpacity.value = visibility * card.fade.value;
      uniforms.uHover.value += ((isHovered ? 1 : 0) - uniforms.uHover.value) * 0.1;
      uniforms.uCardSize.value.set(cardWidth, cardHeight);
      uniforms.uTargetSize.value.set(size.width, targetHeight);
      uniforms.uTargetPosition.value.set(0, size.height / 2 - targetHeight / 2);
      mesh.renderOrder = uniforms.uTransition.value > 0 ? 10 : 0;

      if (Math.abs(u) < activeDistance) {
        activeDistance = Math.abs(u);
        activeIndex = card.projectIndex;
      }
    });

    if (syncRef) {
      syncRef.current.activeIndex = activeIndex;
      syncRef.current.progress = progress;
      syncRef.current.hidden = scrollState.locked;
      const hoveredCardIndex = hoveredRef.current;
      syncRef.current.hoveredIndex = hoveredCardIndex !== -1 ? cards[hoveredCardIndex].projectIndex : -1;
    }
  });

  return (
    <group ref={groupRef}>
      {cards.map((card, i) => (
        <mesh
          key={`${dims.count}-${i}`}
          ref={(node) => {
            meshRefs.current[i] = node;
          }}
          geometry={geometry}
          material={card.material}
          frustumCulled={false}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(i);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            const progress = smoothstep(0, dims.introDistance, scrollRef.current.current);
            if (progress < 0.98) return;
            hoveredRef.current = i;
            if (!scrollRef.current.locked) {
              setCursorCanvasHover(true, getCursorLabel());
            }
          }}
          onPointerOut={() => {
            if (hoveredRef.current === i) hoveredRef.current = -1;
            setCursorCanvasHover(false);
          }}
        />
      ))}
    </group>
  );
}
