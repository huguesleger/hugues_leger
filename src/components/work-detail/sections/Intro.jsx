"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import SplittingWrapperWord from "@/components/ui/splitting/SplittingWrapperWord";
import useRevealOnView from "@/hooks/useRevealOnView";

const pad = (n) => String(n).padStart(2, "0");

export default function Intro({ project, children }) {
  const headingRef = useRef(null);
  const infosRef = useRef(null);
  // Le titre et les infos se révèlent chacun à leur entrée dans le viewport :
  // en arrivant sur la page, l'image d'aperçu les garde sous le pli.
  const headingVisible = useRevealOnView(headingRef, { threshold: 0.5 });
  const infosVisible = useRevealOnView(infosRef, { threshold: 0.5 });
  const hasSite = Boolean(project.siteWeb);
  const siteHref = project.siteWeb?.startsWith("http")
    ? project.siteWeb
    : `https://${project.siteWeb}`;

  return (
    <section
      className={`work-intro work-intro--${project.tone}`}
      style={{ "--work-color": project.color }}
    >
      <div className="work-intro__top">
        {children}
      </div>

      <div
        ref={headingRef}
        className={`work-intro__heading${headingVisible ? " is-visible" : ""}`}
      >
        <p className="work-intro__category">
          <SplittingWrapperWord>{project.category}</SplittingWrapperWord>
        </p>
        <h1 className="work-intro__title">
          <SplittingWrapperWord>{project.title}</SplittingWrapperWord>
        </h1>
      </div>

      <div
        ref={infosRef}
        className={`work-infos${hasSite ? " work-infos--site" : ""}${infosVisible ? " is-visible" : ""}`}
      >
        <div className="work-infos__year">
          <span className="work-infos__label">Année</span>
          <span className="work-infos__year-value">
            <SplittingWrapperWord>{project.annee}</SplittingWrapperWord>
          </span>
        </div>

        <div className="work-infos__intervention">
          <span className="work-infos__label">Intervention</span>
          <ol className="work-infos__list">
            {project.intervention.map((item, i) => (
              <li
                key={item}
                className="work-infos__item"
                style={{ "--i": i }}
              >
                <span className="work-infos__item-inner">
                  <span className="work-infos__item-num">{pad(i + 1)}</span>
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {hasSite && (
          <a
            href={siteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="work-infos__site"
          >
            <span className="work-infos__site-text">Voir le site</span>
            <span className="work-infos__site-arrow" aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
