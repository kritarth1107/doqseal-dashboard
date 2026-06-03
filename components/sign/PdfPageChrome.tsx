"use client";

import { memo } from "react";
import type { RenderedPage } from "@/hooks/usePdfDocument";
import { PdfPageSurface } from "@/components/sign/PdfPageSurface";

type Props = {
  page: RenderedPage;
};

function PdfPageChromeInner({ page }: Props) {
  return (
    <div
      id={`pdf-page-${page.pageIndex}`}
      className="relative bg-white shadow-[0_2px_8px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)]"
      style={{ width: page.width, height: page.height }}
    >
      <span className="absolute -left-1 top-0 -translate-x-full text-[10px] font-medium text-slate-500 tabular-nums pr-2 select-none">
        {page.pageIndex + 1}
      </span>
      <PdfPageSurface page={page} />
    </div>
  );
}

export const PdfPageChrome = memo(
  PdfPageChromeInner,
  (a, b) => a.page.pageIndex === b.page.pageIndex && a.page.canvas === b.page.canvas
);
