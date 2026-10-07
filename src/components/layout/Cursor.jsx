"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { getMousePos } from "@/lib/getMousePos";
import { isCursorCanvasHover, setCursorCanvasHover } from "@/lib/cursorDom";

const DESKTOP_MIN_WIDTH = 1100;
const CURSOR_HOVER_SELECTOR =
  "a, button, .btn-main, [data-cursor], [data-cursor-label], [data-cursor-big], [data-cursor-dark]";

function resetCursorState(cursorEl, wrapperEl, labelEl) {
  setCursorCanvasHover(false);
  wrapperEl?.classList.remove("is-hover");
  if (!cursorEl) return;
  cursorEl.classList.remove("has-label", "has-big", "has-dark");
  if (labelEl) labelEl.textContent = "";
}

export default function Cursor() {
  const cursorRef = useRef(null);
  const cursorWrapperRef = useRef(null);
  const labelRef = useRef(null);
  const mouseIsHoverRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const pathname = usePathname();

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = mq.matches;
    const onMotionChange = (e) => {
      reducedMotionRef.current = e.matches;
    };
    mq.addEventListener("change", onMotionChange);
    return () => mq.removeEventListener("change", onMotionChange);
  }, []);

  useEffect(() => {
    const cursor = cursorRef.current;
    const wrapper = cursorWrapperRef.current;
    const label = labelRef.current;

    resetCursorState(cursor, wrapper, label);

    if (window.innerWidth < DESKTOP_MIN_WIDTH || !cursor) {
      document.documentElement.classList.remove("has-custom-cursor");
      return undefined;
    }

    document.documentElement.classList.add("has-custom-cursor");

    const onPointerMove = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;

      const { x, y } = getMousePos(e);

      if (reducedMotionRef.current) {
        gsap.set(cursor, { x, y, opacity: 1 });
      } else {
        gsap.to(cursor, {
          duration: 0.12,
          x,
          y,
          opacity: 1,
          overwrite: true,
          ease: "power2.out",
        });
      }

      const hoverTarget = target.closest(CURSOR_HOVER_SELECTOR);
      if (hoverTarget) {
        mouseIsHoverRef.current = true;
        cursor.classList.remove("has-label", "has-big", "has-dark");

        const labelText = hoverTarget.getAttribute("data-cursor-label");
        if (labelText) {
          cursor.classList.add("has-label");
          if (label) label.textContent = labelText;
        } else if (label) {
          label.textContent = "";
        }

        if (hoverTarget.hasAttribute("data-cursor-big")) {
          cursor.classList.add("has-big");
        }
        if (hoverTarget.hasAttribute("data-cursor-dark")) {
          cursor.classList.add("has-dark");
        }
      } else if (isCursorCanvasHover()) {
        mouseIsHoverRef.current = true;
      } else {
        mouseIsHoverRef.current = false;
        cursor.classList.remove("has-label", "has-big", "has-dark");
        if (label) label.textContent = "";
      }

      if (mouseIsHoverRef.current) {
        wrapper?.classList.add("is-hover");
      } else {
        wrapper?.classList.remove("is-hover");
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.classList.remove("has-custom-cursor");
      resetCursorState(cursor, wrapper, label);
    };
  }, [pathname]);

  return (
    <div className="cursor" ref={cursorRef}>
      <div className="cursor-wrapper" ref={cursorWrapperRef}>
        <div className="cursor-circle" id="cursor-circle">
          <div className="cursor-label" ref={labelRef} />
          <div className="cursor-drag">
            <div className="arrow-left" />
            <div className="arrow-right" />
          </div>
        </div>
      </div>
    </div>
  );
}
