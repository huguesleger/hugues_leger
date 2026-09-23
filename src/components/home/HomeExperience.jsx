'use client';

import { useState } from 'react';
import Gallery from '@/components/gallery/Gallery';
import WaveGridCanvas from '@/components/waveGrid/WaveGridCanvas';
import { useHomeIntroTransition } from './useHomeIntroTransition';

export default function HomeExperience() {
  const [skipIntro] = useState(
    () =>
      typeof window !== 'undefined' &&
      sessionStorage.getItem('returnTransitionFrom') != null
  );

  const {
    introPanelRef,
    coverRef,
    galleryRef,
    isGalleryActive,
    isWaveActive,
  } = useHomeIntroTransition({ skipIntro });

  return (
    <div className="home-experience">
      <div
        ref={galleryRef}
        className={`home-gallery${isGalleryActive ? '' : ' home-gallery--hidden'}`}
      >
        <Gallery scrollEnabled={isGalleryActive} />
      </div>

      <div ref={coverRef} className="home-intro-cover" aria-hidden="true" />

      <section
        ref={introPanelRef}
        className="home-intro"
        aria-label="Introduction"
      >
        <WaveGridCanvas active={isWaveActive} />
        <p className="home-intro__hint" aria-hidden="true">
          Scroll
        </p>
      </section>
    </div>
  );
}
