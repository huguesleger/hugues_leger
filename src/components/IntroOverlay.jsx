'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './webgl/Scene';
import { gsap } from 'gsap';

export default function IntroOverlay({ children }) {
  const [introFinished, setIntroFinished] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Vérifier si l'utilisateur a déjà vu l'intro dans cette session
  useEffect(() => {
    setIsClient(true);
    if (sessionStorage.getItem('hasSeenIntro') === 'true') {
      setIntroFinished(true);
    }
  }, []);

  // Gérer le blocage du scroll sans toucher à overflow (bug iOS)
  useEffect(() => {
    if (isClient) {
      if (!introFinished) {
        // Bloque Lenis (smooth scroll)
        if (window.lenisInstance) window.lenisInstance.stop();
      } else {
        // Réactive Lenis
        if (window.lenisInstance) window.lenisInstance.start();
      }
    }
    return () => {
      if (window.lenisInstance) window.lenisInstance.start();
    };
  }, [introFinished, isClient]);

  const handleEnterClick = () => {
    if (introFinished) return;

    const tl = gsap.timeline({
      onComplete: () => {
        sessionStorage.setItem('hasSeenIntro', 'true');
        setIntroFinished(true);
      }
    });

    // Le conteneur glisse vers le haut (plus rapide)
    tl.to(containerRef.current, {
      y: '-100%',
      duration: 1.2,
      ease: 'power3.inOut'
    }, 0);

    // Le fondu transparent est plus long
    tl.to(containerRef.current, {
      opacity: 0,
      duration: 2.2,
      ease: 'power2.inOut'
    }, 0);
  };

  return (
    <div className="intro-overlay-wrapper">

      {/* La galerie en arrière-plan */}
      <div
        style={{
          width: '100%',
          opacity: introFinished ? 1 : 0,
          transition: 'opacity 1.5s ease-out'
        }}
      >
        {children}
      </div>

      {/* Le Canvas par-dessus */}
      {!introFinished && (
        <div
          ref={containerRef}
          className="intro-overlay"
        >
          <div ref={canvasRef} className="intro-overlay__canvas">
            {/* Configuration exacte du canvas de Codrops */}
            <Canvas
              dpr={[1, 2]}
              gl={{
                antialias: true,
                preserveDrawingBuffer: true,
              }}
              camera={{
                fov: 55,
                near: 0.1,
                far: 200,
              }}
            >
              <React.Suspense fallback={null}>
                <Scene />
              </React.Suspense>
            </Canvas>
          </div>

          {/* Bouton pour entrer */}
          <button
            onClick={handleEnterClick}
            className="intro-overlay__enter-btn"
          >
            Entrer
          </button>
        </div>
      )}
    </div>
  );
}
