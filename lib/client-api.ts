export function withOrgHeaders(
  activeOrgId: string | null,
  init: RequestInit = {}
): RequestInit {
  const headers = new Headers(init.headers);

  if (activeOrgId) {
    headers.set("x-organisation-id", activeOrgId);
  }

  return {
    ...init,
    headers,
  };
}