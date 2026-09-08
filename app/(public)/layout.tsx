import type { ReactNode } from "react";

/** Minimal shell for public collect + legal pages (no dashboard sidebar). */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 antialiased">
      {children}
    </div>
  );
}
