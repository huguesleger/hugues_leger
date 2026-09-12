"use client";

import { triggerReverseTransition } from "./TransitionOverlay";

export default function BackButton({ id, src }) {
  return (
    <button 
      onClick={() => {
        sessionStorage.setItem('returnTransitionFrom', id);
        triggerReverseTransition(src);
      }} 
      className="content__back" 
      style={{ display: "inline-block", padding: "1rem 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
    >
      &larr; retour à la galerie
    </button>
  );
}

