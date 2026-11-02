import { request } from "@/lib/datocms";
import { PROJECT_CARD_FRAGMENT, toProjectCards } from "@/lib/projects";

const WORKS_PAGE_QUERY = /* GraphQL */ `
  ${PROJECT_CARD_FRAGMENT}
  query WorksPage {
    workPage {
      titleFirstLine
      titleSecondLine
      projects {
        ...ProjectCard
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
    projects: toProjectCards(workPage?.projects),
  };
}
