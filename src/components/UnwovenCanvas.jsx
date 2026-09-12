"use client";

import { useEffect, useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useTexture } from "@react-three/drei";
import { useRouter } from "next/navigation";

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
    float tear = max(bottom, top) * uStrength;

    // Scroll Distortion (Jelly effect)
    float distortion = uScrollVelocity * 1.5;
    world.y -= sin(uv.x * 3.14159) * distortion;
    world.x -= sin(uv.y * 3.14159) * distortion * 0.3;

    // Mouse Hover Bulge (Simulate 3D bulge in 2D by pushing XY outwards)
    float dist = distance(world.xy, uMouse);
    float hover = smoothstep(300.0, 0.0, dist);
    if (dist > 0.001) {
      vec2 pushDir = normalize(world.xy - uMouse);
      world.xy += pushDir * hover * 2.0; // Pushes pixels outwards from the cursor
    }
    world.z += hover * 2.0; // Slight Z just for depth sorting above others

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

    vec2 p = (vUv - 0.5) * uCardSize;
    float cardAlpha = 1.0 - smoothstep(-1.5, 0.5, sdRoundBox(p, uCardSize * 0.5, uRadius));

    float fade  = 1.0 - smoothstep(0.75, 1.0, tear) * 0.65;
    float alpha = cardAlpha * threadAlpha * fade;
    if (alpha < 0.003) discard;

    // Mouse interactive ripple & distortion
    float dist = distance(vWorld.xy, uMouse);
    float hover = smoothstep(300.0, 0.0, dist);
    float ripple = sin(dist * 0.04 - uTime * 6.0) * hover;
    vec2 mouseDir = vWorld.xy == uMouse ? vec2(0.0) : normalize(vWorld.xy - uMouse);
    vec2 uvDistortion = mouseDir * ripple * 0.005;

    float cardAspect = uCardSize.x / uCardSize.y;
    vec2 scale = cardAspect > uImageAspect
      ? vec2(1.0, uImageAspect / cardAspect)
      : vec2(cardAspect / uImageAspect, 1.0);
      
    vec2 finalUv = (vUv - 0.5) * scale + 0.5 - uvDistortion;
    vec3 color = texture2D(uMap, finalUv).rgb;

    color *= 1.0 - tear * 0.4 * rim * rim;                          
    color += tear * 0.18 * (1.0 - smoothstep(0.0, 0.45, rim));      
    color = mix(color, vec3(1.0), smoothstep(0.55, 1.0, tear) * 0.8); 

    gl_FragColor = vec4(color, alpha);
  }
