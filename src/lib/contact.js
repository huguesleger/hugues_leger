import { request } from "@/lib/datocms";

const CONTACT_QUERY = /* GraphQL */ `
  query Contact {
    contact {
      titleFirstLine
      titleSecondLine
    }
  }
`;

/** Contenu de la page /contact (modèle « Contact » dans DatoCMS). */
export async function getContact() {
  const { contact } = await request({ query: CONTACT_QUERY });
  return {
    title: {
      firstLine: contact?.titleFirstLine?.trim() ?? "",
      secondLine: contact?.titleSecondLine?.trim() ?? "",
    },
  };
}
