import { request } from "@/lib/datocms";
import { GALLERY_ITEM_FRAGMENT, toGalleryProjects } from "@/lib/galleryItem";

const WORKS_PAGE_QUERY = /* GraphQL */ `
  ${GALLERY_ITEM_FRAGMENT}
  query WorksPage {
    workPage {
      titleFirstLine
      titleSecondLine
      projects {
        ...GalleryItem
      }
    }
  }
`;

/** Contenu de la page /works (modèle « Works » dans DatoCMS). */
export async function getWorksPage() {
  const { workPage } = await request({ query: WORKS_PAGE_QUERY });
  return {
    title: {
      firstLine: workPage?.titleFirstLine?.trim() ?? "",
      secondLine: workPage?.titleSecondLine?.trim() ?? "",
    },
    projects: toGalleryProjects(workPage?.projects),
  };
}
