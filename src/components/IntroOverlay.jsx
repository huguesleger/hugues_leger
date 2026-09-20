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
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>

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
          style={{
            position: 'fixed', // Empêche tout scroll pendant l'intro
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 50,
            background: '#000000', // Fond noir pour correspondre au design Codrops
            pointerEvents: 'auto',
            touchAction: 'none' // Empêche le scroll tactile natif de fuiter
          }}
        >
          <div ref={canvasRef} style={{ width: '100%', height: '100%' }}>
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
            style={{
              position: 'absolute',
              bottom: '50px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '12px 40px',
              background: 'white',
              color: 'black',
              border: 'none',
              borderRadius: '30px',
              cursor: 'pointer',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontSize: '14px',
              zIndex: 100,
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s ease, background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateX(-50%) scale(1.05)';
              e.target.style.background = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateX(-50%) scale(1)';
              e.target.style.background = 'white';
            }}
          >
            Entrer
          </button>
        </div>
      )}
    </div>
  );
}
