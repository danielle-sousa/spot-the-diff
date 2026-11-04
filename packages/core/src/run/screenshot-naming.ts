/**
 * Builds the file name shared by the baseline, current and diff images of
 * one route at one viewport. The double hyphen is safe as a separator because
 * config validation forbids it inside names.
 */
export function getScreenshotName(route: { name: string }, viewport: { name: string }): string {
  return `${route.name}--${viewport.name}`;
}

/**
 * Joins the base URL and the route path by plain concatenation. `new URL(path, base)`
 * would drop any sub-path of the base, breaking apps served from "/app/".
 */
export function resolveRouteUrl(baseUrl: string, routePath: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${routePath}`;
}