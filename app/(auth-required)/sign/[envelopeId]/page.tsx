"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download, Mail, PenLine, CheckCircle2, Clock } from "lucide-react";
import { signEnvelopes } from "@/lib/mock-data";

export default function EnvelopeDetailPage() {
  const params = useParams();
  const envelope =
    signEnvelopes.find((e) => e.id === params.envelopeId) ?? signEnvelopes[0];

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
              Status: {envelope.status.replace("_", " ")} · Updated {envelope.updatedAt}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg"
            >
              <Download className="w-4 h-4 inline mr-2 -mt-0.5" />
              Download
            </button>
            <Link
              href="/sign/new"
              className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg"
            >
              <PenLine className="w-4 h-4 inline mr-2 -mt-0.5" />
              Edit fields
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Signers</h2>
            <ul className="space-y-3">
              {envelope.signers.map((s) => (
                <li
                  key={s.email}
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
                <span className="text-gray-400 shrink-0">Today</span>
                Envelope created
              </li>
              <li className="flex gap-2">
                <span className="text-gray-400 shrink-0">Today</span>
                Invitation sent to all signers
              </li>
              {envelope.signers.some((s) => s.status === "signed") && (
                <li className="flex gap-2">
                  <span className="text-gray-400 shrink-0">Today</span>
                  First signature captured (eIDAS / ESIGN compliant)
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
