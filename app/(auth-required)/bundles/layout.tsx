import type { ReactNode } from "react";
import { BundlesFeatureGate } from "@/components/bundles/FeatureGate";

export default function BundlesLayout({ children }: { children: ReactNode }) {
  return <BundlesFeatureGate>{children}</BundlesFeatureGate>;
}
