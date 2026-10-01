"use client";

import { useId } from "react";
import { useScrollExploreRotation } from "./useScrollExploreRotation";

const CIRCLE_LABEL = "Scroll to explore - ";

export default function ScrollExploreBadge({ phase }) {
  const pathId = useId().replace(/:/g, "");
  const rotationDeg = useScrollExploreRotation(phase);

  return (
    <div className="home-scroll-explore" aria-hidden="true">
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
