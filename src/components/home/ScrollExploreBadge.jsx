"use client";

import { useEffect, useId, useRef } from "react";
import gsap from "gsap";
import { useScrollExploreRotation } from "./useScrollExploreRotation";

const CIRCLE_LABEL = "Scroll to explore - ";

export default function ScrollExploreBadge({ phase }) {
  const pathId = useId().replace(/:/g, "");
  const rotationDeg = useScrollExploreRotation(phase);
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    if (sessionStorage.getItem("returnTransitionFrom") != null) {
      gsap.set(el, { opacity: 0 });
    }

    const handleProjectOpen = () => {
      gsap.to(el, { opacity: 0, duration: 0.4, ease: "power2.out" });
    };

    const handleProjectReturn = () => {
      gsap.to(el, { opacity: 1, duration: 0.6, ease: "power2.inOut" });
    };

    window.addEventListener("gallery-project-open", handleProjectOpen);
    window.addEventListener("gallery-project-return", handleProjectReturn);
    return () => {
      gsap.killTweensOf(el);
      window.removeEventListener("gallery-project-open", handleProjectOpen);
      window.removeEventListener("gallery-project-return", handleProjectReturn);
    };
  }, []);

  return (
    <div ref={rootRef} className="home-scroll-explore" aria-hidden="true">
      <svg
        className="home-scroll-explore__svg"
        viewBox="0 0 300 300"
        style={{
          transform: `rotate(${rotationDeg}deg)`,
        }}
      >
        <defs>
          <path
            id={pathId}
            d="M150, 150 m -74, 0 a 74,74 0 0,1 148,0 a 74,74 0 0,1 -148,0"
          />
        </defs>
        <text className="home-scroll-explore__text">
          <textPath href={`#${pathId}`} startOffset="0%">
            {CIRCLE_LABEL.repeat(2)}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
