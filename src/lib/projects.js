import { request } from "@/lib/datocms";

// Carte d'un projet dans les canvas (home, /works) et dans « Projet suivant ».
// L'URL de la couverture doit rester la même partout : c'est l'image de la
// transition entre le canvas et la page projet.
export const PROJECT_CARD_FRAGMENT = /* GraphQL */ `
  fragment ProjectCard on ProjectRecord {
    id
    title
    slug
    category
    cover {
      url(imgixParams: { w: 1600, auto: format })
    }
  }
`;

export function toProjectCards(items) {
  return (items ?? [])
    .filter((item) => item.cover?.url)
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      category: item.category,
      image: item.cover.url,
    }));
}

const SLUGS_QUERY = /* GraphQL */ `
  query ProjectSlugs {
    allProjects(first: 100) {
      slug
    }
  }
`;

export async function getProjectSlugs() {
  const { allProjects } = await request({ query: SLUGS_QUERY });
  return allProjects.map((project) => project.slug);
}

const PROJECT_QUERY = /* GraphQL */ `
  ${PROJECT_CARD_FRAGMENT}
  fragment DetailImage on FileField {
    url(imgixParams: { w: 2000, auto: format })
  }
  query Project($slug: String) {
    project(filter: { slug: { eq: $slug } }) {
      ...ProjectCard
      year
      website
      color {
        hex
      }
      interventions {
        name
      }
      stage {
        title
        image {
          ...DetailImage
        }
      }
      intention {
        text {
          value
        }
      }
      grid {
        tallImage {
          ...DetailImage
        }
        tallCaption
        smallImage {
          ...DetailImage
        }
        smallCaption
        wideImage {
          ...DetailImage
        }
        wideCaption
      }
      sequence {
        images {
          ...DetailImage
        }
      }
    }
    workPage {
      projects {
        ...ProjectCard
      }
    }
  }
`;

// Texte clair sur fond sombre, et inversement.
function getTone(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? "dark" : "light";
}

/**
 * Page `/works/[slug]`. « Projet suivant » suit l'ordre de la page Works
 * et reboucle sur le premier.
 */
export async function getProject(slug) {
  const { project, workPage } = await request({
    query: PROJECT_QUERY,
    variables: { slug },
  });
  if (!project) return null;

  const [card] = toProjectCards([project]);
  const order = toProjectCards(workPage?.projects);
  const index = order.findIndex((p) => p.slug === slug);
  const next = order.length ? order[(index + 1) % order.length] : card;
  const color = project.color?.hex ?? "#171717";

  return {
    project: {
      ...card,
      year: project.year,
      website: project.website ?? "",
      color,
      tone: getTone(color),
      interventions: project.interventions.map((item) => item.name),
      stage: {
        title: project.stage?.title?.trim() ?? "",
        image: project.stage?.image?.url ?? "",
      },
      statement: project.intention?.text?.value?.document ?? null,
      grid: [
        { image: project.grid?.tallImage?.url, caption: project.grid?.tallCaption },
        { image: project.grid?.smallImage?.url, caption: project.grid?.smallCaption },
        { image: project.grid?.wideImage?.url, caption: project.grid?.wideCaption },
      ]
        .filter((item) => item.image)
        .map((item) => ({ ...item, caption: item.caption?.trim() ?? "" })),
      sequenceImages: (project.sequence?.images ?? []).map((image) => image.url),
    },
    next,
  };
}
