"use client";

import { Suspense } from "react";
import CollectForm from "./CollectForm";
import { FormSkeleton } from "@/components/ui/Shimmer";

export default function CollectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 px-4 py-16">
          <div className="max-w-xl mx-auto">
            <FormSkeleton fields={4} />
          </div>
        </div>
      }
    >
      <CollectForm />
    </Suspense>
  );
}
