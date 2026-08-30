import { getHeadersFromRequest } from "@/lib/header-utils";

/**
 * Backend API base URL, always with a trailing slash.
 * Call sites append paths like `kingdom/login-request` (no leading slash).
 */
export function getApiUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return raw.endsWith("/") ? raw : `${raw}/`;
}

/** Join API base + relative path safely (handles missing/extra slashes). */
export function backendUrl(path: string): string {
  return `${getApiUrl()}${path.replace(/^\/+/, "")}`;
}

export async function backendFetch(
  request: Request,
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const headers = {
    ...getHeadersFromRequest(request, undefined, init.body instanceof FormData),
    ...(init.headers as Record<string, string> | undefined),
  };

  if (init.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  return fetch(backendUrl(path), {
    ...init,
    headers,
  });
}

export async function parseBackendJson<T = unknown>(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || "Backend request failed");
  }
  return data as { success: boolean; message: string; data: T };
}
