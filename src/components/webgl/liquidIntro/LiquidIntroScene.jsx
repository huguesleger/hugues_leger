"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";

import {
  bgVertexShader,
  bgFragmentShader,
  vertexShader,
  fragmentShader,
} from "./liquidIntroShaders";

export default function LiquidIntroScene({ active = true }) {
  const [fontLoaded, setFontLoaded] = useState(false);

  useEffect(() => {
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setFontLoaded(true);
      });
    } else {
      setFontLoaded(true);
    }
  }, []);

  const { gl, scene, viewport, size } = useThree();
  const blobRef = useRef();
  const planeMeshRef = useRef();
  const mouse = useRef({ x: 0, y: 0 });
  const lerpedMouse = useRef({ x: 0, y: 0 });
  const mouseVelocity = useRef(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDistort: { value: 0.35 },
      uFrequency: { value: 0.9 },
    }),
    [],
  );

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
    window.addEventListener("intro-scroll-progress", onScrollProgress);
    window.addEventListener("intro-scroll-snap", onSnap);
    return () => {
      window.removeEventListener("intro-scroll-progress", onScrollProgress);
      window.removeEventListener("intro-scroll-snap", onSnap);
    };
  }, []);
  const bgUniforms = useMemo(
    () => ({
      uTexCreative: { value: null },
      uTexDeveloper: { value: null },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uVelocity: { value: 0 },
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    [],
  );
  useEffect(() => {
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
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
  const textures = useMemo(() => {
    const w = 2048;
    const h = 1024;
    const leftMargin = w * 0.04;
    const titleSize = 350;
    const subtitleSize = 184;

    const centerY = h * 0.5;
    const creativeY = centerY - titleSize * 0.25;
    const developerY = creativeY + titleSize * 0.75;
    const creativeX = leftMargin;
    const developerX = leftMargin + 15;
    const canvas1 = document.createElement("canvas");
    canvas1.width = w;
    canvas1.height = h;
    const ctx1 = canvas1.getContext("2d");
    ctx1.fillStyle = "#161515";
    ctx1.fillRect(0, 0, w, h);

    ctx1.fillStyle = "#ffffff";
    ctx1.font = `600 ${titleSize}px "SF_pro_display", sans-serif`;
    ctx1.letterSpacing = "-0.1em";
    ctx1.textAlign = "left";
    ctx1.textBaseline = "middle";
    ctx1.fillText("CREATIVE", creativeX, creativeY);
    const texCreative = new THREE.CanvasTexture(canvas1);
    texCreative.wrapS = THREE.ClampToEdgeWrapping;
    texCreative.wrapT = THREE.ClampToEdgeWrapping;
    texCreative.needsUpdate = true;
    bgUniforms.uTexCreative.value = texCreative;
    const canvas2 = document.createElement("canvas");
    canvas2.width = w;
    canvas2.height = h;
    const ctx2 = canvas2.getContext("2d");
    ctx2.clearRect(0, 0, w, h);
    ctx2.fillStyle = "#ffffff";
    ctx2.font = `400 ${subtitleSize}px Jost, sans-serif`;
    ctx2.letterSpacing = "-0.1em";
    ctx2.textAlign = "left";
    ctx2.textBaseline = "middle";
    ctx2.fillText("DEVELOPER", developerX, developerY);
    const texDeveloper = new THREE.CanvasTexture(canvas2);
    texDeveloper.wrapS = THREE.ClampToEdgeWrapping;
    texDeveloper.wrapT = THREE.ClampToEdgeWrapping;
    texDeveloper.needsUpdate = true;
    bgUniforms.uTexDeveloper.value = texDeveloper;

    return { texCreative, texDeveloper };
  }, [bgUniforms, fontLoaded]);
  const material = useMemo(
    () =>
      new CustomShaderMaterial({
        baseMaterial: THREE.MeshPhysicalMaterial,
        vertexShader,
        fragmentShader,
        uniforms,
        color: 0xffffff,
        metalness: 0,
        roughness: 0.12,
        transmission: 1,
        thickness: 0.8,
        ior: 1.45,
        dispersion: 5,
        envMapIntensity: 0.5,
        transparent: true,
      }),
    [uniforms],
  );

  useFrame(({ clock }) => {
    if (!active) return;

    const animSpeed = 0.2;
    uniforms.uTime.value = (clock.elapsedTime * animSpeed) % (Math.PI * 10.0);
    const t = clock.elapsedTime;
    lerpedScrollProgress.current +=
      (scrollProgress.current - lerpedScrollProgress.current) * 0.04;
    bgUniforms.uProgress.value = lerpedScrollProgress.current;
    if (planeMeshRef.current && planeMeshRef.current.material) {
      planeMeshRef.current.material.uniforms.uProgress.value =
        lerpedScrollProgress.current;
      planeMeshRef.current.material.uniforms.uResolution.value.set(
        size.width,
        size.height,
      );
    }
    const dx = mouse.current.x - lastMousePos.current.x;
    const dy = mouse.current.y - lastMousePos.current.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    mouseVelocity.current += (speed - mouseVelocity.current) * 0.1;
    bgUniforms.uVelocity.value = mouseVelocity.current;

    lastMousePos.current.x = mouse.current.x;
    lastMousePos.current.y = mouse.current.y;
    bgUniforms.uMouse.value.x = (lerpedMouse.current.x + 1) * 0.5;
    bgUniforms.uMouse.value.y = (lerpedMouse.current.y + 1) * 0.5;

    if (blobRef.current) {
      lerpedMouse.current.x += (mouse.current.x - lerpedMouse.current.x) * 0.19;
      lerpedMouse.current.y += (mouse.current.y - lerpedMouse.current.y) * 0.04;
      blobRef.current.rotation.x = t * 0.5 + lerpedMouse.current.y * 0.3;
      blobRef.current.rotation.y = t * 0.65 + lerpedMouse.current.x * 0.3;
      blobRef.current.rotation.z = t * 0.1;
      const mouseInfluenceX = lerpedMouse.current.x * 0.8;
      const mouseInfluenceY = lerpedMouse.current.y * 0.6;
      const scrollDrop = -lerpedScrollProgress.current * viewport.height * 0.8;

      blobRef.current.position.x = Math.sin(t * 0.35) * 0.3 + mouseInfluenceX;
      blobRef.current.position.y =
        Math.sin(t * 0.5) * 0.2 +
        Math.cos(t * 0.3) * 0.15 +
        mouseInfluenceY +
        scrollDrop;
    }
    if (planeMeshRef.current) {
      planeMeshRef.current.position.y =
        lerpedScrollProgress.current * viewport.height * 0.8;
    }
  });
  const isMobile = viewport.width < viewport.height;
  const blobRadius = isMobile
    ? viewport.width * 0.2
    : Math.min(viewport.width, viewport.height) * 0.28;
  uniforms.uDistort.value = blobRadius * 0.15;

  return (
    <>
      {}
      <mesh
        key="parallax-v2"
        ref={planeMeshRef}
        position={[0, 0, -2]}
        scale={[viewport.width * 1.25, viewport.height * 1.25, 1]}
      >
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          vertexShader={bgVertexShader}
          fragmentShader={bgFragmentShader}
          uniforms={bgUniforms}
          toneMapped={false}
          transparent={false}
        />
      </mesh>

      {}
      <mesh ref={blobRef} material={material}>
        <icosahedronGeometry args={[blobRadius, 100]} />
      </mesh>
    </>
  );
}
