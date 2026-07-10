/**
 * Helpers for tenant image URLs stored in MongoDB or CMS defaults.
 */
export function isLocalPublicImage(url: string): boolean {
  if (!url) return false;
  return url.startsWith("/") && !url.startsWith("//");
}

export function isPlaceholderImage(url: string): boolean {
  return url.includes("/placeholders/");
}

/** Local public assets should bypass the Next image optimizer. */
export function shouldUnoptimizeImage(url: string): boolean {
  return isLocalPublicImage(url);
}
