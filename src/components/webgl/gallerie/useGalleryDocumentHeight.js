"use client";

import { useEffect } from "react";
import { getGalleryDocumentHeight } from "@/lib/galleryLayout";

export function useGalleryDocumentHeight(projectCount, scrollEnabled) {
  useEffect(() => {
    if (!scrollEnabled || projectCount < 1) return;

    const apply = () => {
      const height = getGalleryDocumentHeight(
        projectCount,
        window.innerWidth,
        window.innerHeight,
      );
      document.body.style.height = `${height}px`;
      window.lenisInstance?.resize();
    };

    apply();
    window.addEventListener("resize", apply);

    return () => {
      window.removeEventListener("resize", apply);
      document.body.style.height = "";
    };
  }, [projectCount, scrollEnabled]);
}
