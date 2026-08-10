"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Mail, PenLine, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { formatEnvelopeDate } from "@/lib/envelope-api";

type EnvelopeDetail = {
  envelopeId: string;
  title: string;
  status: string;
  message?: string;
  documentId: string;
  sentAt?: string | null;
  completedAt?: string | null;
  updatedAt?: string;
  signers: {
    signerId: string;
    name: string;
    email: string;
    role: string;
    status: string;
    signedAt?: string | null;
  }[];
};

export default function EnvelopeDetailPage() {
  const params = useParams();
  const envelopeId = String(params.envelopeId ?? "");
  const { activeOrgId } = useAuth();
  const [envelope, setEnvelope] = useState<EnvelopeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrgId || !envelopeId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/envelopes/${envelopeId}`, withOrgHeaders(activeOrgId));
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load envelope");
        }
        if (!cancelled) {
          setEnvelope(data.envelope);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load envelope");
          setEnvelope(null);
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
  }, [activeOrgId, envelopeId]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto py-16 flex items-center justify-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading envelope…
        </div>
      </div>
    );
  }

  if (error || !envelope) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/sign"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            All envelopes
          </Link>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500">{error || "Envelope not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 pt-16 sm:pt-20">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/sign"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          All envelopes
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{envelope.title}</h1>
            <p className="text-sm text-gray-500 mt-1 capitalize">
              Status: {envelope.status.replace("_", " ")} · Updated{" "}
              {formatEnvelopeDate(envelope.updatedAt)}
            </p>
            {envelope.message ? (
              <p className="text-sm text-gray-600 mt-2">{envelope.message}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/documents/${envelope.documentId}/file`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
            >
              <Download className="w-4 h-4 inline mr-2 -mt-0.5" />
              Download
            </a>
            <Link
              href="/sign/new"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg"
            >
              <PenLine className="w-4 h-4 inline mr-2 -mt-0.5" />
              New envelope
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Signers</h2>
            <ul className="space-y-3">
              {envelope.signers.map((s) => (
                <li
                  key={s.signerId}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                    <span className="text-[10px] uppercase text-gray-400">{s.role}</span>
                  </div>
                  {s.status === "signed" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-500" />
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-4 w-full py-2 text-sm font-medium text-[#2563eb] border border-[#2563eb]/30 rounded-lg hover:bg-[#2563eb]/5 flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Resend reminders
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 min-h-[280px]">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Audit trail</h2>
            <ol className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-gray-400 shrink-0">
                  {formatEnvelopeDate(envelope.updatedAt)}
                </span>
                Envelope created
              </li>
              {envelope.sentAt ? (
                <li className="flex gap-2">
                  <span className="text-gray-400 shrink-0">
                    {formatEnvelopeDate(envelope.sentAt)}
                  </span>
                  Invitation sent to all signers
                </li>
              ) : null}
              {envelope.signers.some((s) => s.status === "signed") ? (
                <li className="flex gap-2">
                  <span className="text-gray-400 shrink-0">Recent</span>
                  Signature captured
                </li>
              ) : null}
              {envelope.completedAt ? (
                <li className="flex gap-2">
                  <span className="text-gray-400 shrink-0">
                    {formatEnvelopeDate(envelope.completedAt)}
                  </span>
                  Envelope completed
                </li>
              ) : null}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
