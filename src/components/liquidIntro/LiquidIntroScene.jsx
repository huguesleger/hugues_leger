'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import gsap from 'gsap';

// ─── Shaders de l'effet Fluide/Loupe (Texte de fond) ─────────────────────────
const bgVertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const bgFragmentShader = /* glsl */`
  uniform sampler2D uTexCreative;
  uniform sampler2D uTexDeveloper;
  uniform vec2 uMouse;
  uniform float uVelocity;
  uniform float uProgress;
  varying vec2 vUv;

  void main() {
    // Calcul de la distance entre le pixel et la souris
    float dist = distance(vUv, uMouse);
    
    // Rayon de l'effet
    float radius = 0.35;
    
    vec2 distortedUv = vUv;
    
    // Si on est proche de la souris, on applique la distorsion
    if (dist < radius) {
      float influence = smoothstep(radius, 0.0, dist);
      vec2 dir = normalize(vUv - uMouse);
      float wave = sin(influence * 3.14159) * 0.02;
      distortedUv = vUv - dir * wave;
    }
    
    // Le texte se fond dans le fond (#f0f0f0)
    vec3 bgColor = vec3(0.941, 0.941, 0.941);
    
    // Parallax : on décale les UV en Y différemment pour les deux textes
    vec2 uvCreative = distortedUv;
    vec2 uvDeveloper = distortedUv;
    
    // CREATIVE monte un peu plus vite avec une légère rotation vers la droite
    vec2 centerC = vec2(0.5, 0.5);
    float angleC = -uProgress * 0.08;
    float cosC = cos(angleC); float sinC = sin(angleC);
    uvCreative -= centerC;
    uvCreative = vec2(cosC * uvCreative.x - sinC * uvCreative.y, sinC * uvCreative.x + cosC * uvCreative.y);
    uvCreative += centerC;
    uvCreative.y -= uProgress * 0.12;
    
    // DEVELOPER monte plus lentement avec une rotation plus légère
    vec2 centerD = vec2(0.5, 0.5);
    float angleD = -uProgress * 0.04;
    float cosD = cos(angleD); float sinD = sin(angleD);
    uvDeveloper -= centerD;
    uvDeveloper = vec2(cosD * uvDeveloper.x - sinD * uvDeveloper.y, sinD * uvDeveloper.x + cosD * uvDeveloper.y);
    uvDeveloper += centerD;
    uvDeveloper.y -= uProgress * 0.05;
    
    vec4 colorCreative = texture2D(uTexCreative, uvCreative);
    vec4 colorDeveloper = texture2D(uTexDeveloper, uvDeveloper);
    
    // On superpose DEVELOPER sur CREATIVE
    vec4 color = mix(colorCreative, colorDeveloper, colorDeveloper.a);
    
    // Le texte s'estompe en fonction de l'éloignement du centre (abs(uProgress))
    float fade = smoothstep(0.4, 0.9, abs(uProgress));
    color.rgb = mix(color.rgb, vec3(0.941, 0.941, 0.941), fade);
    
    gl_FragColor = color;
  }
`;



// ─── Vertex Shader : déformation Simplex 3D + recalcul des normals ───────────
const vertexShader = /* glsl */`
  // Simplex 3D Noise (Ashima Arts / Ian McEwan)
  vec4 permute4(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
  vec4 taylorInvSqrt4(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod(i,289.0);
    vec4 p=permute4(permute4(permute4(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=1.0/7.0;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt4(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }

  uniform float uTime;
  uniform float uDistort;
  uniform float uSpeed;
  uniform float uFrequency;
  varying vec3 vViewDir;
  varying vec3 vNorm;

  void main() {
    // Déplacer les vertices le long de leur normale
    float d = snoise(normalize(position) * uFrequency + uTime * uSpeed) * uDistort;
    vec3 newPos = position + normal * d;

    // Recalcul des normals par différences finies (technique Pavel Mazhuga)
    // → les reflets du verre suivent vraiment la forme du blob
    float eps = 0.001;
    vec3 tangent1 = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    vec3 tangent2 = normalize(cross(normal, tangent1));

    float d1 = snoise(normalize(position + tangent1 * eps) * uFrequency + uTime * uSpeed) * uDistort;
    float d2 = snoise(normalize(position + tangent2 * eps) * uFrequency + uTime * uSpeed) * uDistort;

    vec3 p1 = (position + tangent1 * eps) + normal * d1;
    vec3 p2 = (position + tangent2 * eps) + normal * d2;

    vec3 computedNormal = normalize(cross(p1 - newPos, p2 - newPos));
    csm_Position = newPos;
    csm_Normal = computedNormal;
    // Passer la normale et la direction vue en varyings pour le fragment shader
    vNorm = computedNormal;
    vec3 worldPos = (modelMatrix * vec4(newPos, 1.0)).xyz;
    vViewDir = normalize(cameraPosition - worldPos);
  }
`;

