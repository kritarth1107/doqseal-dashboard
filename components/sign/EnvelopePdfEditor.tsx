"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import type { FieldType, PlacedField, SignatureProfile } from "@/components/sign/types";
import { FIELD_META, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP, SELF_SIGNER_ID } from "@/lib/sign/constants";
import { usePdfDocument } from "@/hooks/usePdfDocument";
import { PdfPageChrome } from "@/components/sign/PdfPageChrome";
import { PageFieldsLayer } from "@/components/sign/PageFieldsLayer";

export type { FieldType, PlacedField } from "@/components/sign/types";

export type EditorSigner = { id: string; name: string; color: string };

type Props = {
  signers: EditorSigner[];
  activeSignerId: string;
  fields: PlacedField[];
  onFieldsChange: (fields: PlacedField[]) => void;
  placingType: FieldType | null;
  onPlacingTypeChange: (type: FieldType | null) => void;
  pdfFile: File | null;
  onPdfFileChange: (file: File | null) => void;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  placementHint?: string | null;
  selfSignature?: SignatureProfile | null;
  onEditSelfSignature?: () => void;
};

const PAGE_GAP = 32;

export function EnvelopePdfEditor({
  signers,
  activeSignerId,
  fields,
  onFieldsChange,
  placingType,
  onPlacingTypeChange,
  pdfFile,
  onPdfFileChange,
  selectedFieldId,
  onSelectField,
  zoom,
  onZoomChange,
  placementHint,
  selfSignature,
  onEditSelfSignature,
}: Props) {
  const { pages, loading, error } = usePdfDocument(pdfFile);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scaleWrapRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  const [zoomLabel, setZoomLabel] = useState(Math.round(zoom * 100));

  const fieldsRef = useRef(fields);
  const selectedRef = useRef(selectedFieldId);
  fieldsRef.current = fields;
  selectedRef.current = selectedFieldId;

  useEffect(() => {
    zoomRef.current = zoom;
    setZoomLabel(Math.round(zoom * 100));
    applyZoomTransform(zoom);
  }, [zoom]);

  const layout = useMemo(() => {
    if (pages.length === 0) return { width: 0, height: 0 };
    const width = Math.max(...pages.map((p) => p.width));
    const height =
      pages.reduce((sum, p) => sum + p.height, 0) + PAGE_GAP * Math.max(0, pages.length - 1);
    return { width, height };
  }, [pages]);

  const applyZoomTransform = useCallback(
    (z: number) => {
      const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
      zoomRef.current = clamped;
      const el = scaleWrapRef.current;
      if (el) {
        el.style.transform = `scale(${clamped})`;
      }
      const spacer = spacerRef.current;
      if (spacer && layout.width > 0) {
        spacer.style.width = `${layout.width * clamped + 64}px`;
        spacer.style.height = `${layout.height * clamped + 64}px`;
      }
      return clamped;
    },
    [layout]
  );

  useEffect(() => {
    applyZoomTransform(zoomRef.current);
  }, [layout, applyZoomTransform]);

  const commitZoom = useCallback(
    (z: number) => {
      const clamped = applyZoomTransform(z);
      setZoomLabel(Math.round(clamped * 100));
      onZoomChange(clamped);
    },
    [applyZoomTransform, onZoomChange]
  );

  const updateField = useCallback((id: string, patch: Partial<PlacedField>) => {
    const current = fieldsRef.current;
    onFieldsChange(current.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, [onFieldsChange]);

  const removeField = useCallback(
    (id: string) => {
      const current = fieldsRef.current;
      onFieldsChange(current.filter((f) => f.id !== id));
      if (selectedRef.current === id) onSelectField(null);
    },
    [onFieldsChange, onSelectField]
  );

  const addFieldAt = useCallback(
    (pageIndex: number, xPercent: number, yPercent: number, type: FieldType) => {
      const def = FIELD_META[type];
      const newField: PlacedField = {
        id: crypto.randomUUID(),
        type,
        signerId: activeSignerId,
        pageIndex,
        xPercent: Math.max(0, Math.min(100 - def.widthPercent, xPercent - def.widthPercent / 2)),
        yPercent: Math.max(0, Math.min(100 - def.heightPercent, yPercent - def.heightPercent / 2)),
        widthPercent: def.widthPercent,
        heightPercent: def.heightPercent,
        required: type === "signature" || type === "initials",
        placeholder: def.placeholder,
      };
      onFieldsChange([...fieldsRef.current, newField]);
      onSelectField(newField.id);
      onPlacingTypeChange(null);
      if (
        activeSignerId === SELF_SIGNER_ID &&
        (type === "signature" || type === "initials") &&
        !selfSignature &&
        onEditSelfSignature
      ) {
        requestAnimationFrame(() => onEditSelfSignature());
      }
    },
    [activeSignerId, onFieldsChange, onPlacingTypeChange, onSelectField, selfSignature, onEditSelfSignature]
  );

  const handlePageClick = useCallback(
    (e: React.MouseEvent, pageIndex: number) => {
      if (!placingType) return;
      if ((e.target as HTMLElement).closest("[data-field-id]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
      addFieldAt(pageIndex, xPercent, yPercent, placingType);
    },
    [placingType, addFieldAt]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedRef.current) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        removeField(selectedRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeField]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !pdfFile || pages.length === 0) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      commitZoom(zoomRef.current + delta);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [pdfFile, pages.length, commitZoom]);

  const initialSpacer =
    layout.width > 0
      ? { width: layout.width * zoomRef.current + 64, height: layout.height * zoomRef.current + 64 }
      : undefined;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#eaeaea]">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.type !== "application/pdf") return;
          onFieldsChange([]);
          onSelectField(null);
          onPdfFileChange(file);
        }}
      />

      {!pdfFile && (
        <div className="flex-1 flex items-center justify-center p-10">
          <div className="max-w-md w-full text-center animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center mb-5">
              <Upload className="w-7 h-7 text-[#4C00FF]" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Upload a document</h2>
            <p className="text-sm text-slate-500 mb-6">PDF only · up to 20 MB</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#4C00FF] text-white rounded-lg font-medium text-sm hover:bg-[#3d00cc] shadow-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              Choose file
            </button>
          </div>
        </div>
      )}

      {pdfFile && loading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#4C00FF]" />
          <span className="text-sm text-slate-600 font-medium">Loading document…</span>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
          {error}
        </div>
      )}

      {pdfFile && !loading && pages.length > 0 && (
        <>
          <div className="shrink-0 flex items-center justify-between gap-4 px-4 h-11 bg-[#323639] text-white border-b border-black/20">
            <span className="text-xs font-medium text-white/90 tabular-nums">
              {pages.length} page{pages.length > 1 ? "s" : ""}
            </span>
            {placementHint && (
              <span className="hidden sm:block text-xs text-amber-300 truncate max-w-[40%] animate-in fade-in duration-200">
                {placementHint}
              </span>
            )}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => commitZoom(zoomRef.current - ZOOM_STEP)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <input
                type="range"
                min={MIN_ZOOM * 100}
                max={MAX_ZOOM * 100}
                value={zoomLabel}
                onChange={(e) => {
                  const z = Number(e.target.value) / 100;
                  setZoomLabel(Number(e.target.value));
                  applyZoomTransform(z);
                }}
                onPointerUp={() => commitZoom(zoomRef.current)}
                className="w-20 h-1 accent-[#FFCC00] cursor-pointer"
              />
              <span className="text-[11px] w-9 text-center tabular-nums text-white/80">{zoomLabel}%</span>
              <button
                type="button"
                onClick={() => commitZoom(zoomRef.current + ZOOM_STEP)}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-auto overscroll-contain sign-doc-scroll"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div
              ref={spacerRef}
              className="relative mx-auto"
              style={{
                ...initialSpacer,
                minHeight: "100%",
              }}
            >
              <div
                ref={scaleWrapRef}
                className="absolute left-1/2 top-8 -translate-x-1/2 origin-top pdf-zoom-layer"
                style={{
                  width: layout.width,
                  height: layout.height,
                  transform: `scale(${zoomRef.current})`,
                  transformOrigin: "top center",
                }}
              >
                <div className="flex flex-col items-center pdf-page-shell" style={{ gap: PAGE_GAP }}>
                  {pages.map((page) => (
                    <div
                      key={page.pageIndex}
                      className="relative"
                      style={{ width: page.width, height: page.height }}
                    >
                      <PdfPageChrome page={page} />
                      <PageFieldsLayer
                        pageIndex={page.pageIndex}
                        pageWidth={page.width}
                        pageHeight={page.height}
                        fields={fields}
                        signers={signers}
                        activeSignerId={activeSignerId}
                        selectedFieldId={selectedFieldId}
                        placingType={placingType}
                        selfSignature={selfSignature}
                        onPageClick={handlePageClick}
                        onSelectField={onSelectField}
                        onRemoveField={removeField}
                        onCommitField={updateField}
                        onEditSelfSignature={onEditSelfSignature}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
