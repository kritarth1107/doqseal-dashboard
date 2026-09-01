/** Resolve backend profile media URLs to same-origin dashboard proxy paths. */
export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/api/v1/media/profile/")) {
    return url.replace("/api/v1/media/profile/", "/api/media/profile/");
  }
  if (url.startsWith("/api/media/profile/")) {
    return url;
  }
  if (url.startsWith("profiles/")) {
    return `/api/media/profile/${url
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
  }
  return url;
}
