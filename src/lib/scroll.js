/**
 * Le site ne scrolle plus `window` mais un conteneur fixe (`[data-scroll-wrapper]`).
 * Le document ne défile jamais : la barre d'URL des navigateurs mobiles reste
 * visible et la hauteur du viewport ne change plus pendant le scroll.
 */

export function getScrollWrapper() {
  if (typeof document === "undefined") return null;
  return document.querySelector("[data-scroll-wrapper]");
}

export function getScrollContent() {
  if (typeof document === "undefined") return null;
  return document.querySelector("[data-scroll-content]");
}

export function getScrollY() {
  const lenis = window.lenisInstance;
  if (lenis && typeof lenis.scroll === "number") return lenis.scroll;
  return getScrollWrapper()?.scrollTop ?? 0;
}

/** Positionne le scroll immédiatement (Lenis + conteneur natif). */
export function setScrollY(y) {
  const wrapper = getScrollWrapper();
  if (wrapper) wrapper.scrollTop = y;
  window.lenisInstance?.scrollTo(y, { immediate: true, force: true });
}
