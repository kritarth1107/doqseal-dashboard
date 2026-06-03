"use client";

import dynamic from "next/dynamic";

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

export default function CreateEnvelopePage() {
  return (
    <div className="flex-1 flex flex-col min-h-0 -m-0 h-[calc(100vh-0px)] overflow-hidden">
      <SigningStudio />
    </div>
  );
}
