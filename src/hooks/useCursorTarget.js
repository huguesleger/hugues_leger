"use client";

import { useCallback, useEffect, useRef } from "react";
import { cursorStore } from "@/lib/cursorStore";

/**
 * Hook pour attacher un comportement de curseur personnalisé à un élément React existant via props.
 *
 * @param {Object} options
 * @param {string} [options.label] - Texte affiché au centre du curseur (ex: "Copy", "View")
 * @param {boolean} [options.big] - Curseur agrandi (has-big)
 * @param {boolean} [options.dark] - Curseur sombre avec texte blanc (has-dark)
 * @param {boolean} [options.drag] - Mode drag avec flèches (has-drag)
 * @param {boolean} [options.disabled] - Désactive temporairement le curseur personnalisé
 * @param {Function} [options.onPointerEnter] - Handler existant à composer
 * @param {Function} [options.onPointerLeave] - Handler existant à composer
 * @returns {Object} Props d'événements à étaler sur l'élément ({ onPointerEnter, onPointerLeave })
 */
export default function useCursorTarget({
  label = "",
  big = false,
  dark = false,
  drag = false,
  disabled = false,
  onPointerEnter,
  onPointerLeave,
  onMouseEnter,
  onMouseLeave,
} = {}) {
  const optionsRef = useRef({
    label,
    big,
    dark,
    drag,
    disabled,
    onPointerEnter: onPointerEnter ?? onMouseEnter,
    onPointerLeave: onPointerLeave ?? onMouseLeave,
  });

  optionsRef.current = {
    label,
    big,
    dark,
    drag,
    disabled,
    onPointerEnter: onPointerEnter ?? onMouseEnter,
    onPointerLeave: onPointerLeave ?? onMouseLeave,
  };

  const isHoveredRef = useRef(false);

  // Si les props changent pendant que l'élément est actuellement survolé (ex: label "Copy" -> "Copied!")
  useEffect(() => {
    if (isHoveredRef.current && !disabled) {
      cursorStore.set({ label, big, dark, drag, isHover: true });
    }
  }, [label, big, dark, drag, disabled]);

  const handlePointerEnter = useCallback((e) => {
    const opts = optionsRef.current;
    if (!opts.disabled) {
      isHoveredRef.current = true;
      cursorStore.set({
        label: opts.label,
        big: opts.big,
        dark: opts.dark,
        drag: opts.drag,
        isHover: true,
      });
    }
    opts.onPointerEnter?.(e);
  }, []);

  const handlePointerLeave = useCallback((e) => {
    const opts = optionsRef.current;
    if (isHoveredRef.current) {
      isHoveredRef.current = false;
      cursorStore.reset();
    }
    opts.onPointerLeave?.(e);
  }, []);

  // Nettoyage au démontage pour éviter qu'un curseur reste bloqué en hover lors d'un changement de route
  useEffect(() => {
    return () => {
      if (isHoveredRef.current) {
        cursorStore.reset();
      }
    };
  }, []);

  return {
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
  };
}
