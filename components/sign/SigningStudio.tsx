"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ArrowLeft,
  PenLine,
  Send,
  Users,
  User,
  Plus,
  Trash2,
  Copy,
  Calendar,
  Type,
  CheckSquare,
  Mail,
  Clock,
  MessageSquare,
  ChevronRight,
  GripVertical,
  FileSignature,
  Check,
  Layers,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { SignatureModal } from "@/components/sign/SignatureModal";
import { withOrgHeaders } from "@/lib/client-api";
import { mapFieldsToApi, mapSignersToApi } from "@/lib/envelope-api";
import type {
  EnvelopeMode,
  FieldType,
  PlacedField,
  SignatureProfile,
  Signer,
  StudioStep,
} from "@/components/sign/types";
import {
  FIELD_META,
  SELF_SIGNER_ID,
  SIGNER_COLORS,
} from "@/lib/sign/constants";

const EnvelopePdfEditor = dynamic(
  () =>
    import("@/components/sign/EnvelopePdfEditor").then((m) => ({
      default: m.EnvelopePdfEditor,
    })),
  { ssr: false, loading: () => <div className="flex-1 bg-[#525659]" /> }
);

const FIELD_TOOLS: { type: FieldType; icon: typeof PenLine }[] = [
  { type: "signature", icon: PenLine },
  { type: "initials", icon: PenLine },
  { type: "date", icon: Calendar },
  { type: "text", icon: Type },
  { type: "name", icon: User },
  { type: "email", icon: Mail },
  { type: "checkbox", icon: CheckSquare },
];

function createSelfSigner(displayName: string): Signer {
  return {
    id: SELF_SIGNER_ID,
    name: displayName,
    email: "",
    color: SIGNER_COLORS[0],
    role: "self",
    order: 1,
  };
}

function createExternalSigner(index: number): Signer {
  return {
    id: `signer-${Date.now()}-${index}`,
    name: "",
    email: "",
    color: SIGNER_COLORS[(index + 1) % SIGNER_COLORS.length],
    role: "signer",
    order: index + 1,
  };
}

const STEPS: { id: StudioStep; label: string }[] = [
  { id: "document", label: "Document" },
  { id: "prepare", label: "Fields" },
  { id: "review", label: "Review" },
];

