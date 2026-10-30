import { request } from "@/lib/datocms";

const SITE_SETTING_QUERY = /* GraphQL */ `
  query SiteSetting {
    siteSetting {
      email
    }
  }
`;

/** Réglages communs à tout le site (modèle « Réglages du site » dans DatoCMS). */
export async function getSiteSettings() {
  const { siteSetting } = await request({ query: SITE_SETTING_QUERY });
  return {
    email: siteSetting?.email?.trim() ?? "",
  };
}
