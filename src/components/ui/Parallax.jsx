"use client";

import { useRef } from "react";
import useParallax from "@/hooks/useParallax";

export default function Parallax({
  as: Tag = "div",
  mask = false,
  maskClassName = "",
  className = "",
  children,
  trigger,
  axis,
  unit,
  speed,
  from,
  to,
  start,
  end,
  ease,
  exit,
  exitEnd,
  ...rest
}) {
  const ref = useRef(null);

  useParallax(ref, { trigger, axis, unit, speed, from, to, start, end, ease, exit, exitEnd });

  const content = (
    <Tag ref={ref} className={["parallax", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </Tag>
  );

  if (!mask) return content;

  const MaskTag = Tag === "span" ? "span" : "div";
  return (
    <MaskTag className={["parallax-mask", maskClassName].filter(Boolean).join(" ")}>
      {content}
    </MaskTag>
  );
}
