"use client";

import Link from "next/link";
import { transitionTo } from "./PageTransition";

function isModifiedEvent(event) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function isInternalHref(href) {
  if (!href || href.startsWith("#")) return false;
  if (href.startsWith("mailto:") || href.startsWith("tel:")) return false;
  try {
    const url = new URL(href, window.location.origin);
    return url.origin === window.location.origin;
  } catch {
    return href.startsWith("/");
  }
}

export default function TransitionLink({
  href,
  onClick,
  target,
  children,
  ...rest
}) {
  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    if (isModifiedEvent(event)) return;
    if (target === "_blank") return;
    if (!isInternalHref(href)) return;

    event.preventDefault();
    transitionTo(href);
  };

  return (
    <Link href={href} onClick={handleClick} target={target} {...rest}>
      {children}
    </Link>
  );
}
