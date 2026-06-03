"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import type { PlacedField, SignatureProfile } from "@/components/sign/types";
import {
  FIELD_META,
  SIGNATURE_FONTS,
  isInputFieldType,
  isSignatureFieldType,
} from "@/lib/sign/constants";

type Props = {
  field: PlacedField;
  color: string;
  signerName: string;
  isSelected: boolean;
  isActiveSigner: boolean;
  isSelf: boolean;
  selfSignature: SignatureProfile | null;
  onSelect: () => void;
  onRemove: () => void;
  onCommit: (patch: Partial<PlacedField>) => void;
  onEditSignature?: () => void;
};

function SignaturePreview({ profile }: { profile: SignatureProfile }) {
  if (profile.method === "type" && profile.typedText) {
    const font = SIGNATURE_FONTS.find((f) => f.id === profile.fontFamily) ?? SIGNATURE_FONTS[0];
    return (
      <span
        className="truncate px-1 leading-none pointer-events-none"
        style={{ fontFamily: font.family, fontSize: "clamp(14px, 2.8vw, 26px)", color: "#1a1a1a" }}
      >
        {profile.typedText}
      </span>
    );
  }
  if (profile.imageDataUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.imageDataUrl}
        alt=""
        className="max-h-full max-w-full object-contain p-0.5 pointer-events-none"
        draggable={false}
      />
    );
  }
  return null;
}

