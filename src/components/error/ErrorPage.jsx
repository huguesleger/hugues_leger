"use client";

import WordSwitcher from "@/components/ui/WordSwitcher";
import InfiniteKeywords from "@/components/about/InfiniteKeywords";
import Footer from "@/components/layout/Footer";
import TransitionLink from "@/components/transition/TransitionLink";

const WORDS = ["Oups !", "C'est la mouise !", "Mince !", "F*** !"];

const KEYWORDS = [
  { id: "1", title: "500", icon: "Circle", bold: true },
  { id: "2", title: "Le serveur ne répond pas", icon: "Circle" },
];

export default function ErrorPage({ onReload, LinkComponent = TransitionLink }) {
  return (
    <main className="page-error">
      <div className="page-error__content">
        <div className="error-infos">
          <h1 className="error-infos__title">
            <WordSwitcher variant="loop" words={WORDS} />
          </h1>
          <p className="error-infos__text">une erreur est survenue</p>
        </div>

        <InfiniteKeywords items={KEYWORDS} />

        <div className="wrap-btn">
          <LinkComponent href="/" className="btn btn-dark">
            Retour à l&apos;accueil
          </LinkComponent>
          <button type="button" className="btn btn-outline" onClick={onReload}>
            Recharger
          </button>
        </div>
      </div>
      <Footer />
    </main>
  );
}
