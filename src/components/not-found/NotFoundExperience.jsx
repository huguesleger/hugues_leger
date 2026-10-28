"use client";

import TransitionLink from "@/components/transition/TransitionLink";
import NotFoundCanvas from "./NotFoundCanvas";

export default function NotFoundExperience() {
  return (
    <div className="not-found">
      <p className="not-found__code" aria-hidden="true">
        404
      </p>

      <div className="not-found__canvas" data-lenis-prevent>
        <NotFoundCanvas />
      </div>

      <div className="not-found__content">
        <h1 className="not-found__title">Perdu dans l&apos;espace</h1>
        <p className="not-found__text">
          Houston, on a un problème : cette page a dérivé hors de l&apos;orbite.
          Fais tourner la scène, clique sur l&apos;astronaute… ou rentre à la base.
        </p>
        <TransitionLink href="/" className="not-found__link">
          &larr; retour à la base
        </TransitionLink>
      </div>
    </div>
  );
}
