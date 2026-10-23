import { CUSTOMER_ROUTE } from "../constants";

/** `/customer` plus the given query string, if any. */
export function buildDashboardHref(query: string): string {
  return query ? `${CUSTOMER_ROUTE}?${query}` : CUSTOMER_ROUTE;
}

/** Dashboard href for the current query string with one param removed. */
export function hrefWithoutParam(currentQuery: string, key: string): string {
  const params = new URLSearchParams(currentQuery);
  params.delete(key);
  return buildDashboardHref(params.toString());
}