"use client";

import { triggerReverseTransition } from "./TransitionOverlay";

export default function BackButton({ id, src }) {
  return (
    <button 
      onClick={() => {
        sessionStorage.setItem('returnTransitionFrom', id);
        triggerReverseTransition(src);
      }} 
      className="content__back back-button" 
    >
      &larr; retour à la galerie
    </button>
  );
}

