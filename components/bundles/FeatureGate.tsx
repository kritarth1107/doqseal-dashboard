"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useBundlesEnabled } from "@/lib/bundles/hooks";
import { LoadingState } from "./ui";

/**
 * Case pack routes exist only for organisations with the feature on. Anyone
 * else is sent back to the dashboard (the nav item is hidden as well).
 */
export function BundlesFeatureGate({ children }: { children: ReactNode }) {
  const { enabled, loading } = useBundlesEnabled();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !enabled) router.replace("/dashboard");
  }, [enabled, loading, router]);

  if (loading || !enabled) return <LoadingState label={loading ? "Loading…" : "Redirecting…"} />;
  return <>{children}</>;
}
