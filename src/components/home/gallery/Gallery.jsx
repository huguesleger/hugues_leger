"use client";

import { useEffect, useRef } from "react";
import UnwovenCanvas from "./UnwovenCanvas";
import GalleryContactSection from "./GalleryContactSection";
import { useGalleryDocumentHeight } from "@/hooks/useGalleryDocumentHeight";

export default function Gallery({ projects, contact, scrollEnabled = true }) {
  const containerRef = useRef(null);

  useGalleryDocumentHeight(projects.length, scrollEnabled);

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
      <UnwovenCanvas projects={projects} scrollEnabled={scrollEnabled} />
      <GalleryContactSection
        projectCount={projects.length}
        statement={contact.statement}
        email={contact.email}
        scrollEnabled={scrollEnabled}
      />
    </div>
  );
}
