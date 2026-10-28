"use client";

import { forwardRef } from "react";
import useCursorTarget from "@/hooks/useCursorTarget";

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
