"use client";
/* eslint-disable react-hooks/immutability */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useLenis } from 'lenis/react';
import gsap from 'gsap';
import { useRouter } from 'next/navigation';

const VERTEX_SHADER = `
  attribute float aThread;
  attribute float aRim;

  uniform float uTime;
  uniform float uHalfHeight;
  uniform float uZone;
  uniform float uStrength;
  uniform float uWobble;
  uniform float uSeed;
  uniform float uScrollVelocity;
  uniform vec2 uMouse;
  
  uniform float uTransitionProgress;
  uniform vec2 uTargetSize;
  uniform vec2 uTargetPosition;
  uniform vec2 uCardSize;

  varying vec2  vUv;
  varying float vTear;
  varying float vRim;
  varying float vRandom;
  varying vec3  vWorld;

  float hash(float n) {
    return fract(sin(n * 127.1 + 311.7) * 43758.5453);
  }

  void main() {
    vUv = uv;
    vRim = aRim;

    vec4 world = modelMatrix * vec4(position, 1.0);
    float y = world.y;

    float bottom = 1.0 - smoothstep(-uHalfHeight, -uHalfHeight + uZone, y);
    float top = smoothstep(uHalfHeight - uZone, uHalfHeight, y);
    // Tear fades out during transition
    float tear = max(bottom, top) * uStrength * (1.0 - uTransitionProgress);

    // Scroll Distortion (Jelly effect) fades out during transition
    float distortion = uScrollVelocity * 1.5 * (1.0 - uTransitionProgress);
    world.y -= sin(uv.x * 3.14159) * distortion;
    world.x -= sin(uv.y * 3.14159) * distortion * 0.3;

    // Mouse Hover Bulge
    float dist = distance(world.xy, uMouse);
    float hover = smoothstep(300.0, 0.0, dist) * (1.0 - uTransitionProgress);
    if (dist > 0.001) {
      vec2 pushDir = normalize(world.xy - uMouse);
      world.xy += pushDir * hover * 2.0; 
    }
    world.z += hover * 2.0; 

    float direction = y < 0.0 ? -1.0 : 1.0;

    float randomA = hash(aThread + uSeed * 57.0);
    float randomB = hash(aThread * 3.7 + uSeed * 91.0);
    vRandom = randomA;

    float t = pow(tear, 1.4);
    float speedFactor = 1.0 + abs(uScrollVelocity) * 0.02;

    float run = t * (60.0 + randomA * 420.0) * speedFactor;
    run *= 0.85 + 0.15 * sin(uTime * (1.0 + randomB * 2.0) + randomA * 6.2831);
    
    world.y += direction * run;
    world.x += (randomA - 0.5) * 170.0 * t * t;
    world.x += sin(world.y * 0.02 + uTime * (1.6 + randomA * 2.2) + randomA * 6.2831)
               * (5.0 + 13.0 * randomA) * t * uWobble;

    // --- TRANSITION TO FULLSCREEN WITH RIPPLE ---
    float angle = uTransitionProgress * 3.14159265 / 2.0;
    float wave = cos(angle);
    float c = sin(length(uv - 0.5) * 15.0 + uTransitionProgress * 12.0) * 0.5 + 0.5;

    // The base origin of the mesh in world space
    vec2 meshOrigin = world.xy - position.xy; 
    
    // Smoothly move the origin to the target position (center of the 600px header)
    vec2 currentOrigin = mix(meshOrigin, uTargetPosition, uTransitionProgress);

    // Scale vertices to target size (100vw x 600px) + ripple
    vec2 targetScale = uTargetSize / uCardSize;
    vec2 currentScale = mix(vec2(1.0), targetScale + wave * c, uTransitionProgress);
    vec2 scaledLocalPos = position.xy * currentScale;

    // Apply the expanded positions
    world.xy = currentOrigin + scaledLocalPos;
    
    // Push active mesh slightly forward so it covers others (but don't pass the camera at z=10)
    world.z += uTransitionProgress * 5.0; 

    vTear = tear;
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform sampler2D uMap;
  uniform vec2  uCardSize;
  uniform float uRadius;
  uniform float uImageAspect;
  uniform vec2  uMouse;
  uniform float uTime;
  
  uniform float uTransitionProgress;
  uniform vec2 uTargetSize;
  uniform float uOpacity;

  varying vec2  vUv;
  varying float vTear;
  varying float vRim;
  varying float vRandom;
  varying vec3  vWorld;

  float sdRoundBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float tear = vTear;
    float rim  = abs(vRim); 

    float coreWidth = mix(0.8, 0.16 + vRandom * 0.12, smoothstep(0.0, 0.85, tear));
    float threadAlpha = 1.0 - smoothstep(coreWidth - 0.10, coreWidth + 0.06, rim);
    threadAlpha = mix(1.0, threadAlpha, smoothstep(0.03, 0.30, tear));

    vec2 currentSize = mix(uCardSize, uTargetSize, uTransitionProgress);
    float currentRadius = mix(uRadius, 0.0, uTransitionProgress);

    vec2 p = (vUv - 0.5) * currentSize;
    float cardAlpha = 1.0 - smoothstep(-1.5, 0.5, sdRoundBox(p, currentSize * 0.5, currentRadius));

    float fade  = 1.0 - smoothstep(0.75, 1.0, tear) * 0.65;
    float alpha = cardAlpha * threadAlpha * fade * uOpacity;
    if (alpha < 0.003) discard;

    // Mouse interactive ripple
    float dist = distance(vWorld.xy, uMouse);
    float hover = smoothstep(300.0, 0.0, dist) * (1.0 - uTransitionProgress);
    float ripple = sin(dist * 0.04 - uTime * 6.0) * hover;
    vec2 mouseDir = vWorld.xy == uMouse ? vec2(0.0) : normalize(vWorld.xy - uMouse);
    vec2 uvDistortion = mouseDir * ripple * 0.005;

    float currentAspect = currentSize.x / currentSize.y;
    vec2 scale = currentAspect > uImageAspect
      ? vec2(1.0, uImageAspect / currentAspect)
      : vec2(currentAspect / uImageAspect, 1.0);
      
    vec2 finalUv = (vUv - 0.5) * scale + 0.5 - uvDistortion;
    vec3 color = texture2D(uMap, finalUv).rgb;

    color *= 1.0 - tear * 0.4 * rim * rim;                          
    color += tear * 0.18 * (1.0 - smoothstep(0.0, 0.45, rim));      
    color = mix(color, vec3(1.0), smoothstep(0.55, 1.0, tear) * 0.8); 

    gl_FragColor = vec4(color, alpha);
  }
`;

