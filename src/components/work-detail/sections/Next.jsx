"use client";

import { useRef } from "react";
import TransitionLink from "@/components/transition/TransitionLink";
import CursorTarget from "@/components/ui/CursorTarget";
import RoundedTransition from "@/components/ui/RoundedTransition";
import SplittingWrapperWord from "@/components/ui/splitting/SplittingWrapperWord";
import useRevealOnView from "@/hooks/useRevealOnView";
import GlImage from "@/components/work-detail/GlImage";

export default function Next({ next }) {
  const sectionRef = useRef(null);
  const visible = useRevealOnView(sectionRef, { threshold: 0.4 });

  return (
    <>
      <RoundedTransition trigger={sectionRef} />
      <section
        ref={sectionRef}
        className={`work-next${visible ? " is-visible" : ""}`}
      >
        <CursorTarget
          as={TransitionLink}
          href={`/works/${next.slug}`}
          className="work-next__link"
          label="Voir"
          big
        >
          <span className="work-next__label">Projet suivant</span>
          <GlImage src={next.image} alt="" className="work-next__media" />
          <span className="work-next__title">
            <SplittingWrapperWord>{next.title}</SplittingWrapperWord>
          </span>
          <span className="work-next__category">{next.category}</span>
        </CursorTarget>
      </section>
    </>
  );
}
