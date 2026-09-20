import React, { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { RenderTexture, Text, Image as DreiImage, OrthographicCamera } from "@react-three/drei";
import CustomShaderMaterial from "three-custom-shader-material";
import { vertexShader, fragmentShader } from "./shaders";

// Reproduction exacte du composant Lights de Codrops
function Lights() {
  return (
    <pointLight
      position={[2, 4, 6]}
      intensity={30}
      distance={12}
      decay={1}
      color="#ffffff"
    />
  );
}

// Composant interne pour layout pixel-perfect
function InnerScene() {
  const { size } = useThree();
  const width = size.width;

  // Tailles en pixels exactes : un peu moins énormes (10% de la largeur, max 200px)
  const titleSize = Math.min(Math.max(width * 0.10, 60), 200);

  // Bord EXACT de l'écran en pixels, avec le décalage de 20px demandé
  const startX = -width / 2 + 60;

  return (
    <>
      <color attach="background" args={['#000000']} />

      {/* On aligne le groupe exactement sur le bord gauche + 20px, et on le descend un peu */}
      <group position={[startX, -titleSize * 0.4, 0]}>
        <DreiImage
          url="/logo/logo.png"
          position={[width * 0.075, titleSize * 1.9, 0]}
          scale={[width * 0.15, width * 0.15]}
          transparent
        />

        {/* CREATIVE */}
        <Text
          position={[0, titleSize * 0.4, 0]}
          fontSize={titleSize}
          fontWeight={700}
          font="https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZg.ttf"
          letterSpacing={-0.05}
          anchorX="left"
          anchorY="middle"
        >
          CREATIVE
        </Text>

        <Text
          position={[0, -titleSize * 0.4, 0]}
          fontSize={titleSize * 0.65}
          fontWeight={300}
          font="https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZg.ttf"
          anchorX="left"
          anchorY="middle"
        >
          DEVELOPER
        </Text>

        {/* ESTD - 2016 */}
        <Text
          position={[0, -titleSize * 1.2, 0]}
          fontSize={titleSize * 0.15}
          fontWeight={300}
          font="https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuOKfMZg.ttf"
          letterSpacing={0.1}
          anchorX="left"
          anchorY="middle"
        >
          ESTD - 2016.
        </Text>
      </group>
    </>
  );
}

export default function Scene({ onClick }) {
  const state = useThree();
  const { width, height } = state.viewport;
  const { size } = state;

  const materialRef = useRef();
  const mouseLerped = useRef({ x: 0, y: 0 });
  const [texture, setTexture] = useState(null);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: null },
      uMouse: { value: new THREE.Vector2(0, 0) },
    }),
    []
  );

  useEffect(() => {
    if (materialRef.current && texture) {
      materialRef.current.uniforms.uTexture.value = texture;
    }
  }, [texture]);

  useFrame((state) => {
    if (!materialRef.current) return;
    const mouse = state.mouse;
    mouseLerped.current.x = THREE.MathUtils.lerp(mouseLerped.current.x, mouse.x, 0.1);
    mouseLerped.current.y = THREE.MathUtils.lerp(mouseLerped.current.y, mouse.y, 0.1);
    materialRef.current.uniforms.uMouse.value.x = mouseLerped.current.x;
    materialRef.current.uniforms.uMouse.value.y = mouseLerped.current.y;
  });

  return (
    <mesh onClick={onClick}>
      <planeGeometry args={[width, height, 254, 254]} />

      <CustomShaderMaterial
        ref={materialRef}
        baseMaterial={THREE.MeshStandardMaterial}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        flatShading
      />

      <RenderTexture ref={setTexture} attach="none" width={size.width * 2} height={size.height * 2}>
        <OrthographicCamera
          makeDefault
          position={[0, 0, 10]}
          zoom={1}
          left={-size.width / 2}
          right={size.width / 2}
          top={size.height / 2}
          bottom={-size.height / 2}
          near={0.1}
          far={100}
        />
        <InnerScene />
      </RenderTexture>

      <Lights />
    </mesh>
  );
}
