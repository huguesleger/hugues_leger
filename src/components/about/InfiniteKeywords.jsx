"use client";

import React from "react";
import CompetenceTitle from "./CompetenceTitle";

const DEFAULT_KEYWORDS = [
  { id: "1", title: "Compétences", icon: "Circle" },
  { id: "2", title: "Savoir-faire", icon: "Circle" },
  { id: "3", title: "Techniques", icon: "Circle" },
];

export default function InfiniteKeywords({ items = DEFAULT_KEYWORDS }) {

  const list = [...items, ...items];

  return (
    <div className="infinite-keywords" aria-hidden="true">
      <div className="infinite-keywords__track">
        {["a", "b"].map((group) => (
          <div className="keywords" key={group}>
            {list.map((el, i) => (
              <CompetenceTitle
                key={`${group}-${el.id || i}-${i}`}
                title={el.title || el.titre}
                icon={el.icon}
                bold={el.bold}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
