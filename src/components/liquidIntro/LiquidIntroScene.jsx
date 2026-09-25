'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import gsap from 'gsap';

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

export default function LiquidIntroScene() {
  const { gl, scene, viewport } = useThree();
  const blobRef = useRef();
  const planeMeshRef = useRef();
  // Position souris normalisée [-1, 1]
  const mouse = useRef({ x: 0, y: 0 });
  // Position lerped (suit la souris en retard)
  const lerpedMouse = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uDistort: { value: 0.35 },
    uSpeed: { value: 0.2 },
    uFrequency: { value: 0.9 },
  }), []);

  // Écouter le mouvement de la souris
  useEffect(() => {
    const onMove = (e) => {
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

  // Canvas 2D → CanvasTexture pour le texte de fond
  const canvasTexture = useMemo(() => {
    const w = 2048;
    const h = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#111111';
    ctx.font = `800 ${h * 0.28}px Inter, Arial Black, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const leftMargin = 40; // Décale d'environ 20px visuellement sur l'écran
    ctx.fillText('CREATIVE', leftMargin, h * 0.35);

    ctx.fillStyle = '#333333';
    ctx.font = `500 ${h * 0.18}px Inter, Arial, sans-serif`;
    ctx.fillText('DEVELOPER', leftMargin, h * 0.60);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, []);

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
    silent: true, // supprime les warnings CSM
  }), [uniforms]);


  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime;
    if (blobRef.current) {
      const t = clock.elapsedTime;

      // Lerp de la souris — très doux (0.02)
      lerpedMouse.current.x += (mouse.current.x - lerpedMouse.current.x) * 0.19;
      lerpedMouse.current.y += (mouse.current.y - lerpedMouse.current.y) * 0.04;

      // Rotation 3D complète + réaction à la souris
      blobRef.current.rotation.x = t * 0.5 + lerpedMouse.current.y * 0.3;
      blobRef.current.rotation.y = t * 0.65 + lerpedMouse.current.x * 0.3;
      blobRef.current.rotation.z = t * 0.1;

      // Position : flottement organique + dérive souris un peu plus marquée
      const mouseInfluenceX = lerpedMouse.current.x * 0.8;
      const mouseInfluenceY = lerpedMouse.current.y * 0.6;
      blobRef.current.position.x = Math.sin(t * 0.35) * 0.3 + mouseInfluenceX;
      blobRef.current.position.y = Math.sin(t * 0.5) * 0.2 + Math.cos(t * 0.3) * 0.15 + mouseInfluenceY;
    }
  });


  const blobRadius = Math.min(viewport.width, viewport.height) * 0.28;

  return (
    <>
      {/* Plan de fond — texte Canvas2D */}
      <mesh ref={planeMeshRef} position={[0, 0, -2]} scale={[viewport.width * 1.25, viewport.height * 1.25, 1]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={canvasTexture} toneMapped={false} />
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