`;

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

function UnwovenScene({ images }) {
  const router = useRouter();
  const { size, viewport } = useThree();
  const textures = useTexture(images);

  const cardHeight = Math.min(CONFIG.cardMaxHeight, size.height * 0.62);
  const cardWidth = cardHeight * CONFIG.cardAspect;
  const pitch = cardHeight + Math.max(24, cardHeight * CONFIG.cardGapRatio);
  
  // Total distance to scroll so the last image reaches the center (y=0)
  const scrollSpan = (images.length - 1) * pitch;

  useEffect(() => {
    // Adjust body height for finite scrolling
    // scrollHeight - innerHeight = maxScroll = scrollSpan
    document.body.style.height = `${scrollSpan + window.innerHeight}px`;
    
    // Tell Lenis to recalculate bounds and restore scroll if needed
    if (window.lenisInstance) {
      window.lenisInstance.resize();
      
      const savedScroll = sessionStorage.getItem('galleryScroll');
      if (savedScroll) {
        const targetScroll = Number(savedScroll);
        window.scrollTo(0, targetScroll);
        window.lenisInstance.scrollTo(targetScroll, { immediate: true });
        
        // Force it again after a tick to beat Next.js router
        setTimeout(() => {
          window.scrollTo(0, targetScroll);
          if (window.lenisInstance) {
            window.lenisInstance.scrollTo(targetScroll, { immediate: true });
          }
          sessionStorage.removeItem('galleryScroll');
        }, 100);
      }
    }
    
    return () => {
      document.body.style.height = '';
    };
  }, [scrollSpan]);

  const geometry = useMemo(() => {
    return buildVerticalRibbonGeometry(cardWidth, cardHeight, CONFIG.threads, CONFIG.segments);
  }, [cardWidth, cardHeight]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHalfHeight: { value: size.height / 2 },
    uZone: { value: Math.min(size.height * CONFIG.tearZoneRatio, CONFIG.tearZoneMax) },
    uStrength: { value: 1.0 },
    uWobble: { value: 1.0 },
    uCardSize: { value: new THREE.Vector2(cardWidth, cardHeight) },
    uRadius: { value: CONFIG.cardRadius },
    uScrollVelocity: { value: 0 },
    uMouse: { value: new THREE.Vector2(-9999, -9999) },
  }), [size.height, cardWidth, cardHeight]);

  const materials = useMemo(() => {
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
          ...uniforms,
          uMap: { value: tex },
          uSeed: { value: (i + 1) * 0.731 },
          uImageAspect: { value: tex.image.width / tex.image.height },
        },
      });
    });
  }, [textures, uniforms]);

  const groupRef = useRef();
  const scrollYRef = useRef(typeof window !== "undefined" ? Number(sessionStorage.getItem('galleryScroll') || 0) : 0);
  const currentMouse = useRef(new THREE.Vector2(-9999, -9999));

  // Track scroll velocity via Lenis
  useEffect(() => {
    let lenis = window.lenisInstance;
    if (!lenis) return;
    
    const onScroll = (e) => {
      // e.animatedScroll is the actual pixel value scrolled
      scrollYRef.current = e.animatedScroll || e.scroll || 0;
      materials.forEach(mat => {
        mat.uniforms.uScrollVelocity.value = e.velocity || 0;
      });
    };
    
    lenis.on('scroll', onScroll);
    
    // Also explicitly sync our ref immediately in case Lenis hasn't fired yet
    if (lenis.scroll !== undefined) {
      scrollYRef.current = lenis.scroll;
    }
    
    return () => {
      lenis.off('scroll', onScroll);
    };
  }, [materials]);

  useFrame((state) => {
    // Smoothly interpolate mouse position (World Coordinates)
    const targetX = (state.pointer.x * size.width) / 2;
    const targetY = (state.pointer.y * size.height) / 2;
    
    // If it's the first time, snap to it, otherwise lerp
    if (currentMouse.current.x === -9999) {
      currentMouse.current.set(targetX, targetY);
    } else {
      currentMouse.current.x += (targetX - currentMouse.current.x) * 0.1;
      currentMouse.current.y += (targetY - currentMouse.current.y) * 0.1;
    }

    if (groupRef.current) {
      // Update time and mouse
      materials.forEach(mat => {
        mat.uniforms.uTime.value = state.clock.elapsedTime;
        mat.uniforms.uMouse.value.copy(currentMouse.current);
      });

      // Handle vertical finite scroll based on Lenis scroll position
      const scrollOffset = scrollYRef.current;
      
      groupRef.current.children.forEach((mesh, i) => {
        const baseY = i * pitch;
        
        // Add staggered X position for layout (like original Codrops demo)
        const staggers = [-300, 200, -200, 300, -350, 150];
        mesh.position.x = staggers[i % staggers.length];

        // Linear scroll (no loop)
        mesh.position.y = scrollOffset - baseY;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {materials.map((mat, i) => (
        <mesh 
          key={i} 
          geometry={geometry} 
          material={mat} 
          frustumCulled={false}
          onClick={(e) => {
            // Calculate screen bounds for the clicked mesh
            const vector = e.object.position.clone();
            vector.project(e.camera); // Project to normalized device coordinates (NDC)
            
            // Convert NDC to screen pixels
            const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
            const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
            
            const bounds = {
              left: x - cardWidth / 2,
              top: y - cardHeight / 2,
              width: cardWidth,
              height: cardHeight
            };
            
            const id = (i % 6) + 1;
            const src = `/assets/${id}.webp`; // The actual image src
            
            // Import and trigger transition
            import('./TransitionOverlay').then(m => m.triggerTransition(bounds, src, id));
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
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
