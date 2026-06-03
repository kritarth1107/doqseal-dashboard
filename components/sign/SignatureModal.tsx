"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X, PenLine, Type, Upload, Eraser, Check } from "lucide-react";
import type { SignatureProfile } from "@/components/sign/types";
import { SIGNATURE_FONTS } from "@/lib/sign/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (profile: SignatureProfile) => void;
  initial?: SignatureProfile | null;
  title?: string;
};

export function SignatureModal({ open, onClose, onSave, initial, title = "Create your signature" }: Props) {
  const [tab, setTab] = useState<"draw" | "type" | "upload">(initial?.method ?? "draw");
  const [typedText, setTypedText] = useState(initial?.typedText ?? "");
  const [fontId, setFontId] = useState(initial?.fontFamily ?? SIGNATURE_FONTS[0].id);
  const [imageDataUrl, setImageDataUrl] = useState(initial?.imageDataUrl ?? "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const font = SIGNATURE_FONTS.find((f) => f.id === fontId) ?? SIGNATURE_FONTS[0];

  useEffect(() => {
    if (!open) return;
    setTab(initial?.method ?? "draw");
    setTypedText(initial?.typedText ?? "");
    setImageDataUrl(initial?.imageDataUrl ?? "");
    if (initial?.fontFamily) setFontId(initial.fontFamily);
  }, [open, initial]);

  useEffect(() => {
    if (!open || tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 520;
    const h = 160;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (initial?.method === "draw" && initial.imageDataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, w, h);
      img.src = initial.imageDataUrl;
    }
  }, [open, tab, initial]);

  const getDrawDataUrl = () => {
    const canvas = canvasRef.current;
    if (!canvas) return "";
    return canvas.toDataURL("image/png");
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
  };

  const drawLine = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPoint.current) return;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPoint.current = { x, y };
  };

  const pointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleUpload = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setTab("upload");
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (tab === "draw") {
      const url = getDrawDataUrl();
      if (!url) return;
      onSave({ method: "draw", imageDataUrl: url });
    } else if (tab === "type") {
      if (!typedText.trim()) return;
      onSave({ method: "type", typedText: typedText.trim(), fontFamily: fontId });
    } else if (tab === "upload" && imageDataUrl) {
      onSave({ method: "upload", imageDataUrl });
    }
    onClose();
  };

  const previewProfile = useCallback((): SignatureProfile | null => {
    if (tab === "draw") return { method: "draw", imageDataUrl: getDrawDataUrl() };
    if (tab === "type" && typedText) return { method: "type", typedText, fontFamily: fontId };
    if (tab === "upload" && imageDataUrl) return { method: "upload", imageDataUrl };
    return null;
  }, [tab, typedText, fontId, imageDataUrl]);

  if (!open) return null;

  const tabs = [
    { id: "draw" as const, label: "Draw", icon: PenLine },
    { id: "type" as const, label: "Type", icon: Type },
    { id: "upload" as const, label: "Upload", icon: Upload },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === id ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-slate-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {tab === "draw" && (
            <div className="space-y-3">
              <div className="rounded-xl border-2 border-slate-200 overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  className="block w-full touch-none cursor-crosshair"
                  onMouseDown={(e) => {
                    drawing.current = true;
                    lastPoint.current = pointerPos(e);
                  }}
                  onMouseMove={(e) => {
                    if (!drawing.current) return;
                    const p = pointerPos(e);
                    drawLine(p.x, p.y);
                  }}
                  onMouseUp={() => {
                    drawing.current = false;
                    lastPoint.current = null;
                  }}
                  onMouseLeave={() => {
                    drawing.current = false;
                    lastPoint.current = null;
                  }}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    drawing.current = true;
                    lastPoint.current = pointerPos(e);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    if (!drawing.current) return;
                    const p = pointerPos(e);
                    drawLine(p.x, p.y);
                  }}
                  onTouchEnd={() => {
                    drawing.current = false;
                    lastPoint.current = null;
                  }}
                />
              </div>
              <button
                type="button"
                onClick={clearCanvas}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <Eraser className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}

          {tab === "type" && (
            <div className="space-y-4">
              <input
                type="text"
                value={typedText}
                onChange={(e) => setTypedText(e.target.value)}
                placeholder="Type your full name"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <div className="flex flex-wrap gap-2">
                {SIGNATURE_FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontId(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      fontId === f.id ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 min-h-[80px] flex items-center justify-center">
                <span style={{ fontFamily: font.family, fontSize: "2rem", color: "#1e293b" }}>
                  {typedText || "Preview"}
                </span>
              </div>
            </div>
          )}

          {tab === "upload" && (
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center gap-2 py-10 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-medium text-slate-600">Upload PNG or JPG</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
              </label>
              {imageDataUrl && (
                <div className="rounded-xl border border-slate-200 p-4 bg-white flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageDataUrl} alt="Signature" className="max-h-24 object-contain" />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!previewProfile()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-40"
          >
            <Check className="w-4 h-4" />
            Save signature
          </button>
        </div>
      </div>
    </div>
  );
}
