"use client";

import React from "react";
import CompetenceTitle from "./CompetenceTitle";

export default function InfiniteKeywords({ items }) {

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
