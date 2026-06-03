"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { isPrescriptionExtraction } from "@/lib/demo-extraction";
import { ExtractedDocument, StoredDocument } from "@/types/extraction";

function StatusBadge({ status }: { status: string }) {
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </span>
    );
  }
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">
        <XCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 capitalize">
      {status.replace("_", " ")}
    </span>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value);
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">{display}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export default function ProjectDocumentPage() {
  const params = useParams<{ projectId: string; documentId: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<StoredDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [pdfPage, setPdfPage] = useState(1);

  async function loadDocument(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(
        `/api/projects/${params.projectId}/documents/${params.documentId}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as StoredDocument;
      setDoc(data);
      return data;
    } catch {
      setDoc(null);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    if (!params.documentId) return;
    loadDocument();
  }, [params.documentId, params.projectId]);

  useEffect(() => {
    if (!doc || doc.status !== "processing") return;
    const interval = setInterval(async () => {
      await loadDocument(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [doc?.status, params.documentId, params.projectId]);

  const handleDelete = async () => {
    if (!doc) return;
    if (
      !confirm(
        `Delete "${doc.originalFilename}"? This removes the file and extracted data.`
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(
        `/api/projects/${params.projectId}/documents/${params.documentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      toast.success("Document deleted");
      router.push(`/projects/${params.projectId}`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] gap-3">
        <p className="text-sm text-gray-600">Document not found</p>
        <Link
          href={`/projects/${params.projectId}`}
          className="text-sm text-[#2563eb] hover:underline"
        >
          Back to project
        </Link>
      </div>
    );
  }

  const extracted = doc.extractedJson as ExtractedDocument | null;
  const fileUrl = `/api/files/${doc.storedFilename}`;
  const isPrescription = extracted ? isPrescriptionExtraction(extracted) : false;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f8fafc]">
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pt-16 sm:pt-20">
        <div className="max-w-6xl mx-auto">
          <Link
            href={`/projects/${params.projectId}`}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to project
          </Link>

          {doc.status === "processing" && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-[#2563eb]/20 bg-[#2563eb]/5 px-4 py-3 text-sm text-[#2563eb]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Extracting data from document — this takes about 45 seconds…
            </div>
          )}

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  {doc.originalFilename}
                </h1>
                <StatusBadge status={doc.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Uploaded {new Date(doc.uploadedAt).toLocaleString()}
                {doc.confidence > 0 && (
                  <> · {(doc.confidence * 100).toFixed(0)}% confidence</>
                )}
                {doc.extractionStrategy && (
                  <> · {doc.extractionStrategy === "demo" ? "Demo extraction" : doc.extractionStrategy}</>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden sticky top-24">
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 text-sm">
                  <span className="text-gray-500">Preview</span>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#2563eb] hover:underline"
                  >
                    Open in new tab
                  </a>
                </div>
                {doc.mimeType.includes("pdf") && (
                  <div className="flex gap-1 border-b border-gray-100 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => setPdfPage(1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        pdfPage === 1
                          ? "bg-[#2563eb] text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      Page 1 · {isPrescription ? "Case sheet" : "TRF"}
                    </button>
                    {!isPrescription && (
                      <button
                        type="button"
                        onClick={() => setPdfPage(2)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          pdfPage === 2
                            ? "bg-[#2563eb] text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Page 2 · Billing
                      </button>
                    )}
                  </div>
                )}
                <div className="p-4">
                  {doc.mimeType.includes("pdf") ? (
                    <div
                      className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
                      style={{ height: "480px" }}
                    >
                      <iframe
                        src={`${fileUrl}#page=${pdfPage}&view=FitH`}
                        className="h-full w-full"
                        title={`PDF preview page ${pdfPage}`}
                        key={pdfPage}
                      />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={fileUrl}
                      alt="Document preview"
                      className="w-full rounded-xl border border-gray-200"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              {extracted ? (
                <>
                  <Section title="Institution">
                    <Field label="Hospital" value={extracted.institution.name} />
                    <Field label="Department" value={extracted.institution.branch} />
                    {!isPrescription && (
                      <>
                        <Field label="Scheme" value={extracted.institution.scheme} />
                        <Field label="GST number" value={extracted.institution.gst_number} />
                        <Field label="CIN" value={extracted.institution.cin} />
                      </>
                    )}
                    <Field label="PIN" value={extracted.institution.pin} />
                  </Section>

                  <Section title="Patient">
                    <Field label="Name" value={extracted.patient.name} />
                    <Field label="Age" value={extracted.patient.age} />
                    <Field label="Gender" value={extracted.patient.gender} />
                    <Field label="Contact" value={extracted.patient.contact} />
                    <Field label="Address" value={extracted.patient.address} />
                    <Field label="Patient code" value={extracted.patient.patient_code} />
                    <Field label="Patient type" value={extracted.patient.patient_type} />
                  </Section>

                  <Section title="Referral & clinical">
                    <Field label="Referred by" value={extracted.referral.referred_by} />
                    <Field
                      label="Clinical history"
                      value={extracted.referral.clinical_history}
                    />
                  </Section>

                  {extracted.prescription && (
                    <Section title="Prescription">
                      <Field label="Consultant" value={extracted.prescription.prescriber} />
                      <Field
                        label="Registration"
                        value={extracted.prescription.registration_no}
                      />
                      <Field label="Assessment" value={extracted.prescription.diagnosis} />
                      {extracted.prescription.medications.length > 0 ? (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Medications
                          </p>
                          <ul className="mt-2 space-y-3">
                            {extracted.prescription.medications.map((med) => (
                              <li
                                key={med.name}
                                className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm"
                              >
                                <p className="font-medium text-gray-900">{med.name}</p>
                                <p className="text-gray-600 mt-1">{med.dosage}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  {med.duration} · {med.instructions}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : extracted.tests.requested.length > 0 ? (
                        <div className="sm:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                            Investigations advised
                          </p>
                          <ul className="mt-2 space-y-1">
                            {extracted.tests.requested.map((test) => (
                              <li
                                key={test}
                                className="text-sm text-gray-900 flex items-start gap-2"
                              >
                                <span className="text-[#2563eb] mt-0.5">•</span>
                                {test}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        <Field label="Advice" value={extracted.prescription.advice} />
                      </div>
                    </Section>
                  )}

                  <Section title="Visit">
                    <Field label="Date" value={extracted.visit.date} />
                    <Field label="Time" value={extracted.visit.time} />
                    <Field label="Receipt number" value={extracted.visit.rec_number} />
                    <Field label="IPD/OPD" value={extracted.visit.ipd_opd} />
                    <Field label="Bill type" value={extracted.visit.bill_type} />
                  </Section>

                  {!isPrescription && extracted.tests.requested.length > 0 && (
                  <Section title="Tests">
                    <Field label="Section" value={extracted.tests.section} />
                    <div className="sm:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Requested tests
                      </p>
                      <ul className="mt-2 space-y-1">
                        {extracted.tests.requested.map((test) => (
                          <li
                            key={test}
                            className="text-sm text-gray-900 flex items-start gap-2"
                          >
                            <span className="text-[#2563eb] mt-0.5">•</span>
                            {test}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Section>
                  )}

                  {!isPrescription && extracted.billing.gross > 0 && (
                  <Section title="Billing">
                    <Field
                      label="Gross"
                      value={`${extracted.billing.currency} ${extracted.billing.gross.toLocaleString("en-IN")}`}
                    />
                    <Field
                      label="Net"
                      value={`${extracted.billing.currency} ${extracted.billing.net.toLocaleString("en-IN")}`}
                    />
                    <Field
                      label="Paid"
                      value={`${extracted.billing.currency} ${extracted.billing.paid.toLocaleString("en-IN")}`}
                    />
                    <Field
                      label="Balance"
                      value={`${extracted.billing.currency} ${extracted.billing.balance.toLocaleString("en-IN")}`}
                    />
                    <div className="sm:col-span-2">
                      <Field
                        label="Amount in words"
                        value={extracted.billing.amount_in_words}
                      />
                    </div>
                  </Section>
                  )}

                  <Section title="Verification">
                    {Object.entries(extracted.verification).map(([key, passed]) => (
                      <div key={key} className="flex items-center gap-2">
                        {passed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                        <span className="text-sm text-gray-800 capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </Section>

                  {extracted.auto_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {extracted.auto_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
                  {doc.status === "processing"
                    ? "Extraction in progress…"
                    : "No extracted data available."}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
