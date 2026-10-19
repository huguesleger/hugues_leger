"use client";

import React from "react";
import CompetenceTitle from "./CompetenceTitle";

const DEFAULT_KEYWORDS = [
  { id: "1", title: "Compétences", icon: "Circle" },
  { id: "2", title: "Savoir-faire", icon: "Circle" },
  { id: "3", title: "Techniques", icon: "Circle" },
];

export default function InfiniteKeywords({ items = DEFAULT_KEYWORDS }) {
  // Duplication pour assurer une continuité parfaite sur tout format d'écran
  const list = [...items, ...items];

  return (
    <div className="infinite-keywords" aria-hidden="true">
      <h3 className="keywords">
        {list.map((el, i) => (
          <CompetenceTitle
            key={`kw-h3-${el.id || i}-${i}`}
            title={el.title || el.titre}
            icon={el.icon}
          />
        ))}
      </h3>
      <span className="keywords">
        {list.map((el, i) => (
          <CompetenceTitle
            key={`kw-span-${el.id || i}-${i}`}
            title={el.title || el.titre}
            icon={el.icon}
          />
        ))}
      </span>
    </div>
  );
}
