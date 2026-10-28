"use client";

import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import SplittingWrapperWord from "@/components/splitting/SplittingWrapperWord";
import useRevealOnView from "@/hooks/useRevealOnView";

const pad = (n) => String(n).padStart(2, "0");

/**
 * Première section (reprise de l'ancien portfolio) : bloc couleur plein
 * écran, nom du projet en très grand, infos en pied de section.
 */
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
      className={`rea-intro rea-intro--${project.tone}`}
      style={{ "--rea-color": project.color }}
    >
      <div className="rea-intro__top">
        {children}
      </div>

      <div
        ref={headingRef}
        className={`rea-intro__heading${headingVisible ? " is-visible" : ""}`}
      >
        <p className="rea-intro__category">
          <SplittingWrapperWord>{project.category}</SplittingWrapperWord>
        </p>
        <h1 className="rea-intro__title">
          <SplittingWrapperWord>{project.title}</SplittingWrapperWord>
        </h1>
      </div>

      <div
        ref={infosRef}
        className={`rea-infos${hasSite ? " rea-infos--site" : ""}${infosVisible ? " is-visible" : ""}`}
      >
        <div className="rea-infos__year">
          <span className="rea-infos__label">Année</span>
          <span className="rea-infos__year-value">
            <SplittingWrapperWord>{project.annee}</SplittingWrapperWord>
          </span>
        </div>

        <div className="rea-infos__intervention">
          <span className="rea-infos__label">Intervention</span>
          <ol className="rea-infos__list">
            {project.intervention.map((item, i) => (
              <li
                key={item}
                className="rea-infos__item"
                style={{ "--i": i }}
              >
                <span className="rea-infos__item-inner">
                  <span className="rea-infos__item-num">{pad(i + 1)}</span>
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
            className="rea-infos__site"
          >
            <span className="rea-infos__site-text">Voir le site</span>
            <span className="rea-infos__site-arrow" aria-hidden="true">
              <ArrowUpRight size={15} />
            </span>
          </a>
        )}
      </div>
    </section>
  );
}
