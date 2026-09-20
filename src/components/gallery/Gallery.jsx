"use client";

import { useEffect, useRef } from "react";
import UnwovenCanvas from "@/components/UnwovenCanvas";

export default function Gallery() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasLoaded = sessionStorage.getItem('hasLoadedOnce');
      if (!hasLoaded) {
        document.body.classList.add("loading");
        sessionStorage.setItem('hasLoadedOnce', 'true');
        setTimeout(() => {
          document.body.classList.remove("loading");
        }, 500);
      }
    }
  }, []);


  return (
    <div ref={containerRef}>
      <header className="header gallery__header">
        <h1 className="header__title">Portfolio</h1>
      </header>
      
      <UnwovenCanvas />
    </div>
  );
}
