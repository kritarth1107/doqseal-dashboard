"use client";

import { Suspense } from "react";
import CollectForm from "./CollectForm";

export default function CollectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
          Loading…
        </div>
      }
    >
      <CollectForm />
    </Suspense>
  );
}
