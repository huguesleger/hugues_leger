import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { particlesVertexShader, particlesFragmentShader } from './introParticlesShaders';

export default function IntroParticles({ count = 3000, mouseRef, blobRef, scrollProgressRef }) {
  const pointsRef = useRef();
  const materialRef = useRef();

  const particlesData = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Create a horizontal band with higher density in the center
      const x = (Math.random() - 0.5) * 22; // Spread across full width
      const u = Math.random() - 0.5;
      // Exponential distribution around 0 for Y, plus a slight wave
      const y = Math.sign(u) * Math.pow(Math.abs(u) * 2, 2.0) * 2.5 + Math.sin(x * 0.4) * 0.5;
      
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2; // z
      
      // Mostly tiny dust, very rarely a slightly larger one
      sizes[i] = Math.pow(Math.random(), 5.0) * 0.8 + 0.15;
    }
    
    return { positions, sizes };
  }, [count]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    uBlobPos: { value: new THREE.Vector3(0, 0, 0) },
    uProgress: { value: 0 },
  }), []);

  const localMouse = useRef(new THREE.Vector2(0, 0));

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      
      if (mouseRef && mouseRef.current) {
        localMouse.current.x += (mouseRef.current.x - localMouse.current.x) * 0.05;
        localMouse.current.y += (mouseRef.current.y - localMouse.current.y) * 0.05;
        materialRef.current.uniforms.uMouse.value.copy(localMouse.current);
      }
      if (blobRef && blobRef.current) {
        materialRef.current.uniforms.uBlobPos.value.copy(blobRef.current.position);
      }
      if (scrollProgressRef && scrollProgressRef.current !== undefined) {
        materialRef.current.uniforms.uProgress.value = scrollProgressRef.current;
      }
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particlesData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          count={count}
          array={particlesData.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={particlesVertexShader}
        fragmentShader={particlesFragmentShader}
        uniforms={uniforms}
        transparent={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
