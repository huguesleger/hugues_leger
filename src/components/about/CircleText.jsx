"use client";

import React, { forwardRef } from "react";

const CircleText = forwardRef(function CircleText(
  {
    idPrefix = "circle",
    texts = [],
    theme = "dark",
    className = "",
  },
  ref
) {
  const [txt1 = "", txt2 = "", txt3 = "", txt4 = ""] = texts;
  const isLight = theme === "light";

  return (
    <svg
      ref={ref}
      className={`circles ${isLight ? "circles--light" : "circles--dark"} ${className}`}
      width="100%"
      height="100%"
      viewBox="0 0 1400 1400"
    >
      <defs>
        <path
          id={`${idPrefix}-1`}
          d="M250,700.5A450.5,450.5 0 1 11151,700.5A450.5,450.5 0 1 1250,700.5"
        />
        <path
          id={`${idPrefix}-2`}
          d="M382,700.5A318.5,318.5 0 1 11019,700.5A318.5,318.5 0 1 1382,700.5"
        />
        <path
          id={`${idPrefix}-3`}
          d="M487,700.5A213.5,213.5 0 1 1914,700.5A213.5,213.5 0 1 1487,700.5"
        />
        <path
          id={`${idPrefix}-4`}
          d="M567.5,700.5A133,133 0 1 1833.5,700.5A133,133 0 1 1567.5,700.5"
        />
      </defs>

      <g className="circles-group">
        <text className="circles-text circles-text-1">
          <textPath
            className="circles-text-path"
            href={`#${idPrefix}-1`}
            xlinkHref={`#${idPrefix}-1`}
            textLength="2820"
          >
            {txt1}
          </textPath>
        </text>

        <text className="circles-text circles-text-2">
          <textPath
            className="circles-text-path"
            href={`#${idPrefix}-2`}
            xlinkHref={`#${idPrefix}-2`}
            textLength="1985"
          >
            {txt2}
          </textPath>
        </text>

        <text className="circles-text circles-text-3">
          <textPath
            className="circles-text-path"
            href={`#${idPrefix}-3`}
            xlinkHref={`#${idPrefix}-3`}
            textLength="1310"
          >
            {txt3}
          </textPath>
        </text>

        {txt4 && (
          <text className="circles-text circles-text-4">
            <textPath
              className="circles-text-path"
              href={`#${idPrefix}-4`}
              xlinkHref={`#${idPrefix}-4`}
              textLength="810"
            >
              {txt4}
            </textPath>
          </text>
        )}
      </g>
    </svg>
  );
});

export default CircleText;
