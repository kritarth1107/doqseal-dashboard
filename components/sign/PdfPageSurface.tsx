"use client";

import { memo, useEffect, useRef } from "react";
import type { RenderedPage } from "@/hooks/usePdfDocument";

type Props = {
  page: RenderedPage;
};

/** Displays a pre-rendered PDF page — copies once to visible canvas, no re-render on parent updates */
function PdfPageSurfaceInner({ page }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintedRef = useRef(false);

  useEffect(() => {
    if (paintedRef.current) return;
    const target = canvasRef.current;
    if (!target) return;
    target.width = page.canvas.width;
    target.height = page.canvas.height;
    const ctx = target.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.drawImage(page.canvas, 0, 0);
    paintedRef.current = true;
  }, [page]);

  return (
    <canvas
      ref={canvasRef}
      className="block pointer-events-none select-none"
      style={{ width: page.width, height: page.height }}
      aria-hidden
    />
  );
}

export const PdfPageSurface = memo(PdfPageSurfaceInner);
