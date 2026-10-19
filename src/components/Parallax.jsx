"use client";

import { useRef } from "react";
import useParallax from "@/hooks/useParallax";

/**
 * Composant de parallaxe déclaratif.
 *
 * @example Reveal depuis un masque puis sortie
 * <Parallax as="span" mask trigger={sectionRef}
 *   from={115} to={0} start="top 75%" end="top 15%" ease="power1.out"
 *   exit={-30} exitEnd="top -85%">Titre</Parallax>
 *
 * @example Vitesse (style data-scroll-speed)
 * <Parallax speed={2}>…</Parallax>
 */
export default function Parallax({
  as: Tag = "div",
  mask = false,
  maskClassName = "",
  className = "",
  children,
  // options de parallaxe
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
