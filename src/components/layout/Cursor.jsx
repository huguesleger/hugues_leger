"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { usePathname } from "next/navigation";
import { getMousePos } from "@/lib/getMousePos";
import { cursorStore } from "@/lib/cursorStore";

const DESKTOP_MIN_WIDTH = 1100;
const FALLBACK_HOVER_SELECTOR =
  "a, button, .btn-main, [data-cursor], [data-cursor-label], [data-cursor-big], [data-cursor-dark]";

function applyStateToElements(state, cursorEl, wrapperEl, labelEl) {
  if (!cursorEl) return;

  const { isHover, label, big, dark, drag } = state;

  if (isHover) {
    wrapperEl?.classList.add("is-hover");
  } else {
    wrapperEl?.classList.remove("is-hover");
  }

  cursorEl.classList.toggle("has-label", Boolean(label));
  cursorEl.classList.toggle("has-big", Boolean(big));
  cursorEl.classList.toggle("has-dark", Boolean(dark));
  cursorEl.classList.toggle("has-drag", Boolean(drag));

  if (labelEl) {
    labelEl.textContent = label || "";
  }
}

function resetCursorDOM(cursorEl, wrapperEl, labelEl) {
  wrapperEl?.classList.remove("is-hover");
  if (!cursorEl) return;
  cursorEl.classList.remove("has-label", "has-big", "has-dark", "has-drag");
  if (labelEl) labelEl.textContent = "";
}

export default function Cursor() {
  const cursorRef = useRef(null);
  const cursorWrapperRef = useRef(null);
  const labelRef = useRef(null);
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

    cursorStore.reset();
    resetCursorDOM(cursor, wrapper, label);

    if (window.innerWidth < DESKTOP_MIN_WIDTH || !cursor) {
      document.documentElement.classList.remove("has-custom-cursor");
      return undefined;
    }

    document.documentElement.classList.add("has-custom-cursor");

    // 1. Souscription réactive au cursorStore (CursorTarget, useCursorTarget, WebGL)
    const unsubscribe = cursorStore.subscribe((state) => {
      applyStateToElements(state, cursor, wrapper, label);
    });

    // 2. Déplacement du curseur + détection automatique des liens/boutons standards
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

      // Si le store est actuellement piloté par un CursorTarget / WebGL, il a la priorité
      const storeState = cursorStore.getState();
      if (storeState.isHover) {
        return;
      }

      // Fallback automatique pour les éléments HTML natifs (liens <a>, boutons simples, rétrocompat data-*)
      const hoverTarget = target.closest(FALLBACK_HOVER_SELECTOR);
      if (hoverTarget) {
        const legacyLabel = hoverTarget.getAttribute("data-cursor-label") || "";
        const legacyBig = hoverTarget.hasAttribute("data-cursor-big");
        const legacyDark = hoverTarget.hasAttribute("data-cursor-dark");

        applyStateToElements(
          {
            isHover: true,
            label: legacyLabel,
            big: legacyBig,
            dark: legacyDark,
            drag: false,
          },
          cursor,
          wrapper,
          label,
        );
      } else {
        resetCursorDOM(cursor, wrapper, label);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      unsubscribe();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.classList.remove("has-custom-cursor");
      cursorStore.reset();
      resetCursorDOM(cursor, wrapper, label);
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
