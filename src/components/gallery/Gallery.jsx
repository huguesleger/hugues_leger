"use client";

import { useEffect, useRef } from "react";
import UnwovenCanvas from "../UnwovenCanvas";

export default function Gallery() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.add("loading");
      // Simulate loading time for images in WebGL (could be handled better with React Suspense)
      setTimeout(() => {
        document.body.classList.remove("loading");
      }, 500);
    }
  }, []);

  return (
    <div ref={containerRef}>
      <header className="header" style={{ position: "fixed", top: 0, left: 0, zIndex: 10 }}>
        <h1 className="header__title">Portfolio</h1>
      </header>
      
      <UnwovenCanvas />
    </div>
  );
}
