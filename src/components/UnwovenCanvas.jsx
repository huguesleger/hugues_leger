"use client";
/* eslint-disable react-hooks/immutability */

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { useRouter } from "next/navigation";

import {
  VERTEX_SHADER,
  FRAGMENT_SHADER,
} from "@/components/webgl/unwovenShaders";

const CONFIG = {
  threads: 26,
  segments: 20,
  cardMaxHeight: 452,
  cardAspect: 0.75,
  cardGapRatio: 0.11,
  tearZoneRatio: 0.26,
  tearZoneMax: 380,
};

function getGalleryScroll() {
  const lenis = window.lenisInstance;
  if (lenis && typeof lenis.scroll === "number") {
    return lenis.scroll;
  }
  return window.scrollY;
}

function restoreGalleryScroll(targetScroll, scrollRef) {
  scrollRef.current = targetScroll;
  window.scrollTo(0, targetScroll);
  window.lenisInstance?.scrollTo(targetScroll, { immediate: true });
}

const STAGGERS = [-300, 200, -200, 300, -350, 150];

function syncMeshScrollPositions(
  group,
  pitch,
  scrollOffset,
  screenWidth = 1000,
) {
  if (!group) return;
  const isMobile = screenWidth < 768;
  group.children.forEach((mesh, i) => {
    mesh.position.x = isMobile ? 0 : STAGGERS[i % STAGGERS.length];
    mesh.position.y = scrollOffset - i * pitch;
  });
}

