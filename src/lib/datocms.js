// Toutes les réponses DatoCMS partagent ce tag : le webhook de publication
// appelle `revalidateTag(DATOCMS_CACHE_TAG)` pour rafraîchir le site.
export const DATOCMS_CACHE_TAG = "datocms";

export async function request({ query, variables, includeDrafts, excludeInvalid }) {
  const headers = {
    authorization: `Bearer ${process.env.NEXT_DATOCMS_API_TOKEN}`,
    "content-type": "application/json",
  };

  if (includeDrafts) {
    headers["X-Include-Drafts"] = "true";
  }

  if (excludeInvalid) {
    headers["X-Exclude-Invalid"] = "true";
  }
  if (process.env.NEXT_DATOCMS_ENVIRONMENT) {
    headers["X-Environment"] = process.env.NEXT_DATOCMS_ENVIRONMENT;
  }

  const response = await fetch("https://graphql.datocms.com", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    // En dev, toujours frais : une modif dans DatoCMS se voit au rechargement.
    ...(process.env.NODE_ENV === "development"
      ? { cache: "no-store" }
      : { cache: "force-cache", next: { tags: [DATOCMS_CACHE_TAG] } }),
  });

  const { data, errors } = await response.json();
  if (!response.ok || errors?.length) {
    throw new Error(errors?.[0]?.message ?? `DatoCMS a répondu ${response.status}`);
  }

  return data;
}
