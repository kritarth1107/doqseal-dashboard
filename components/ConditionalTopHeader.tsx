"use client";

import { usePathname } from "next/navigation";
import { TopHeader } from "@/components/TopHeader";

/** Full-screen builders hide the global header */
const FULL_SCREEN_PREFIXES = ["/sign/new"];

export function ConditionalTopHeader() {
  const pathname = usePathname();
  if (pathname && FULL_SCREEN_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }
  return <TopHeader />;
}
