"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * After NextAuth social login, bridge the httpOnly session cookie into the
 * DoqSeal mobile app via a custom URL scheme (no secrets in the app binary).
 *
 * Flow: App → /api/auth/signin/{provider}?callbackUrl=/auth/mobile-bridge
 *     → OAuth → this page → doqseal://oauth?token=...
 */
function MobileBridgeContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/mobile-session", {
          credentials: "include",
        });
        const data = await res.json();
        const token = data?.data?.token as string | undefined;

        if (!res.ok || !token) {
          if (!cancelled) {
            setError(data?.error || "Sign-in did not complete. Please try again.");
          }
          return;
        }

        const method = searchParams.get("method") || "social";
        const deepLink = new URL("doqseal://oauth");
        deepLink.searchParams.set("token", token);
        deepLink.searchParams.set("method", method);

        // Give FlutterWebAuth2 / Custom Tabs a moment, then navigate.
        window.location.href = deepLink.toString();
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Could not finish mobile sign-in.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6">
      <Loader2 className="w-8 h-8 animate-spin text-[#2563eb] mb-4" />
      <p className="text-sm font-medium text-zinc-800">
        {error ? error : "Returning to DoqSeal…"}
      </p>
      {error ? (
        <a
          href="/auth"
          className="mt-4 text-sm text-[#2563eb] font-medium underline"
        >
          Back to sign in
        </a>
      ) : null}
    </div>
  );
}

export default function MobileBridgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
        </div>
      }
    >
      <MobileBridgeContent />
    </Suspense>
  );
}
