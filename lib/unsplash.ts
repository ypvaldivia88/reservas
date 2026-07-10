/**
 * Unsplash Search API — used when seeding tenant placeholder media.
 * Set UNSPLASH_ACCESS_KEY (Client-ID from unsplash.com/developers).
 * Free tier: 50 requests/hour — enough for registration + occasional reseeds.
 */

const ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

interface UnsplashSearchResult {
  results?: Array<{
    id: string;
    urls: { regular: string; small: string };
  }>;
}

export function hasUnsplashAccessKey(): boolean {
  return Boolean(ACCESS_KEY?.trim());
}

export function buildUnsplashCdnUrl(
  rawUrl: string,
  width: number,
  height?: number
): string {
  const url = new URL(rawUrl);
  url.searchParams.set("w", String(width));
  if (height) url.searchParams.set("h", String(height));
  url.searchParams.set("q", "85");
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  return url.toString();
}

/**
 * Search Unsplash for a single photo URL matching the query.
 * @param page — 1-based page offset so sibling services get different photos
 */
export async function searchUnsplashPhoto(
  query: string,
  options?: {
    page?: number;
    orientation?: "landscape" | "portrait" | "squarish";
    width?: number;
    height?: number;
  }
): Promise<string | null> {
  if (!ACCESS_KEY?.trim()) return null;

  const params = new URLSearchParams({
    query: query.trim(),
    per_page: "1",
    page: String(options?.page ?? 1),
    orientation: options?.orientation ?? "landscape",
    content_filter: "high",
  });

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: { Authorization: `Client-ID ${ACCESS_KEY.trim()}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.warn(`Unsplash search failed (${res.status}): ${query}`);
      return null;
    }

    const data = (await res.json()) as UnsplashSearchResult;
    const photo = data.results?.[0];
    if (!photo?.urls?.regular) return null;

    return buildUnsplashCdnUrl(
      photo.urls.regular,
      options?.width ?? 900,
      options?.height
    );
  } catch (error) {
    console.warn("Unsplash search error:", error);
    return null;
  }
}
