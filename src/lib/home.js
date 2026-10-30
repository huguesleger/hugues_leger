import { request } from "@/lib/datocms";

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
  query HomeGallery {
    home {
      gallery {
        id
        title
        slug
        image {
          url(imgixParams: { w: 1600, auto: format })
        }
      }
    }
  }
`;

/**
 * Visuels du canvas de la home. Le `slug` cible la page `/works/[slug]` et sert
 * aussi de clé pour la transition retour depuis la page projet.
 */
export async function getGalleryProjects() {
  const { home } = await request({ query: GALLERY_QUERY });
  return (home?.gallery ?? [])
    .filter((item) => item.image?.url)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      image: item.image.url,
    }));
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
