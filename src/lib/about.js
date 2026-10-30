import { request } from "@/lib/datocms";

const CIRCLE_FRAGMENT = /* GraphQL */ `
  fragment WordCircle on WordCircleRecord {
    outerRing
    secondRing
    thirdRing
    innerRing
  }
`;

const ABOUT_QUERY = /* GraphQL */ `
  ${CIRCLE_FRAGMENT}

  query About {
    about {
      titleFirstLine
      titleSecondLine
      bioTitle
      bioText
      bioImage {
        url(imgixParams: { w: 1600, auto: format })
      }
      designCircle {
        ...WordCircle
      }
      devCircle {
        ...WordCircle
      }
      toolkitKeywords
      contactTitle
      toolkit {
        id
        title
        hashtags
        sideLabel
        image {
          url
        }
      }
    }
  }
`;

/** Les 4 lignes d'un cercle, de l'extérieur vers l'intérieur. */
function toRings(circle) {
  return [circle?.outerRing, circle?.secondRing, circle?.thirdRing, circle?.innerRing].map(
    (line) => line?.trim() ?? "",
  );
}

/** Contenu de la page /about (modèle « About » dans DatoCMS). */
export async function getAbout() {
  const { about } = await request({ query: ABOUT_QUERY });
  return {
    title: {
      firstLine: about?.titleFirstLine?.trim() ?? "",
      secondLine: about?.titleSecondLine?.trim() ?? "",
    },
    bio: {
      title: about?.bioTitle?.trim() ?? "",
      text: about?.bioText?.trim() ?? "",
      image: about?.bioImage?.url ?? "",
    },
    circles: {
      design: toRings(about?.designCircle),
      dev: toRings(about?.devCircle),
    },
    toolkit: {
      // Une ligne = un mot du bandeau défilant.
      keywords: (about?.toolkitKeywords ?? "")
        .split("\n")
        .map((word) => word.trim())
        .filter(Boolean)
        .map((title, index) => ({ id: String(index), title })),
      items: (about?.toolkit ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        hashtags: item.hashtags,
        sideLabel: item.sideLabel,
        image: item.image?.url ?? "",
      })),
    },
    contactTitle: about?.contactTitle?.trim() ?? "",
  };
}