export function SigningStudio({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const { userData, activeOrgId } = useAuth();
  const displayName = userData?.name?.split(" ")[0] || "Me";
  const userEmail = userData?.email || "";

  const [step, setStep] = useState<StudioStep>("document");
  const [mode, setMode] = useState<EnvelopeMode>("self");
  const [signers, setSigners] = useState<Signer[]>(() => [createSelfSigner(displayName)]);
  const [activeSignerId, setActiveSignerId] = useState(SELF_SIGNER_ID);
  const [fields, setFields] = useState<PlacedField[]>([]);
  const [placingType, setPlacingType] = useState<FieldType | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [zoom, setZoom] = useState(1);
  const [selfSignature, setSelfSignature] = useState<SignatureProfile | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [pendingPlaceAfterSignature, setPendingPlaceAfterSignature] = useState(false);
  const [message, setMessage] = useState("");
  const [expiresDays, setExpiresDays] = useState(14);
  const [sequentialSigning, setSequentialSigning] = useState(true);
  const [placementHint, setPlacementHint] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const activeSigner = signers.find((s) => s.id === activeSignerId) ?? signers[0];
  const includesSelf = mode === "self" || mode === "mixed";
  const hasOthers = mode === "request" || mode === "mixed";
  const externalSigners = signers.filter((s) => s.role !== "self");

  const switchMode = (next: EnvelopeMode) => {
    setMode(next);
    setFields([]);
    setSelectedFieldId(null);
    setPlacingType(null);
    setPlacementHint(null);
    if (next === "self") {
      setSigners([createSelfSigner(displayName)]);
      setActiveSignerId(SELF_SIGNER_ID);
    } else if (next === "request") {
      const first = createExternalSigner(0);
      setSigners([first]);
      setActiveSignerId(first.id);
    } else {
      setSigners([createSelfSigner(displayName), createExternalSigner(0)]);
      setActiveSignerId(SELF_SIGNER_ID);
    }
  };

  const startPlacing = useCallback(
    (type: FieldType, hint?: string) => {
      if (!pdfFile) {
        toast.error("Upload a document first");
        return;
      }
      if (step === "document") setStep("prepare");
      setPlacingType(type);
      setPlacementHint(
        hint ?? `Click on the document to place ${FIELD_META[type].label.toLowerCase()}`
      );
    },
    [pdfFile, step]
  );

  const openSignatureSetup = (thenPlace = false) => {
    setPendingPlaceAfterSignature(thenPlace);
    setSignatureModalOpen(true);
  };

  const addMySignature = () => {
    setActiveSignerId(SELF_SIGNER_ID);
    if (!selfSignature) {
      openSignatureSetup(true);
      return;
    }
    startPlacing("signature", "Click where you want to sign");
  };

  const addSigner = () => {
    const s = createExternalSigner(externalSigners.length);
    setSigners([...signers, { ...s, order: signers.length + 1 }]);
    setActiveSignerId(s.id);
  };

  const updateSigner = (id: string, patch: Partial<Signer>) => {
    setSigners(signers.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeSigner = (id: string) => {
    if (id === SELF_SIGNER_ID) return;
    if (externalSigners.length <= 1 && mode === "request") return;
    if (externalSigners.length <= 0) return;
    setSigners(signers.filter((s) => s.id !== id));
    setFields(fields.filter((f) => f.signerId !== id));
    if (activeSignerId === id) {
      setActiveSignerId(signers.find((s) => s.id !== id)?.id ?? SELF_SIGNER_ID);
    }
  };

  const duplicateField = () => {
    const f = fields.find((x) => x.id === selectedFieldId);
    if (!f) return;
    const copy: PlacedField = {
      ...f,
      id: crypto.randomUUID(),
      xPercent: Math.min(92, f.xPercent + 3),
      yPercent: Math.min(92, f.yPercent + 3),
    };
    setFields([...fields, copy]);
    setSelectedFieldId(copy.id);
  };

  const fieldCountBySigner = useMemo(() => {
    const map: Record<string, number> = {};
    signers.forEach((s) => {
      map[s.id] = fields.filter((f) => f.signerId === s.id).length;
    });
    return map;
  }, [signers, fields]);

  const canProceedToPrepare = !!pdfFile;
  const canReview = fields.some((f) => f.type === "signature" || f.type === "initials");

  const validateAndSubmit = async () => {
    if (!pdfFile) {
      toast.error("Add a document");
      return;
    }
    if (!canReview) {
      toast.error("Add at least one signature field");
      return;
    }
    if (hasOthers) {
      const incomplete = signers.filter((s) => s.role === "signer" && !s.email.trim());
      if (incomplete.length) {
        toast.error("Enter email for each recipient");
        return;
      }
    }
    if (!activeOrgId) {
      toast.error("Select an organisation first");
      return;
    }
    if (!userEmail) {
      toast.error("Your account email is required");
      return;
    }

    setSubmitting(true);
    try {
      let resolvedProjectId = projectId;
      if (!resolvedProjectId) {
        const projectsRes = await fetch("/api/projects", withOrgHeaders(activeOrgId));
        const projectsData = await projectsRes.json();
        if (!projectsRes.ok) {
          throw new Error(projectsData.error || "Failed to load projects");
        }
        resolvedProjectId = projectsData.projects?.[0]?.projectId;
        if (!resolvedProjectId) {
          throw new Error("Create a project before sending envelopes");
        }
      }

      const formData = new FormData();
      formData.append("file", pdfFile);
      formData.append("consent", "true");

      const uploadRes = await fetch(
        `/api/projects/${resolvedProjectId}/upload`,
        withOrgHeaders(activeOrgId, { method: "POST", body: formData })
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      const envelopeTitle = title.trim() || pdfFile.name.replace(/\.pdf$/i, "");
      const createRes = await fetch(
        "/api/envelopes",
        withOrgHeaders(activeOrgId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            organisationId: activeOrgId,
            documentId: uploadData.documentId,
            title: envelopeTitle,
            message,
            signers: mapSignersToApi(signers, userData?.name || displayName, userEmail),
            fields: mapFieldsToApi(fields, signers),
          }),
        })
      );
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData.error || "Failed to create envelope");
      }

      const envelopeId = createData.envelope?.envelopeId;
      if (!envelopeId) {
        throw new Error("Envelope was not created");
      }

      const sendRes = await fetch(
        `/api/envelopes/${envelopeId}/send`,
        withOrgHeaders(activeOrgId, { method: "POST" })
      );
      const sendData = await sendRes.json();
      if (!sendRes.ok) {
        throw new Error(sendData.error || "Failed to send envelope");
      }

      toast.success(
        mode === "self"
          ? "Envelope sent — opening signing view"
          : mode === "mixed"
            ? "Envelope sent to all recipients"
            : "Envelope sent"
      );
      router.push(`/sign/${envelopeId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to create envelope");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f0f0f0]">
      {/* Top bar — DocuSign-style */}
      <header className="shrink-0 z-20 bg-[#1e1b4b] text-white shadow-md">
        <div className="flex items-center h-14 px-4 gap-4">
          <Link
            href="/sign"
            className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Envelopes</span>
          </Link>

          <div className="h-6 w-px bg-slate-200" />

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={pdfFile?.name.replace(/\.pdf$/i, "") || "Untitled envelope"}
            className="flex-1 min-w-0 max-w-md text-sm font-semibold text-white bg-transparent border-none outline-none placeholder:text-white/40"
          />

          <div className="hidden md:flex items-center gap-1 ml-auto mr-4">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (s.id === "prepare" && !canProceedToPrepare) return;
                    if (s.id === "review" && !canReview) return;
                    setStep(s.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    step === s.id
                      ? "bg-[#FFCC00] text-[#1e1b4b]"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      step === s.id ? "bg-[#1e1b4b]/20 text-[#1e1b4b]" : "bg-white/20 text-white"
                    }`}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-300 mx-0.5" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto md:ml-0">
            {step !== "document" && (
              <button
                type="button"
                onClick={() =>
                  setStep(step === "review" ? "prepare" : step === "prepare" ? "document" : "document")
                }
                className="px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 rounded-lg"
              >
                Back
              </button>
            )}
            {step === "document" && (
              <button
                type="button"
                disabled={!canProceedToPrepare}
                onClick={() => setStep("prepare")}
                className="px-4 py-2 text-sm font-medium text-[#1e1b4b] bg-[#FFCC00] rounded-lg hover:bg-[#f5c400] disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                Continue
              </button>
            )}
            {step === "prepare" && (
              <button
                type="button"
                disabled={!canReview}
                onClick={() => setStep("review")}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-40"
              >
                Review
              </button>
            )}
            {step === "review" && (
              <button
                type="button"
                onClick={validateAndSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm disabled:opacity-50"
              >
                {mode === "self" ? (
                  <>
                    <PenLine className="w-4 h-4" />
                    Sign now
                  </>
                ) : mode === "mixed" ? (
                  <>
                    <Send className="w-4 h-4" />
                    Sign & send
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send envelope
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left — recipients & mode */}
        <aside className="w-[280px] shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden hidden lg:flex">
          <div className="p-4 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Signing type
            </p>
            <div className="flex flex-col gap-1 p-1 bg-slate-100 rounded-xl">
              {(
                [
                  { id: "self" as EnvelopeMode, label: "Only me", icon: User },
                  { id: "mixed" as EnvelopeMode, label: "Me + others", icon: Users },
                  { id: "request" as EnvelopeMode, label: "Others only", icon: Send },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => switchMode(id)}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-xs font-medium transition-all text-left ${
                    mode === id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {includesSelf && (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: SIGNER_COLORS[0] }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{displayName} (you)</p>
                    <p className="text-xs text-slate-500">No email required</p>
                  </div>
                </div>
                {selfSignature ? (
                  <div className="mb-3 p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-center min-h-[48px]">
                    {selfSignature.method === "type" && selfSignature.typedText ? (
                      <span className="text-xl text-slate-800">{selfSignature.typedText}</span>
                    ) : selfSignature.imageDataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selfSignature.imageDataUrl} alt="Your signature" className="max-h-12 object-contain" />
                    ) : null}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => openSignatureSetup(false)}
                  className="w-full mb-2 py-2 text-xs font-medium text-indigo-700 border border-indigo-200 rounded-lg hover:bg-white"
                >
                  {selfSignature ? "Change signature style" : "Create signature (draw, type, or upload)"}
                </button>
                <button
                  type="button"
                  onClick={addMySignature}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/20"
                >
                  <FileSignature className="w-5 h-5" />
                  Place my signature
                </button>
              </div>
            )}

            {hasOthers && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    {mode === "mixed" ? "Other signers" : "Recipients"}
                  </p>
                  <button
                    type="button"
                    onClick={addSigner}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {sequentialSigning && externalSigners.length > 1 && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Layers className="w-3 h-3" />
                    Signs in order shown
                  </p>
                )}

                {externalSigners.map((s, idx) => (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-3 transition-all ${
                      activeSignerId === s.id
                        ? "border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="w-4 h-4 text-slate-300 mt-1 shrink-0" />
                      <span className="text-[10px] font-bold text-slate-400 mt-1">{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={s.name}
                          onFocus={() => setActiveSignerId(s.id)}
                          onChange={(e) => updateSigner(s.id, { name: e.target.value })}
                          placeholder="Full name"
                          className="w-full text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400 mb-1"
                        />
                        <input
                          type="email"
                          value={s.email}
                          onFocus={() => setActiveSignerId(s.id)}
                          onChange={(e) => updateSigner(s.id, { email: e.target.value })}
                          placeholder="email@company.com"
                          className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-2 py-1.5 outline-none focus:border-indigo-400"
                        />
                      </div>
                      {(mode === "request" ? externalSigners.length > 1 : true) && (
                        <button
                          type="button"
                          onClick={() => removeSigner(s.id)}
                          className="text-slate-400 hover:text-red-500 p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="text-[10px] text-slate-500">
                        {fieldCountBySigner[s.id] ?? 0} fields
                      </span>
                    </div>
                  </div>
                ))}

                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={sequentialSigning}
                    onChange={(e) => setSequentialSigning(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Signing order (one after another)
                </label>
              </div>
            )}
          </div>

          {step === "review" && hasOthers && (
            <div className="p-4 border-t border-slate-100 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <MessageSquare className="w-3 h-3" />
                  Message
                </span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  placeholder="Please review and sign…"
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-indigo-400 resize-none"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                  <Clock className="w-3 h-3" />
                  Expires in (days)
                </span>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={expiresDays}
                  onChange={(e) => setExpiresDays(Number(e.target.value))}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-2 outline-none focus:border-indigo-400"
                />
              </label>
            </div>
          )}
        </aside>

        {/* Center — PDF */}
        <div className="flex-1 flex flex-col min-w-0">
          {step === "document" && (
            <div className="lg:hidden shrink-0 p-2 bg-white border-b border-slate-200 flex gap-1 overflow-x-auto">
              {(["self", "mixed", "request"] as EnvelopeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`shrink-0 px-3 py-2 text-xs font-medium rounded-lg ${
                    mode === m ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {m === "self" ? "Only me" : m === "mixed" ? "Me + others" : "Others"}
                </button>
              ))}
            </div>
          )}

          {step === "document" && !pdfFile && (
            <input
              ref={uploadRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setPdfFile(f);
                  if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
                }
              }}
            />
          )}

          {(step === "prepare" || step === "document" || step === "review") && (
            <EnvelopePdfEditor
              signers={signers.map((s) => ({ id: s.id, name: s.name || "Signer", color: s.color }))}
              activeSignerId={activeSignerId}
              fields={fields}
              onFieldsChange={setFields}
              placingType={placingType}
              onPlacingTypeChange={(t) => {
                setPlacingType(t);
                if (!t) setPlacementHint(null);
              }}
              pdfFile={pdfFile}
              onPdfFileChange={(f) => {
                setPdfFile(f);
                if (!f) setStep("document");
              }}
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              zoom={zoom}
              onZoomChange={setZoom}
              placementHint={placementHint}
              selfSignature={selfSignature}
              onEditSelfSignature={() => openSignatureSetup(false)}
            />
          )}

          {step === "review" && pdfFile && (
            <div className="shrink-0 bg-white border-t border-slate-200 p-4 lg:hidden">
              <button
                type="button"
                onClick={validateAndSubmit}
                disabled={submitting}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {mode === "self" ? "Sign now" : mode === "mixed" ? "Sign & send" : "Send envelope"}
              </button>
            </div>
          )}
        </div>

        {/* Right — field tools or review */}
        <aside className="w-[260px] shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden hidden xl:flex">
          {step === "review" ? (
            <div className="p-4 flex-1 overflow-y-auto space-y-4">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Summary
              </p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Document</p>
                  <p className="font-medium text-slate-900 truncate">{pdfFile?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="font-medium text-slate-900">
                    {mode === "self"
                      ? "Self-sign"
                      : mode === "mixed"
                        ? `You + ${externalSigners.length} other(s)`
                        : `Send to ${externalSigners.length} recipient(s)`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fields</p>
                  <p className="font-medium text-slate-900">{fields.length} placed</p>
                </div>
                {hasOthers && (
                  <ul className="space-y-2 pt-2 border-t border-slate-200">
                    {signers.map((s) => (
                      <li key={s.id} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-slate-700 truncate">{s.name || s.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <>
          <div className="p-4 border-b border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Field palette
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Active:{" "}
              <span className="font-medium text-slate-800">{activeSigner?.name || "—"}</span>
            </p>
          </div>

          <div className="p-3 space-y-1.5 flex-1 overflow-y-auto">
            {FIELD_TOOLS.map(({ type, icon: Icon }) => (
              <button
                key={type}
                type="button"
                onClick={() => startPlacing(type)}
                disabled={!pdfFile}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors disabled:opacity-40 ${
                  placingType === type
                    ? "bg-indigo-600 text-white"
                    : "text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    placingType === type ? "bg-white/20" : "bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-medium">{FIELD_META[type].label}</span>
              </button>
            ))}
          </div>

          {selectedFieldId && (
            <div className="p-4 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase">Selected field</p>
              <button
                type="button"
                onClick={duplicateField}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <Copy className="w-3.5 h-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  setFields(fields.filter((f) => f.id !== selectedFieldId));
                  setSelectedFieldId(null);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}

          <div className="p-4 border-t border-slate-100 bg-slate-50/80">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px]">⌫</kbd>{" "}
              Delete field · Drag to move · Corner to resize
            </p>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-500" />
              {fields.length} fields on document
            </p>
          </div>
            </>
          )}
        </aside>
      </div>

      {/* Mobile: self-sign + field tools */}
      {pdfFile && (step === "prepare" || step === "review") && (
        <div className="xl:hidden shrink-0 border-t border-slate-200 bg-white p-3 flex gap-2 overflow-x-auto">
          {includesSelf && (
            <button
              type="button"
              onClick={addMySignature}
              className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
            >
              <FileSignature className="w-4 h-4" />
              My signature
            </button>
          )}
          {FIELD_TOOLS.slice(0, includesSelf && !hasOthers ? 4 : 7).map(({ type, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => startPlacing(type)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border ${
                placingType === type
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {FIELD_META[type].shortLabel}
            </button>
          ))}
        </div>
      )}

      <SignatureModal
        open={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false);
          setPendingPlaceAfterSignature(false);
        }}
        initial={selfSignature}
        onSave={(profile) => {
          setSelfSignature(profile);
          toast.success("Signature saved");
          if (pendingPlaceAfterSignature) {
            setPendingPlaceAfterSignature(false);
            startPlacing("signature", "Click where you want to sign");
          }
        }}
      />
    </div>
  );
}
