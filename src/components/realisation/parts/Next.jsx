"use client";

import { useRef } from "react";
import TransitionLink from "@/components/transition/TransitionLink";
import CursorTarget from "@/components/CursorTarget";
import RoundedTransition from "@/components/RoundedTransition";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import useRevealOnView from "@/hooks/useRevealOnView";
import GlImage from "../GlImage";

/** Projet suivant : grand titre en surimpression d'une image WebGL. */
export default function Next({ next }) {
  const sectionRef = useRef(null);
  const visible = useRevealOnView(sectionRef, { threshold: 0.4 });

  return (
    <>
      <RoundedTransition trigger={sectionRef} />
      <section
        ref={sectionRef}
        className={`rea-next${visible ? " is-visible" : ""}`}
      >
        <CursorTarget
          as={TransitionLink}
          href={`/works/${next.slug}`}
          className="rea-next__link"
          label="Voir"
          big
        >
          <span className="rea-next__label">Projet suivant</span>
          <GlImage src={next.image} alt="" className="rea-next__media" />
          <span className="rea-next__title">
            <SplittingWrapperWord>{next.title}</SplittingWrapperWord>
          </span>
          <span className="rea-next__category">{next.category}</span>
        </CursorTarget>
      </section>
    </>
  );
}
