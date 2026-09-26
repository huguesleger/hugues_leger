import { GraphQLClient } from "graphql-request";

export function request({ query, variables, includeDrafts, excludeInvalid }) {
  const headers = {
    authorization: `Bearer ${process.env.NEXT_DATOCMS_API_TOKEN}`,
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

  const client = new GraphQLClient("https://graphql.datocms.com", { headers });

  return client.request(query, variables);
}