// ─── Fragment Shader : subsurface-like tint subtil ────────────────────────────
const fragmentShader = /* glsl */`
  void main() {
    csm_DiffuseColor = vec4(1.0, 1.0, 1.0, 1.0);
  }
`;

export default function LiquidIntroScene({ active = true }) {
  const { gl, scene, viewport } = useThree();
  const blobRef = useRef();
  const planeMeshRef = useRef();
  // Position souris normalisée [-1, 1]
  const mouse = useRef({ x: 0, y: 0 });
  // Position lerped (suit la souris en retard)
  const lerpedMouse = useRef({ x: 0, y: 0 });
  // Vélocité de la souris
  const mouseVelocity = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDistort: { value: 0.35 },
    uSpeed: { value: 0.2 },
    uFrequency: { value: 0.9 },
  }), []);

  const scrollProgress = useRef(0);
  const lerpedScrollProgress = useRef(0);

  useEffect(() => {
    const onScrollProgress = (e) => {
      scrollProgress.current = e.detail;
    };
    const onSnap = (e) => {
      scrollProgress.current = e.detail;
      lerpedScrollProgress.current = e.detail;
    };
    window.addEventListener('intro-scroll-progress', onScrollProgress);
    window.addEventListener('intro-scroll-snap', onSnap);
    return () => {
      window.removeEventListener('intro-scroll-progress', onScrollProgress);
      window.removeEventListener('intro-scroll-snap', onSnap);
    };
  }, []);

  // Uniforms pour le shader de distorsion fluide
  const bgUniforms = useMemo(() => ({
    uTexCreative: { value: null },
    uTexDeveloper: { value: null },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uVelocity: { value: 0 },
    uProgress: { value: 0 }
  }), []);

  // Écouter le mouvement de la souris
  useEffect(() => {
    const onMove = (e) => {
      // Pour le blob (-1 à 1)
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  // RoomEnvironment (technique NexStudio) pour les reflets de verre
  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment(gl);
    const envTexture = pmremGenerator.fromScene(roomEnv).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();
    roomEnv.dispose();
    return () => {
      envTexture.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);

  // Canvas 2D → CanvasTextures pour l'effet parallax
  const textures = useMemo(() => {
    const w = 2048;
    const h = 1024;
    const leftMargin = 40; 
    
    // Texture 1 : CREATIVE + fond gris
    const canvas1 = document.createElement('canvas');
    canvas1.width = w;
    canvas1.height = h;
    const ctx1 = canvas1.getContext('2d');
    ctx1.fillStyle = '#f0f0f0';
    ctx1.fillRect(0, 0, w, h);
    ctx1.fillStyle = '#111111';
    ctx1.font = `800 ${h * 0.28}px Inter, Arial Black, sans-serif`;
    ctx1.textAlign = 'left';
    ctx1.textBaseline = 'middle';
    ctx1.fillText('CREATIVE', leftMargin, h * 0.50);
    const texCreative = new THREE.CanvasTexture(canvas1);
    texCreative.needsUpdate = true;
    bgUniforms.uTexCreative.value = texCreative;

    // Texture 2 : DEVELOPER avec fond transparent
    const canvas2 = document.createElement('canvas');
    canvas2.width = w;
    canvas2.height = h;
    const ctx2 = canvas2.getContext('2d');
    ctx2.clearRect(0, 0, w, h);
    ctx2.fillStyle = '#333333';
    ctx2.font = `500 ${h * 0.18}px Inter, Arial, sans-serif`;
    ctx2.textAlign = 'left';
    ctx2.textBaseline = 'middle';
    ctx2.fillText('DEVELOPER', leftMargin, h * 0.75);
    const texDeveloper = new THREE.CanvasTexture(canvas2);
    texDeveloper.needsUpdate = true;
    bgUniforms.uTexDeveloper.value = texDeveloper;

    return { texCreative, texDeveloper };
  }, [bgUniforms]);

  // Custom Shader Material via CSM (technique Pavel Mazhuga)
  const material = useMemo(() => new CustomShaderMaterial({
    baseMaterial: THREE.MeshPhysicalMaterial,
    vertexShader,
    fragmentShader,
    uniforms,
    // Paramètres glass (NexStudio)
    color: 0xffffff,
    metalness: 0,
    roughness: 0.12,       // floute les reflets nets (panneaux RoomEnvironment)
    transmission: 1,
    thickness: 0.8,
    ior: 1.45,
    dispersion: 5,
    envMapIntensity: 0.5,  // réduit l'intensité des reflets d'environnement
    transparent: true,
  }), [uniforms]);


  useFrame(({ clock }) => {
    if (!active) return;
    
    uniforms.uTime.value = clock.elapsedTime;
    const t = clock.elapsedTime;
    
    // Application de la progression de scroll lissée (lerp) pour un rendu fluide
    lerpedScrollProgress.current += (scrollProgress.current - lerpedScrollProgress.current) * 0.04;
    bgUniforms.uProgress.value = lerpedScrollProgress.current;
    if (planeMeshRef.current && planeMeshRef.current.material) {
      planeMeshRef.current.material.uniforms.uProgress.value = lerpedScrollProgress.current;
    }

    // Calcul de la vélocité réelle de la souris
    const dx = mouse.current.x - lastMousePos.current.x;
    const dy = mouse.current.y - lastMousePos.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    
    // On lerp la vélocité pour qu'elle monte vite et descende doucement (retour à zéro fluide)
    mouseVelocity.current += (speed - mouseVelocity.current) * 0.1;
    bgUniforms.uVelocity.value = mouseVelocity.current;
    
    lastMousePos.current.x = mouse.current.x;
    lastMousePos.current.y = mouse.current.y;

    // Mise à jour de la position pour le shader de fond (0 à 1, inversion Y)
    // On utilise la vraie position de la souris (avec un léger lerp si on veut, ici on utilise la lerpedMouse)
    bgUniforms.uMouse.value.x = (lerpedMouse.current.x + 1) * 0.5;
    bgUniforms.uMouse.value.y = (lerpedMouse.current.y + 1) * 0.5;

    if (blobRef.current) {

      // Lerp de la souris — très doux (0.02)
      lerpedMouse.current.x += (mouse.current.x - lerpedMouse.current.x) * 0.19;
      lerpedMouse.current.y += (mouse.current.y - lerpedMouse.current.y) * 0.04;

      // Rotation 3D complète + réaction à la souris
      blobRef.current.rotation.x = t * 0.5 + lerpedMouse.current.y * 0.3;
      blobRef.current.rotation.y = t * 0.65 + lerpedMouse.current.x * 0.3;
      blobRef.current.rotation.z = t * 0.1;

      // Position : flottement organique + dérive souris
      const mouseInfluenceX = lerpedMouse.current.x * 0.8;
      const mouseInfluenceY = lerpedMouse.current.y * 0.6;
      
      // La sphère tombe vers le bas à l'aller, et retombe depuis le haut au retour
      const scrollDrop = -lerpedScrollProgress.current * viewport.height * 0.8;
      
      blobRef.current.position.x = Math.sin(t * 0.35) * 0.3 + mouseInfluenceX;
      blobRef.current.position.y = Math.sin(t * 0.5) * 0.2 + Math.cos(t * 0.3) * 0.15 + mouseInfluenceY + scrollDrop;
    }
    
    // Le texte (et son fond) glisse physiquement vers le haut
    if (planeMeshRef.current) {
      planeMeshRef.current.position.y = lerpedScrollProgress.current * viewport.height * 0.8;
    }
  });


  const blobRadius = Math.min(viewport.width, viewport.height) * 0.28;

  return (
    <>
      {/* Plan de fond — texte Canvas2D avec distorsion Fluide/Smudge */}
      <mesh key="parallax-v2" ref={planeMeshRef} position={[0, 0, -2]} scale={[viewport.width * 1.25, viewport.height * 1.25, 1]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader}
          uniforms={bgUniforms}
          toneMapped={false}
          // IMPORTANT: transparent doit être false pour que le verre de la sphère puisse le réfracter !
          transparent={false}
        />
      </mesh>

      {/* Blob organique — IcosahedronGeometry (plus de détails que la sphère) */}
      <mesh
        ref={blobRef}
        material={material}
      >
        <icosahedronGeometry args={[blobRadius, 100]} />
      </mesh>
    </>
  );
}
