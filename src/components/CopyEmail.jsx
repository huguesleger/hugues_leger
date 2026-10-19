"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_EMAIL = "contactme@huguesleger.fr";

const CopyEmail = forwardRef(function CopyEmail(
  {
    email = DEFAULT_EMAIL,
    className = "",
    style,
    labelCopy = "copy to clipboard",
    labelCopied = "copied",
    cursorLabel = "Copy",
    cursorColor = "",
    onCopy,
    ...props
  },
  ref,
) {
  const [copied, setCopied] = useState(false);
  const copyResetTimerRef = useRef(null);

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
      data-cursor-label={cursorLabel}
      data-cursor-dark={cursorColor}
      onClick={handleCopy}
      style={style}
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
