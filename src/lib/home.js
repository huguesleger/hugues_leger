import { request } from "@/lib/datocms";
import { PROJECT_CARD_FRAGMENT, toProjectCards } from "@/lib/projects";

// Tout le contenu de la home vient de DatoCMS : si l'API est injoignable,
// `request` lève une erreur plutôt que d'afficher un contenu périmé.

const HOME_QUERY = /* GraphQL */ `
  query Home {
    home {
      loaderWords
    }
  }
`;

/**
 * `loaderWords` est un texte multi-lignes dans DatoCMS : un mot (ou une phrase) par ligne.
 */
export async function getLoaderWords() {
  const { home } = await request({ query: HOME_QUERY });
  const words = (home?.loaderWords ?? "")
    .split("\n")
    .map((word) => word.trim())
    .filter(Boolean);
  return [...new Set(words)];
}

const GALLERY_QUERY = /* GraphQL */ `
  ${PROJECT_CARD_FRAGMENT}
  query HomeGallery {
    home {
      gallery {
        ...ProjectCard
      }
    }
  }
`;

/** Visuels du canvas de la home. */
export async function getGalleryProjects() {
  const { home } = await request({ query: GALLERY_QUERY });
  return toProjectCards(home?.gallery);
}

const CONTACT_QUERY = /* GraphQL */ `
  query HomeContact {
    home {
      contactStatement
    }
  }
`;

/** Texte de la section contact en bas de la home. */
export async function getHomeContactStatement() {
  const { home } = await request({ query: CONTACT_QUERY });
  return home?.contactStatement?.trim() ?? "";
}
