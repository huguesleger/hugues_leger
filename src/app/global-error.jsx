"use client";

import "@/styles/main.scss";
import ErrorPage from "@/components/error/ErrorPage";

function PlainLink({ href, className, children }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

export default function GlobalError() {
  return (
    <html lang="fr">
      <body>
        <title>Erreur 500 — Hugues Leger</title>
        <ErrorPage
          onReload={() => window.location.reload()}
          LinkComponent={PlainLink}
        />
      </body>
    </html>
  );
}
