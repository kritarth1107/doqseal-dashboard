export function getCollectBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_COLLECT_URL?.trim() ||
    "https://collect.doqseal.com";
  return raw.replace(/\/$/, "");
}

export function buildCollectShareUrl(
  slug: string,
  prefill?: { name?: string; email?: string; mobile?: string }
): string {
  const url = new URL(`${getCollectBaseUrl()}/r/${slug}`);
  if (prefill?.name) url.searchParams.set("name", prefill.name);
  if (prefill?.email) url.searchParams.set("email", prefill.email);
  if (prefill?.mobile) url.searchParams.set("mobile", prefill.mobile);
  return url.toString();
}
