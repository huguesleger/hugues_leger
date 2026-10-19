"use client";

import { forwardRef } from "react";
import useCursorTarget from "@/hooks/useCursorTarget";

/**
 * Composant déclaratif pour définir les interactions du curseur personnalisé via props.
 *
 * @example
 * <CursorTarget as="button" label="Copy" dark onClick={handleCopy}>
 *   Mon Bouton
 * </CursorTarget>
 *
 * @example
 * <CursorTarget as="div" label="View" big className="card">
 *   <Image ... />
 * </CursorTarget>
 */
const CursorTarget = forwardRef(function CursorTarget(
  {
    as: Tag = "div",
    label = "",
    big = false,
    dark = false,
    drag = false,
    disabled = false,
    children,
    className = "",
    onPointerEnter,
    onPointerLeave,
    ...rest
  },
  ref,
) {
  const cursorProps = useCursorTarget({
    label,
    big,
    dark,
    drag,
    disabled,
    onPointerEnter,
    onPointerLeave,
  });

  return (
    <Tag ref={ref} className={className || undefined} {...cursorProps} {...rest}>
      {children}
    </Tag>
  );
});

export default CursorTarget;
