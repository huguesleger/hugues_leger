"use client";

import { useEffect, useRef } from "react";
import UnwovenCanvas from "@/components/UnwovenCanvas";

export default function Gallery({ scrollEnabled = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasLoaded = sessionStorage.getItem("hasLoadedOnce");
      if (!hasLoaded) {
        document.body.classList.add("loading");
        sessionStorage.setItem("hasLoadedOnce", "true");
        setTimeout(() => {
          document.body.classList.remove("loading");
        }, 500);
      }
    }
  }, []);

  return (
    <div ref={containerRef}>
      <UnwovenCanvas scrollEnabled={scrollEnabled} />
    </div>
  );
}
