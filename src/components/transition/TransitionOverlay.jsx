"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useRouter } from "next/navigation";

// Une page qui n'arrive jamais ne doit pas laisser l'image figée à l'écran.
const SAFETY_TIMEOUT_MS = 6000;
// Une image trop lente ne doit pas bloquer la fin de la transition.
const IMAGE_TIMEOUT_MS = 1500;
const FADE_DURATION = 0.25;

let api = null;

/** Clic sur une carte : charge et décode la couverture, encore invisible. */
export const prepareProjectTransition = (src) => api?.prepare(src);

/**
 * Fin de l'agrandissement WebGL : l'image recouvre exactement la carte
 * agrandie. On ne change de page qu'une fois cette relève affichée.
 */
export const coverWithProjectImage = () => api?.cover() ?? Promise.resolve();

/** Page projet montée : rend la main à son image d'en-tête quand elle est prête. */
export const finishProjectTransition = (target) => api?.finish(target);

/** « Retour à la galerie » : l'image recouvre l'en-tête puis on quitte la page. */
export const triggerReverseTransition = (src) => api?.reverse(src);

/** Le canvas d'origine affiche la carte agrandie : l'image peut s'effacer. */
export const releaseProjectTransition = () => api?.release();

export const isProjectTransitionActive = () => api?.isActive() ?? false;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, ms)),
  ]);
}

/** Attend que l'image soit chargée et décodée, pour l'afficher sans trou. */
function decodeImage(img) {
  if (!img?.getAttribute("src")) return Promise.resolve();
  return withTimeout(img.decode().catch(() => {}), IMAGE_TIMEOUT_MS);
}

function nextFrames(count) {
  return new Promise((resolve) => {
    const step = () => (count-- <= 0 ? resolve() : requestAnimationFrame(step));
    requestAnimationFrame(step);
  });
}

export default function TransitionOverlay() {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return;

    // Chaque transition a son numéro : une étape asynchrone d'une transition
    // terminée ou remplacée ne doit plus rien toucher.
    let run = 0;
    let active = false;
    let decoded = Promise.resolve();
    let safetyTimer = 0;

    const reset = () => {
      active = false;
      window.clearTimeout(safetyTimer);
      gsap.killTweensOf(container);
      gsap.set(container, {
        clearProps: "top,left,width,height,opacity,visibility",
      });
    };

    const fadeOut = (id) => {
      if (id !== run || !active) return;
      window.clearTimeout(safetyTimer);
      gsap.to(container, {
        autoAlpha: 0,
        duration: FADE_DURATION,
        ease: "power1.out",
        onComplete: () => {
          if (id === run) reset();
        },
      });
    };

    const show = (id) => {
      active = true;
      gsap.set(container, { autoAlpha: 1 });
      window.clearTimeout(safetyTimer);
      safetyTimer = window.setTimeout(() => fadeOut(id), SAFETY_TIMEOUT_MS);
    };

    const load = (src) => {
      if (src && img.getAttribute("src") !== src) img.src = src;
      decoded = decodeImage(img);
      return decoded;
    };

    api = {
      isActive: () => active,

      prepare: (src) => {
        run += 1;
        reset();
        load(src);
      },

      cover: async () => {
        const id = run;
        await decoded;
        if (id !== run) return;
        show(id);
        // Laisse l'image se peindre avant que le canvas ne soit démonté.
        await nextFrames(1);
      },

      finish: async (target) => {
        if (!active || !target) return;
        const id = run;

        await decodeImage(target.querySelector("img"));
        if (id !== run) return;

        // Si l'en-tête ne tombe pas pile sous l'image (barre de défilement
        // classique, viewport plus bas que l'en-tête…), on la recale en douceur
        // au lieu de la laisser sauter au moment du fondu.
        const rect = target.getBoundingClientRect();
        const current = container.getBoundingClientRect();
        const offset = Math.max(
          Math.abs(rect.top - current.top),
          Math.abs(rect.left - current.left),
          Math.abs(rect.width - current.width),
          Math.abs(rect.height - current.height),
        );
        if (offset > 0.5) {
          await gsap.to(container, {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            duration: 0.35,
            ease: "power2.out",
          });
          if (id !== run) return;
        }

        // Deux images peintes : l'en-tête décodé est bien à l'écran sous la relève.
        await nextFrames(2);
        fadeOut(id);
      },

      reverse: async (src) => {
        run += 1;
        const id = run;
        reset();

        const hero = document.querySelector(".work-preview");
        const rect = hero?.getBoundingClientRect();
        if (rect) {
          gsap.set(container, {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });
        }

        await load(src);
        if (id !== run) return;
        show(id);
        await nextFrames(1);
        if (id !== run) return;

        const origin = sessionStorage.getItem("transitionOrigin") || "/";
        router.push(origin, { scroll: false });
      },

      release: () => fadeOut(run),
    };

    return () => {
      api = null;
      reset();
    };
  }, [router]);

  return (
    <div
      ref={containerRef}
      className="transition-overlay__container"
      aria-hidden="true"
    >
      {/* Même URL que la texture du canvas : l'image sort du cache. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} alt="" className="transition-overlay__img" />
    </div>
  );
}
