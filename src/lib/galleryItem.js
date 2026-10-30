// Bloc « Élément de galerie » de DatoCMS, utilisé par la galerie de la home et par /works.

export const GALLERY_ITEM_FRAGMENT = /* GraphQL */ `
  fragment GalleryItem on GalleryItemRecord {
    id
    title
    slug
    image {
      url(imgixParams: { w: 1600, auto: format })
    }
  }
`;

/**
 * Le `slug` cible la page `/works/[slug]` et sert aussi de clé pour la
 * transition retour depuis la page projet.
 */
export function toGalleryProjects(items) {
  return (items ?? [])
    .filter((item) => item.image?.url)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      image: item.image.url,
    }));
}
