"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * After NextAuth social login, hand the session to the mobile app.
 * Prefers server redirect (mobile-handoff) which Custom Tabs capture reliably.
 */
function MobileBridgeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const method = searchParams.get("method") || "social";

    // Immediate server-side handoff (best for FlutterWebAuth2 / Custom Tabs)
    router.replace(`/auth/mobile-handoff?method=${encodeURIComponent(method)}`);

    // Fallback: client deep-link if server redirect is blocked
    const fallback = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/mobile-session", {
          credentials: "include",
        });
        const data = await res.json();
        const token = data?.data?.token as string | undefined;
        if (!res.ok || !token) {
          setError(data?.error || "Sign-in did not complete. Please try again.");
          return;
        }
        const deepLink = new URL("doqseal://oauth");
        deepLink.searchParams.set("token", token);
        deepLink.searchParams.set("method", method);
        window.location.href = deepLink.toString();
      } catch (err) {
        console.error(err);
        setError("Could not finish mobile sign-in.");
      }
    }, 2500);

    return () => window.clearTimeout(fallback);
  }, [searchParams, router]);

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
