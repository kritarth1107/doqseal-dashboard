import { proxyBundleRequest } from "@/lib/bundles/bff";

type Context = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, context: Context) {
  const { path } = await context.params;
  return proxyBundleRequest(request, "bundle-templates", path);
}

export const dynamic = "force-dynamic";
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