function DocumentFieldInner({
  field,
  color,
  signerName,
  isSelected,
  isActiveSigner,
  isSelf,
  selfSignature,
  onSelect,
  onRemove,
  onCommit,
  onEditSignature,
}: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startX: number;
    startY: number;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
  } | null>(null);
  const rafRef = useRef<number | null>(null);
  const geomRef = useRef({ x: field.xPercent, y: field.yPercent, w: field.widthPercent, h: field.heightPercent });

  const meta = FIELD_META[field.type];
  const firstName = signerName.split(" ")[0] || "Signer";
  const showInput = isInputFieldType(field.type);
  const showSig = isSignatureFieldType(field.type);
  const placeholder = field.placeholder ?? meta.placeholder;

  const applyGeometry = useCallback((x: number, y: number, w: number, h: number) => {
    const el = elRef.current;
    if (!el) return;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.width = `${w}%`;
    el.style.height = `${h}%`;
  }, []);

  useEffect(() => {
    if (!dragRef.current) {
      geomRef.current = {
        x: field.xPercent,
        y: field.yPercent,
        w: field.widthPercent,
        h: field.heightPercent,
      };
      applyGeometry(field.xPercent, field.yPercent, field.widthPercent, field.heightPercent);
    }
  }, [field.xPercent, field.yPercent, field.widthPercent, field.heightPercent, applyGeometry]);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      const wrap = elRef.current?.parentElement;
      if (!d || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dx = ((e.clientX - d.startX) / rect.width) * 100;
      const dy = ((e.clientY - d.startY) / rect.height) * 100;

      let x = d.ox;
      let y = d.oy;
      let w = d.ow;
      let h = d.oh;

      if (d.mode === "move") {
        x = Math.max(0, Math.min(100 - d.ow, d.ox + dx));
        y = Math.max(0, Math.min(100 - d.oh, d.oy + dy));
      } else {
        w = Math.max(8, Math.min(60, d.ow + dx));
        h = Math.max(4, Math.min(22, d.oh + dy));
      }

      geomRef.current = { x, y, w, h };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => applyGeometry(x, y, w, h));
    },
    [applyGeometry]
  );

  const endDrag = useCallback(() => {
    const d = dragRef.current;
    if (d) {
      const { x, y, w, h } = geomRef.current;
      onCommit({ xPercent: x, yPercent: y, widthPercent: w, heightPercent: h });
    }
    dragRef.current = null;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  }, [onCommit, onPointerMove]);

  const startDrag = (e: React.PointerEvent, mode: "move" | "resize") => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    onSelect();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      ox: field.xPercent,
      oy: field.yPercent,
      ow: field.widthPercent,
      oh: field.heightPercent,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const fieldBg = isActiveSigner ? "bg-[#FFFBEB]" : "bg-white";
  const borderColor = isSelected ? "#2563EB" : isActiveSigner ? "#E8A317" : color;

  return (
    <div
      ref={elRef}
      data-field-id={field.id}
      className={`absolute touch-none ${isSelected ? "z-30" : "z-10"}`}
      style={{
        left: `${field.xPercent}%`,
        top: `${field.yPercent}%`,
        width: `${field.widthPercent}%`,
        height: `${field.heightPercent}%`,
        willChange: "transform",
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div
        className="absolute -top-[18px] left-0 px-1.5 py-0.5 rounded-sm text-[10px] font-semibold text-white whitespace-nowrap shadow-sm pointer-events-none transition-opacity duration-150"
        style={{ backgroundColor: color }}
      >
        {firstName} · {meta.shortLabel}
      </div>

      {showInput ? (
        <div
          onPointerDown={(e) => startDrag(e, "move")}
          className={`h-full w-full rounded-[3px] border-2 ${fieldBg} flex items-center px-2 cursor-grab active:cursor-grabbing transition-shadow duration-150 ease-out ${
            isSelected ? "shadow-[0_0_0_2px_#2563EB,0_4px_12px_rgba(37,99,235,0.25)]" : "shadow-sm hover:shadow-md"
          }`}
          style={{ borderColor }}
        >
          <span className="text-[11px] text-slate-400 truncate w-full pointer-events-none select-none">
            {placeholder}
          </span>
        </div>
      ) : field.type === "checkbox" ? (
        <div
          onPointerDown={(e) => startDrag(e, "move")}
          className={`h-full w-full rounded-[3px] border-2 ${fieldBg} flex items-center justify-center cursor-grab transition-shadow duration-150 ${
            isSelected ? "shadow-[0_0_0_2px_#2563EB]" : ""
          }`}
          style={{ borderColor }}
        >
          <div className="w-[55%] h-[55%] border-2 border-slate-400 rounded-[2px] bg-white" />
        </div>
      ) : (
        <div
          onPointerDown={(e) => startDrag(e, "move")}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (isSelf && onEditSignature) onEditSignature();
          }}
          className={`h-full w-full rounded-[3px] border-2 ${fieldBg} flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden transition-shadow duration-150 ease-out ${
            isSelected ? "shadow-[0_0_0_2px_#2563EB,0_4px_12px_rgba(37,99,235,0.2)]" : "shadow-sm hover:shadow-md"
          }`}
          style={{ borderColor }}
        >
          {isSelf && selfSignature ? (
            <SignaturePreview profile={selfSignature} />
          ) : (
            <span className="text-[10px] text-slate-400 font-normal px-1 text-center pointer-events-none">
              {isSelf ? "Click to sign" : placeholder}
            </span>
          )}
        </div>
      )}

      {isSelected && (
        <>
          <div
            onPointerDown={(e) => startDrag(e, "resize")}
            className="absolute -bottom-[5px] -right-[5px] w-2.5 h-2.5 bg-white border-2 border-[#2563EB] rounded-[2px] cursor-se-resize z-40 shadow-sm"
          />
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-2 -right-2 w-[18px] h-[18px] bg-slate-800/90 text-white rounded-full text-[11px] leading-none flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-40"
            aria-label="Remove"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

export const DocumentField = memo(DocumentFieldInner, (a, b) => {
  if (a.field.id !== b.field.id) return false;
  if (a.isSelected !== b.isSelected) return false;
  if (a.isActiveSigner !== b.isActiveSigner) return false;
  if (a.color !== b.color) return false;
  if (a.signerName !== b.signerName) return false;
  if (a.isSelf !== b.isSelf) return false;
  if (a.selfSignature !== b.selfSignature) return false;
  return (
    a.field.xPercent === b.field.xPercent &&
    a.field.yPercent === b.field.yPercent &&
    a.field.widthPercent === b.field.widthPercent &&
    a.field.heightPercent === b.field.heightPercent
  );
});
