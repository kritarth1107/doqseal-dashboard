"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const SigningStudio = dynamic(
  () => import("@/components/sign/SigningStudio").then((m) => ({ default: m.SigningStudio })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading signing studio…
      </div>
    ),
  }
);

function CreateEnvelopeContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get("project") ?? undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0 -m-0 h-[calc(100vh-0px)] overflow-hidden">
      <SigningStudio projectId={projectId} />
    </div>
  );
}

export default function CreateEnvelopePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-slate-100">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CreateEnvelopeContent />
    </Suspense>
  );
}
