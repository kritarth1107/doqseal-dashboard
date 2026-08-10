"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, Loader2, PenLine } from "lucide-react";
import { SignatureModal } from "@/components/sign/SignatureModal";
import type { FieldType, PlacedField, SignatureProfile } from "@/components/sign/types";
import { FIELD_META, SIGNER_COLORS } from "@/lib/sign/constants";

const EnvelopePdfEditor = dynamic(
  () =>
    import("@/components/sign/EnvelopePdfEditor").then((m) => ({
      default: m.EnvelopePdfEditor,
    })),
  { ssr: false, loading: () => <div className="flex-1 bg-[#525659]" /> }
);

type PublicEnvelope = {
  envelopeId: string;
  title: string;
  message?: string;
  status: string;
  signer: {
    signerId: string;
    name: string;
    email: string;
    status: string;
  };
  fields: {
    fieldId: string;
    type: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    required: boolean;
    value?: string;
  }[];
  document?: {
    filename: string;
  } | null;
};

function mapBackendFieldType(type: string): FieldType {
  switch (type) {
    case "initial":
      return "initials";
    case "signature":
      return "signature";
    case "date":
      return "date";
    case "checkbox":
      return "checkbox";
    default:
      return "text";
  }
}

function mapApiFields(fields: PublicEnvelope["fields"]): PlacedField[] {
  return fields.map((field) => ({
    id: field.fieldId,
    type: mapBackendFieldType(field.type),
    signerId: "current",
    pageIndex: field.page - 1,
    xPercent: field.x,
    yPercent: field.y,
    widthPercent: field.width,
    heightPercent: field.height,
    required: field.required,
    label: field.label,
  }));
}

export default function PublicSignPage() {
  const params = useParams();
  const token = String(params.token ?? "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [envelope, setEnvelope] = useState<PublicEnvelope | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [signature, setSignature] = useState<SignatureProfile | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [zoom, setZoom] = useState(1);

  const fields = useMemo(
    () => (envelope ? mapApiFields(envelope.fields) : []),
    [envelope]
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const envelopeRes = await fetch(`/api/envelopes/public/${token}`);
        const envelopeData = await envelopeRes.json();
        if (!envelopeRes.ok) {
          throw new Error(envelopeData.error || "Signing link not found");
        }

        if (cancelled) return;
        setEnvelope(envelopeData.envelope);
        if (envelopeData.envelope.signer.status === "signed") {
          setCompleted(true);
        }

        const fileRes = await fetch(`/api/envelopes/public/${token}/file`);
        if (!fileRes.ok) {
          throw new Error("Failed to load document");
        }

        const blob = await fileRes.blob();
        const filename =
          envelopeData.envelope.document?.filename || "document.pdf";
        if (!cancelled) {
          setPdfFile(new File([blob], filename, { type: "application/pdf" }));
        }
      } catch (error: unknown) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Failed to load envelope");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async () => {
    if (!envelope) return;

    const missing = envelope.fields.filter(
      (field) => field.required && !fieldValues[field.fieldId]?.trim()
    );
    if (missing.length) {
      toast.error("Complete all required fields before signing");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/envelopes/public/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldValues }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign envelope");
      }

      setCompleted(true);
      toast.success("Document signed successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to sign envelope");
    } finally {
      setSubmitting(false);
    }
  };

  const applySignatureToFields = (profile: SignatureProfile) => {
    setSignature(profile);
    const value =
      profile.method === "type" && profile.typedText
        ? profile.typedText
        : profile.imageDataUrl || "";
    const nextValues = { ...fieldValues };
    envelope?.fields.forEach((field) => {
      if (field.type === "signature" || field.type === "initial") {
        nextValues[field.fieldId] = value;
      }
    });
    setFieldValues(nextValues);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!envelope) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-900">Signing link unavailable</h1>
          <p className="text-sm text-gray-500 mt-2">
            This link may be invalid, expired, or already used.
          </p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900">You&apos;re all set</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your signature on &ldquo;{envelope.title}&rdquo; has been recorded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f0f0]">
      <header className="shrink-0 bg-[#1e1b4b] text-white px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/60">Secure signing</p>
          <h1 className="text-lg font-semibold">{envelope.title}</h1>
          <p className="text-sm text-white/70 mt-0.5">{envelope.signer.name}</p>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1e1b4b] bg-[#FFCC00] rounded-lg hover:bg-[#f5c400] disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
          Finish signing
        </button>
      </header>

      {envelope.message ? (
        <div className="bg-white border-b border-slate-200 px-4 py-3 text-sm text-slate-600">
          {envelope.message}
        </div>
      ) : null}

      <div className="flex-1 flex min-h-0">
        <aside className="w-[280px] shrink-0 bg-white border-r border-slate-200 p-4 hidden lg:block overflow-y-auto">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Your fields
          </p>
          <div className="space-y-3">
            {envelope.fields.map((field) => {
              const fieldType = mapBackendFieldType(field.type);
              const isSignature = field.type === "signature" || field.type === "initial";

              return (
                <label key={field.fieldId} className="block">
                  <span className="text-xs font-medium text-slate-700">
                    {field.label || FIELD_META[fieldType].label}
                    {field.required ? " *" : ""}
                  </span>
                  {isSignature ? (
                    <button
                      type="button"
                      onClick={() => setSignatureModalOpen(true)}
                      className="mt-1 w-full py-2 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                    >
                      {fieldValues[field.fieldId] ? "Update signature" : "Add signature"}
                    </button>
                  ) : field.type === "checkbox" ? (
                    <label className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={fieldValues[field.fieldId] === "true"}
                        onChange={(e) =>
                          setFieldValues({
                            ...fieldValues,
                            [field.fieldId]: e.target.checked ? "true" : "",
                          })
                        }
                      />
                      Checked
                    </label>
                  ) : (
                    <input
                      type={field.type === "date" ? "date" : "text"}
                      value={fieldValues[field.fieldId] || ""}
                      onChange={(e) =>
                        setFieldValues({
                          ...fieldValues,
                          [field.fieldId]: e.target.value,
                        })
                      }
                      className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-indigo-400"
                    />
                  )}
                </label>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <EnvelopePdfEditor
            signers={[{ id: "current", name: envelope.signer.name, color: SIGNER_COLORS[0] }]}
            activeSignerId="current"
            fields={fields}
            onFieldsChange={() => {}}
            placingType={null}
            onPlacingTypeChange={() => {}}
            pdfFile={pdfFile}
            onPdfFileChange={() => {}}
            selectedFieldId={null}
            onSelectField={() => {}}
            zoom={zoom}
            onZoomChange={setZoom}
            selfSignature={signature}
            onEditSelfSignature={() => setSignatureModalOpen(true)}
          />
        </div>
      </div>

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        initial={signature}
        onSave={(profile) => {
          applySignatureToFields(profile);
          setSignatureModalOpen(false);
          toast.success("Signature applied");
        }}
      />
    </div>
  );
}