function buildVerticalRibbonGeometry(width, height, threads, segments) {
  const rows = segments + 1;
  const perThread = rows * 2;
  const total = threads * perThread;

  const positions = new Float32Array(total * 3);
  const uvs = new Float32Array(total * 2);
  const rims = new Float32Array(total);
  const threadIds = new Float32Array(total);
  const indices = [];

  let v = 0;
  for (let t = 0; t < threads; t++) {
    for (let col = 0; col < 2; col++) {
      const ux = (t + col) / threads;
      for (let r = 0; r < rows; r++) {
        const vy = r / segments;
        positions[v * 3 + 0] = (ux - 0.5) * width;
        positions[v * 3 + 1] = (vy - 0.5) * height;
        positions[v * 3 + 2] = 0;
        uvs[v * 2 + 0] = ux;
        uvs[v * 2 + 1] = vy;
        rims[v] = col === 0 ? -1 : 1;
        threadIds[v] = t;
        v++;
      }
    }

    const base = t * perThread;
    for (let r = 0; r < segments; r++) {
      const bl = base + r;
      const tl = base + r + 1;
      const br = base + rows + r;
      const tr = base + rows + r + 1;
      indices.push(bl, br, tl, br, tr, tl);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setAttribute("aRim", new THREE.BufferAttribute(rims, 1));
  geometry.setAttribute("aThread", new THREE.BufferAttribute(threadIds, 1));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

const UnwovenScene = ({ images, scrollEnabled = true }) => {
  const groupRef = useRef();
  const { size } = useThree();
  const textures = useTexture(images);
  const router = useRouter();

  let cardHeight = Math.min(CONFIG.cardMaxHeight, size.height * 0.62);
  let cardWidth = cardHeight * CONFIG.cardAspect;
  const maxCardWidth = size.width * 0.9;
  if (cardWidth > maxCardWidth) {
    cardWidth = maxCardWidth;
    cardHeight = cardWidth / CONFIG.cardAspect;
  }

  const pitch = cardHeight + Math.max(24, cardHeight * CONFIG.cardGapRatio);

  const scrollSpan = (images.length - 1) * pitch;

  const isTransitioning = useRef(false);
  const scrollYRef = useRef(
    typeof window !== "undefined"
      ? Number(sessionStorage.getItem("galleryScroll") || getGalleryScroll())
      : 0,
  );

  useEffect(() => {
    if (!scrollEnabled) return;

    document.body.style.height = `${scrollSpan + window.innerHeight}px`;
    window.lenisInstance?.resize();

    const savedScroll = sessionStorage.getItem("galleryScroll");
    if (savedScroll !== null) {
      const targetScroll = Number(savedScroll);
      restoreGalleryScroll(targetScroll, scrollYRef);
      syncMeshScrollPositions(
        groupRef.current,
        pitch,
        targetScroll,
        size.width,
      );
      sessionStorage.removeItem("galleryScroll");
    }

    return () => {
      document.body.style.height = "";
    };
  }, [scrollSpan, pitch, scrollEnabled]);

  const geometry = useMemo(() => {
    return buildVerticalRibbonGeometry(
      cardWidth,
      cardHeight,
      CONFIG.threads,
      CONFIG.segments,
    );
  }, [cardWidth, cardHeight]);

  const baseUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHalfHeight: { value: size.height / 2 },
      uZone: {
        value: Math.min(size.height * CONFIG.tearZoneRatio, CONFIG.tearZoneMax),
      },
      uCardSize: { value: new THREE.Vector2(cardWidth, cardHeight) },
      uScrollVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector2(-9999, -9999) },
      uTargetSize: { value: new THREE.Vector2(size.width, 600.0) },
      uTargetPosition: { value: new THREE.Vector2(0, size.height / 2 - 300.0) },
    }),
    [size.height, size.width, cardWidth, cardHeight],
  );
  const [materials] = useState(() => {
    const returnId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("returnTransitionFrom")
        : null;
    const targetIndex = returnId ? (parseInt(returnId) - 1) % 6 : -1;

    return textures.map((tex, i) => {
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      return new THREE.ShaderMaterial({
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          ...baseUniforms,
          uMap: { value: tex },
          uSeed: { value: (i + 1) * 0.731 },
          uImageAspect: { value: tex.image.width / tex.image.height },
          uTransitionProgress: { value: targetIndex === i ? 1.0 : 0.0 },
          uOpacity: { value: 1.0 },
        },
      });
    });
  });

  const currentMouse = useRef(new THREE.Vector2(-9999, -9999));

  useEffect(() => {
    if (!scrollEnabled) return;

    const lenis = window.lenisInstance;
    if (!lenis) return;

    const onScroll = (e) => {
      scrollYRef.current = e.animatedScroll ?? e.scroll ?? scrollYRef.current;
      if (isTransitioning.current) return;
      materials.forEach((mat) => {
        mat.uniforms.uScrollVelocity.value = e.velocity || 0;
      });
    };

    lenis.on("scroll", onScroll);
    if (typeof lenis.scroll === "number") {
      scrollYRef.current = lenis.scroll;
    }

    return () => {
      lenis.off("scroll", onScroll);
    };
  }, [materials, scrollEnabled]);
  useEffect(() => {
    if (!scrollEnabled) return;

    const returnId = sessionStorage.getItem("returnTransitionFrom");
    if (!returnId) return;

    const index = (parseInt(returnId, 10) - 1) % images.length;
    if (!materials[index]) return;

    syncMeshScrollPositions(
      groupRef.current,
      pitch,
      scrollYRef.current,
      size.width,
    );
    isTransitioning.current = true;

    materials.forEach((mat, i) => {
      if (i !== index) {
        mat.uniforms.uOpacity.value = 0.0;
      }
    });

    const runReverse = () => {
      gsap.to(materials[index].uniforms.uTransitionProgress, {
        value: 0.0,
        duration: 1.0,
        ease: "power3.inOut",
        onComplete: () => {
          const finalScroll = getGalleryScroll();
          restoreGalleryScroll(finalScroll, scrollYRef);
          syncMeshScrollPositions(
            groupRef.current,
            pitch,
            finalScroll,
            size.width,
          );
          materials[index].uniforms.uTransitionProgress.value = 0;
          isTransitioning.current = false;
          sessionStorage.removeItem("returnTransitionFrom");

          materials.forEach((mat, i) => {
            if (i !== index) {
              gsap.to(mat.uniforms.uOpacity, {
                value: 1.0,
                duration: 0.4,
                ease: "power2.inOut",
              });
            }
          });
        },
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(runReverse);
    });
  }, [materials, pitch, images.length, scrollEnabled]);
  useEffect(() => {
    const handlePrepare = () => {
      if (groupRef.current) {
        groupRef.current.position.y = -size.height * 0.14;
      }
    };

    const handleStart = (e) => {
      if (!groupRef.current) return;
      const duration = e.detail?.duration || 0.9;

      gsap.to(groupRef.current.position, {
        y: 0,
        duration: duration,
        ease: "power3.out",
      });
    };

    const handleExit = (e) => {
      if (!groupRef.current) return;
      const duration = e.detail?.duration || 0.65;

      gsap.to(groupRef.current.position, {
        y: -size.height * 0.14,
        duration: duration,
        ease: "power3.inOut",
      });
    };

    window.addEventListener("prepare-gallery-enter", handlePrepare);
    window.addEventListener("start-gallery-enter", handleStart);
    window.addEventListener("start-gallery-exit", handleExit);
    return () => {
      window.removeEventListener("prepare-gallery-enter", handlePrepare);
      window.removeEventListener("start-gallery-enter", handleStart);
      window.removeEventListener("start-gallery-exit", handleExit);
    };
  }, [size.height]);

  useFrame((state) => {
    const targetX = (state.pointer.x * size.width) / 2;
    const targetY = (state.pointer.y * size.height) / 2;

    if (currentMouse.current.x === -9999) {
      currentMouse.current.set(targetX, targetY);
    } else {
      currentMouse.current.x += (targetX - currentMouse.current.x) * 0.1;
      currentMouse.current.y += (targetY - currentMouse.current.y) * 0.1;
    }

    if (groupRef.current) {
      materials.forEach((mat) => {
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uMouse.value.copy(currentMouse.current);
      });

      if (!isTransitioning.current) {
        syncMeshScrollPositions(
          groupRef.current,
          pitch,
          scrollYRef.current,
          size.width,
        );
      }
    }
  });

  const handleClick = (index, mesh) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    sessionStorage.setItem("galleryScroll", String(getGalleryScroll()));
    materials.forEach((mat, i) => {
      if (i !== index) {
        gsap.to(mat.uniforms.uOpacity, {
          value: 0.0,
          duration: 0.4,
          ease: "power2.out",
        });
      }
    });

    const targetMaterial = materials[index];
    const id = (index % 6) + 1;
    const src = images[index];
    import("./TransitionOverlay").then((m) =>
      m.triggerTransition(null, src, id),
    );
    gsap.to(targetMaterial.uniforms.uTransitionProgress, {
      value: 1,
      duration: 1.0,
      ease: "power3.inOut",
      onComplete: () => {
        router.push(`/realisation/${id}`);
      },
    });
  };

  return (
    <group ref={groupRef}>
      {materials.map((mat, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={mat}
          frustumCulled={false}
          onClick={(e) => {
            e.stopPropagation();
            handleClick(i, e.object);
          }}
          onPointerOver={() => {
            if (!isTransitioning.current)
              document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => (document.body.style.cursor = "auto")}
        />
      ))}
    </group>
  );
};

export default function UnwovenCanvas({ scrollEnabled = true }) {
  const images = [
    "/assets/1.webp",
    "/assets/2.webp",
    "/assets/3.webp",
    "/assets/4.webp",
    "/assets/5.webp",
    "/assets/6.webp",
  ];

  return (
    <div className="unwoven-canvas">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1 }}
        style={{ pointerEvents: "auto" }}
      >
        <UnwovenScene images={images} scrollEnabled={scrollEnabled} />
      </Canvas>
    </div>
  );
}
