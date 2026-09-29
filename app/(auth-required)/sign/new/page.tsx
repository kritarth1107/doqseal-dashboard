"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { StudioSkeleton } from "@/components/ui/Shimmer";

const SigningStudio = dynamic(
  () => import("@/components/sign/SigningStudio").then((m) => ({ default: m.SigningStudio })),
  {
    ssr: false,
    loading: () => <StudioSkeleton />,
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
      fallback={<StudioSkeleton />}
    >
      <CreateEnvelopeContent />
    </Suspense>
  );
}
