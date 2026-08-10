import { getHeadersFromRequest } from "@/lib/header-utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function getApiUrl(): string {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  return API_URL;
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

  return fetch(`${getApiUrl()}${path}`, {
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