"use client";

import React, { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import InfiniteKeywords from "@/components/ui/InfiniteKeywords";

const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;
const lerp = (a, b, n) => (1 - n) * a + n * b;
const clamp = (num, min, max) => (num <= min ? min : num >= max ? max : num);
const getMousePos = (ev) => ({
  x: ev.clientX,
  y: ev.clientY,
});

const TOOLKIT_ITEMS = [
  {
    id: "next-react",
    titre: "Next js & React",
    tag: "#Architecture #SSR #AppRouter",
    annee: "Daily Driver",
    image: "/assets/1.webp",
  },
  {
    id: "three-r3f",
    titre: "Three.js / React three fiber",
    tag: "#WebGL #3D #ShadersGLSL",
    annee: "Creative Lab",
    image: "/assets/2.webp",
  },
  {
    id: "gsap",
    titre: "GSAP",
    tag: "#Motion #MicroInteractions #Smooth",
    annee: "60 FPS",
    image: "/assets/3.webp",
  },
  {
    id: "scss-sass",
    titre: "Scss / Sass",
    tag: "#DesignSystem #Responsive #Modular",
    annee: "Craft",
    image: "/assets/4.webp",
  },
  {
    id: "wordpress",
    titre: "Wordpress / DatoCMS",
    tag: "#Headless #CustomTheme #PHP",
    annee: "CMS",
    image: "/assets/5.webp",
  },
  {
    id: "design-suite",
    titre: "Figma / Photoshop / Illustrator",
    tag: "#ArtDirection #UI/UX #Vector",
    annee: "Design",
    image: "/assets/6.webp",
  },
];

function ToolkitItem({ titre, tag, annee, image }) {
  const refHover = useRef(null);
  const refListItem = useRef(null);
  const refInner = useRef(null);

  const mouseposRef = useRef({ x: 0, y: 0 });
  const mousePosCacheRef = useRef({ x: 0, y: 0 });
  const animatablePropsRef = useRef({
    rotation: { previous: 0, current: 0, amt: 0.04 },
  });

  const mouseMove = (ev) => {
    if (typeof window === "undefined" || window.innerWidth < 1100) return;

    const itemEl = refListItem.current;
    const hoverEl = refHover.current;
    if (!itemEl || !hoverEl) return;

    const boundsItem = itemEl.getBoundingClientRect();
    const boundsReveal = hoverEl.getBoundingClientRect();

    const mousepos = getMousePos(ev);
    mouseposRef.current = mousepos;

    const mouseDistanceX = clamp(
      Math.abs(mousePosCacheRef.current.x - mousepos.x),
      0,
      100
    );

    const directionX = mousePosCacheRef.current.x - mousepos.x;
    mousePosCacheRef.current = { x: mousepos.x, y: mousepos.y };

    const animProps = animatablePropsRef.current;

    animProps.rotation.current = map(
      mouseDistanceX,
      0,
      20,
      0,
      directionX < 0 ? 60 : -60
    );

    animProps.rotation.previous = lerp(
      animProps.rotation.previous,
      animProps.rotation.current,
      animProps.rotation.amt
    );

    const targetX = Math.abs(mousepos.x - boundsItem.left) - boundsReveal.width / 2;
    const targetY = Math.abs(mousepos.y - boundsItem.top) - boundsReveal.height / 2;

    const tl = gsap.timeline({
      onStart: () => {
        gsap.set(hoverEl, {
          opacity: 1,
        });
      },
    });

    gsap.set(hoverEl, {
      x: targetX,
      y: targetY,
    });

    tl.to(hoverEl, {
      duration: 0.2,
      x: targetX,
      y: targetY,
      rotation: animProps.rotation.previous,
    });
  };

  const mouseEnter = (ev) => {
    if (typeof window === "undefined" || window.innerWidth < 1100) return;

    const hoverEl = refHover.current;
    const innerEl = refInner.current;
    const itemEl = refListItem.current;
    if (!hoverEl || !innerEl || !itemEl) return;

    const mousepos = getMousePos(ev);
    mouseposRef.current = mousepos;
    mousePosCacheRef.current = { x: mousepos.x, y: mousepos.y };

    const boundsItem = itemEl.getBoundingClientRect();
    const boundsReveal = hoverEl.getBoundingClientRect();

    const targetX = Math.abs(mousepos.x - boundsItem.left) - boundsReveal.width / 2;
    const targetY = Math.abs(mousepos.y - boundsItem.top) - boundsReveal.height / 2;

    gsap.set(hoverEl, {
      x: targetX,
      y: targetY,
      rotation: 0,
      opacity: 0,
    });

    const tl = gsap.timeline();
    tl.fromTo(
      innerEl,
      {
        scale: 0.3,
      },
      {
        duration: 1.2,
        ease: "power2.out",
        scale: 1,
      }
    );
  };

  const mouseLeave = () => {
    if (typeof window === "undefined" || window.innerWidth < 1100) return;

    const hoverEl = refHover.current;
    if (!hoverEl) return;

    const tl = gsap.timeline();
    tl.to(hoverEl, {
      duration: 0.3,
      opacity: 0,
    });
  };

  return (
    <div
      className="page-about__toolkit-item"
      ref={refListItem}
      onMouseMove={mouseMove}
      onMouseEnter={mouseEnter}
      onMouseLeave={mouseLeave}
    >
      <div className="page-about__toolkit-title-block">
        <h3 className="page-about__toolkit-item-title">{titre}</h3>
        <p className="page-about__toolkit-item-tag">{tag}</p>
      </div>

      <div className="page-about__toolkit-meta-block">
        <p className="page-about__toolkit-item-meta">{annee}</p>
      </div>

      <div className="page-about__toolkit-reveal" ref={refHover}>
        <div className="page-about__toolkit-reveal-inner" ref={refInner}>
          <Image
            src={image}
            alt={titre}
            className="page-about__toolkit-reveal-img"
            fill
            sizes="170px"
          />
        </div>
      </div>
    </div>
  );
}

export default function AboutToolkit() {
  return (
    <section className="page-about__section page-about__toolkit" id="toolkit">
      <InfiniteKeywords />
      <div className="page-about__inner">

        <div className="page-about__toolkit-list">
          {TOOLKIT_ITEMS.map((item) => (
            <div className="page-about__toolkit-row" key={item.id}>
              <ToolkitItem
                titre={item.titre}
                tag={item.tag}
                annee={item.annee}
                image={item.image}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
