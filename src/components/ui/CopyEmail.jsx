"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import useCursorTarget from "@/hooks/useCursorTarget";

const CopyEmail = forwardRef(function CopyEmail(
  {
    email,
    className = "",
    style,
    labelCopy = "copy to clipboard",
    labelCopied = "copied",
    cursorLabel = "Copy",
    cursorColor,
    onCopy,
    onPointerEnter,
    onPointerLeave,
    ...props
  },
  ref,
) {
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef(null);

  const activeCursorLabel = copied ? labelCopied : cursorLabel;
  const cursorHandlers = useCursorTarget({
    label: activeCursorLabel,
    dark: Boolean(cursorColor),
    onPointerEnter,
    onPointerLeave,
  });

  const handleCopy = useCallback(
    async (e) => {
      try {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        onCopy?.(e);
        if (copyResetTimerRef.current) {
          window.clearTimeout(copyResetTimerRef.current);
        }
        copyResetTimerRef.current = window.setTimeout(() => {
          setCopied(false);
          copyResetTimerRef.current = null;
        }, 2500);
      } catch {
        setCopied(false);
      }
    },
    [email, onCopy],
  );

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        window.clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  const buttonClasses = ["wrap-copy", copied ? "copied" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      ref={ref}
      type="button"
      className={buttonClasses}
      onClick={handleCopy}
      style={style}
      {...cursorHandlers}
      {...props}
    >
      <div className="inner-label">
        <span className="copy-label">{labelCopy}</span>
        <span className="copied-label">{labelCopied}</span>
      </div>
      <span className="copy-email">{email}</span>
    </button>
  );
});

export default CopyEmail;