const CONFIG = {
  threads: 26,
  segments: 20,
  cardMaxHeight: 452,
  cardAspect: 0.75,
  cardGapRatio: 0.11,
  cardRadius: 0,
  tearZoneRatio: 0.26,
  tearZoneMax: 380,
};

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
      const ux = (t + col) / threads; // 0 at left, 1 at right
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
  return geometry;
}

const UnwovenScene = ({ images }) => {
  const groupRef = useRef();
  const { size, camera } = useThree();
  const textures = useTexture(images);
  const router = useRouter();

  const cardHeight = Math.min(CONFIG.cardMaxHeight, size.height * 0.62);
  const cardWidth = cardHeight * CONFIG.cardAspect;
  const pitch = cardHeight + Math.max(24, cardHeight * CONFIG.cardGapRatio);
  
  const scrollSpan = (images.length - 1) * pitch;

  const isTransitioning = useRef(false);

  useEffect(() => {
    document.body.style.height = `${scrollSpan + window.innerHeight}px`;
    if (window.lenisInstance) {
      window.lenisInstance.resize();
      const savedScroll = sessionStorage.getItem('galleryScroll');
      if (savedScroll) {
        const targetScroll = Number(savedScroll);
        window.scrollTo(0, targetScroll);
        window.lenisInstance.scrollTo(targetScroll, { immediate: true });
        setTimeout(() => {
          window.scrollTo(0, targetScroll);
          if (window.lenisInstance) {
            window.lenisInstance.scrollTo(targetScroll, { immediate: true });
          }
          sessionStorage.removeItem('galleryScroll');
        }, 100);
      }
    }
    return () => { document.body.style.height = ''; };
  }, [scrollSpan]);

  const geometry = useMemo(() => {
    return buildVerticalRibbonGeometry(cardWidth, cardHeight, CONFIG.threads, CONFIG.segments);
  }, [cardWidth, cardHeight]);

  const baseUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHalfHeight: { value: size.height / 2 },
    uZone: { value: Math.min(size.height * CONFIG.tearZoneRatio, CONFIG.tearZoneMax) },
    uStrength: { value: 1.0 },
    uWobble: { value: 1.0 },
    uCardSize: { value: new THREE.Vector2(cardWidth, cardHeight) },
    uRadius: { value: CONFIG.cardRadius },
    uScrollVelocity: { value: 0 },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
    uTargetSize: { value: new THREE.Vector2(size.width, 600.0) },
    uTargetPosition: { value: new THREE.Vector2(0, size.height / 2 - 300.0) },
  }), [size.height, size.width, cardWidth, cardHeight]);

  // Unique uniforms for each mesh (using useState lazy init to satisfy React Compiler)
  const [materials] = useState(() => {
    // Check if we are starting a reverse transition
    const returnId = typeof window !== 'undefined' ? sessionStorage.getItem('returnTransitionFrom') : null;
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
          uTransitionProgress: { value: (targetIndex === i) ? 1.0 : 0.0 },
          uOpacity: { value: 1.0 },
        },
      });
    });
  });

  const scrollYRef = useRef(typeof window !== "undefined" ? Number(sessionStorage.getItem('galleryScroll') || 0) : 0);
  const currentMouse = useRef(new THREE.Vector2(-9999, -9999));

  useEffect(() => {
    let lenis = window.lenisInstance;
    if (!lenis) return;
    const onScroll = (e) => {
      if (isTransitioning.current) return;
      scrollYRef.current = e.animatedScroll || e.scroll || 0;
      materials.forEach(mat => {
        mat.uniforms.uScrollVelocity.value = e.velocity || 0;
      });
    };
    lenis.on('scroll', onScroll);
    if (lenis.scroll !== undefined) {
      scrollYRef.current = lenis.scroll;
    }
    return () => {
      lenis.off('scroll', onScroll);
    };
  }, [materials]);

  // Handle Reverse Transition on Mount
  useEffect(() => {
    const returnId = sessionStorage.getItem('returnTransitionFrom');
    if (returnId) {
      const index = (parseInt(returnId) - 1) % 6;
      if (materials[index]) {
        isTransitioning.current = true;
        
        // Hide others initially
        materials.forEach((mat, i) => {
          if (i !== index) {
            mat.uniforms.uOpacity.value = 0.0;
          }
        });

        // Trigger the background fade-out overlay
        import('./TransitionOverlay').then(m => m.triggerReverseTransition());

        // Wait a tiny bit for render, then animate back
        setTimeout(() => {
          gsap.to(materials[index].uniforms.uTransitionProgress, {
            value: 0.0,
            duration: 1.0,
            ease: 'power3.inOut',
            onComplete: () => {
              isTransitioning.current = false;
              // Fade others back in
              materials.forEach((mat, i) => {
                if (i !== index) {
                  gsap.to(mat.uniforms.uOpacity, {
                    value: 1.0,
                    duration: 0.4,
                    ease: 'power2.inOut'
                  });
                }
              });
              materials[index].uniforms.uTransitionProgress.value = 0;
              sessionStorage.removeItem('returnTransitionFrom');
            }
          });
        }, 50); // 50ms to ensure WebGL renders one frame
      }
    }
  }, [materials]);

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
      materials.forEach(mat => {
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uMouse.value.copy(currentMouse.current);
      });

      if (!isTransitioning.current) {
        const scrollOffset = scrollYRef.current;
        groupRef.current.children.forEach((mesh, i) => {
          const baseY = i * pitch;
          const staggers = [-300, 200, -200, 300, -350, 150];
          mesh.position.x = staggers[i % staggers.length];
          mesh.position.y = scrollOffset - baseY;
        });
      }
    }
  });

  const handleClick = (index, mesh) => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    
    sessionStorage.setItem('galleryScroll', window.scrollY);
    
    // Fade out other meshes
    materials.forEach((mat, i) => {
      if (i !== index) {
        gsap.to(mat.uniforms.uOpacity, {
          value: 0.0,
          duration: 0.4,
          ease: 'power2.out'
        });
      }
    });

    const targetMaterial = materials[index];
    const id = (index % 6) + 1;
    const src = images[index];

    // Trigger the background overlay and pass the image source
    import('./TransitionOverlay').then(m => m.triggerTransition(null, src, id));

    // Animate the clicked mesh
    gsap.to(targetMaterial.uniforms.uTransitionProgress, {
      value: 1,
      duration: 1.0,
      ease: 'power3.inOut',
      onComplete: () => {
        router.push(`/realisation/${id}`);
      }
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
            if (!isTransitioning.current) document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        />
      ))}
    </group>
  );
}

export default function UnwovenCanvas() {
  const images = [
    "/assets/1.webp",
    "/assets/2.webp",
    "/assets/3.webp",
    "/assets/4.webp",
    "/assets/5.webp",
    "/assets/6.webp",
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "auto" }}>
      <Canvas orthographic camera={{ position: [0, 0, 10], zoom: 1 }}>
        <UnwovenScene images={images} />
      </Canvas>
    </div>
  );
}

