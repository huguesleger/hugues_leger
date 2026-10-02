"use client";

import { useEffect, useRef } from "react";
import { GALLERY_PROJECTS } from "@/lib/galleryProjects";
import UnwovenCanvas from "./UnwovenCanvas";
import GalleryContactSection from "./GalleryContactSection";
import { useGalleryDocumentHeight } from "./useGalleryDocumentHeight";

export default function Gallery({ scrollEnabled = true }) {
  const containerRef = useRef(null);

  useGalleryDocumentHeight(GALLERY_PROJECTS.length, scrollEnabled);

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
      <GalleryContactSection scrollEnabled={scrollEnabled} />
    </div>
  );
}
