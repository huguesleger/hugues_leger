const SAFETY_TIMEOUT_MS = 8000;
export const INTRO_ENTERED_KEY = "isEntered";

let resolveGate = () => {};
let opened = false;
let gate = null;

function createGate() {
  gate = new Promise((resolve) => {
    resolveGate = () => {
      if (opened) return;
      opened = true;
      resolve();
    };
  });

  if (typeof window === "undefined") return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  let entered = false;
  try {
    entered = sessionStorage.getItem(INTRO_ENTERED_KEY) != null;
  } catch {}

  if (reducedMotion || entered) {
    resolveGate();
  } else {
    window.setTimeout(resolveGate, SAFETY_TIMEOUT_MS);
  }
}

/** Résolue quand le loader commence à s'ouvrir (ou tout de suite s'il est sauté). */
export function getIntroGate() {
  if (!gate) createGate();
  return gate;
}

export function openIntroGate() {
  if (!gate) createGate();
  resolveGate();
}

export function isIntroGateOpen() {
  if (!gate) createGate();
  return opened;
}

export function shouldPlayIntroLoader() {
  if (typeof window === "undefined") return false;
  return !isIntroGateOpen();
}
