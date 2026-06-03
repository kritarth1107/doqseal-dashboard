"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { BASE_PDF_SCALE } from "@/lib/sign/constants";

export type RenderedPage = {
  pageIndex: number;
  width: number;
  height: number;
  /** Off-DOM canvas with finished render — never mutated after cache */
  canvas: HTMLCanvasElement;
};

type PdfJsModule = typeof import("pdfjs-dist");

const pageCache = new Map<string, RenderedPage[]>();

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function usePdfDocument(pdfFile: File | null) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pdfjsRef = useRef<PdfJsModule | null>(null);
  const activeKeyRef = useRef<string>("");

  useEffect(() => {
    if (!pdfFile) {
      setPdfDoc(null);
      setPages([]);
      setError(null);
      setLoading(false);
      activeKeyRef.current = "";
      return;
    }

    const key = fileKey(pdfFile);
    let cancelled = false;

    const cached = pageCache.get(key);
    if (cached?.length) {
      activeKeyRef.current = key;
      setPages(cached);
      setLoading(false);
      setError(null);
      return;
    }

    activeKeyRef.current = key;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        if (!pdfjsRef.current) {
          const pdfjs = await import("pdfjs-dist");
          pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
          pdfjsRef.current = pdfjs;
        }

        const data = await pdfFile.arrayBuffer();
        const pdf = await pdfjsRef.current.getDocument({ data }).promise;
        if (cancelled || activeKeyRef.current !== key) return;

        const rendered: RenderedPage[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled || activeKeyRef.current !== key) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: BASE_PDF_SCALE });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d", { alpha: false });
          if (!ctx) continue;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          rendered.push({
            pageIndex: i - 1,
            width: viewport.width,
            height: viewport.height,
            canvas,
          });
        }

        if (!cancelled && activeKeyRef.current === key) {
          pageCache.set(key, rendered);
          setPdfDoc(pdf);
          setPages(rendered);
        }
      } catch (e) {
        if (!cancelled && activeKeyRef.current === key) {
          setError(e instanceof Error ? e.message : "Failed to load PDF");
          setPdfDoc(null);
          setPages([]);
        }
      } finally {
        if (!cancelled && activeKeyRef.current === key) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfFile]);

  return { pdfDoc, pages, loading, error };
}
