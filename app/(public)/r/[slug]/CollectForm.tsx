"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Upload } from "lucide-react";

type Requirement = {
  requirementId: string;
  label: string;
  description?: string | null;
  allowedExtensions?: string[];
  required?: boolean;
};

type PublicLink = {
  slug: string;
  title: string;
  description?: string | null;
  requirements: Requirement[];
  settings: {
    collectName: boolean;
    requireEmail: boolean;
    requireMobile: boolean;
    verifyEmail: boolean;
    verifyMobile: boolean;
  };
  branding: {
    organisationName: string;
    logoUrl?: string | null;
    website?: string | null;
  };
};

export default function CollectForm() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = String(params.slug || "");

  const [link, setLink] = useState<PublicLink | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState(searchParams.get("name") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [mobile, setMobile] = useState(searchParams.get("mobile") || "");

  const [emailChallenge, setEmailChallenge] = useState<string | null>(null);
  const [mobileChallenge, setMobileChallenge] = useState<string | null>(null);
  const [emailOtp, setEmailOtp] = useState("");
  const [mobileOtp, setMobileOtp] = useState("");
  const [emailProof, setEmailProof] = useState<string | null>(null);
  const [mobileProof, setMobileProof] = useState<string | null>(null);

  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentTerms, setConsentTerms] = useState(false);
  const [consentDpa, setConsentDpa] = useState(false);

  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [otpBusy, setOtpBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/request-links/public/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Link unavailable");
        setLink(data.data);
        const init: Record<string, File | null> = {};
        for (const r of data.data.requirements || []) {
          init[r.requirementId] = null;
        }
        setFiles(init);
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Unavailable");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const brandName = link?.branding?.organisationName || "DoqSeal";
  const needsEmailOtp = Boolean(link?.settings.verifyEmail && !emailProof);
  const needsMobileOtp = Boolean(link?.settings.verifyMobile && !mobileProof);

  const acceptAttr = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of link?.requirements || []) {
      if (r.allowedExtensions?.length) {
        map[r.requirementId] = r.allowedExtensions
          .map((e) => `.${e.replace(/^\./, "")}`)
          .join(",");
      }
    }
    return map;
  }, [link]);

  const requestOtp = async (channel: "email" | "mobile") => {
    setOtpBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/request-links/public/${encodeURIComponent(slug)}/otp/request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channel,
            email: channel === "email" ? email : undefined,
            mobile: channel === "mobile" ? mobile : undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send OTP");
      if (channel === "email") setEmailChallenge(data.data.challengeToken);
      else setMobileChallenge(data.data.challengeToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OTP failed");
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyOtp = async (channel: "email" | "mobile") => {
    setOtpBusy(true);
    setError(null);
    try {
      const challengeToken =
        channel === "email" ? emailChallenge : mobileChallenge;
      const otp = channel === "email" ? emailOtp : mobileOtp;
      if (!challengeToken) throw new Error("Request an OTP first");
      const res = await fetch(
        `/api/request-links/public/${encodeURIComponent(slug)}/otp/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeToken, otp }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");
      if (channel === "email") setEmailProof(data.data.proofToken);
      else setMobileProof(data.data.proofToken);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setOtpBusy(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!link) return;
    setSubmitting(true);
    setError(null);
    try {
      if (needsEmailOtp || needsMobileOtp) {
        throw new Error("Complete OTP verification before uploading");
      }
      if (!consentPrivacy || !consentTerms || !consentDpa) {
        throw new Error("Accept Privacy Policy, Terms, and DPA to continue");
      }

      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("mobile", mobile);
      if (emailProof) formData.set("emailProofToken", emailProof);
      if (mobileProof) formData.set("mobileProofToken", mobileProof);
      formData.set("consentPrivacy", "true");
      formData.set("consentTerms", "true");
      formData.set("consentDpa", "true");

      for (const req of link.requirements) {
        const file = files[req.requirementId];
        if (!file) {
          if (req.required !== false) {
            throw new Error(`Upload required: ${req.label}`);
          }
          continue;
        }
        formData.append(`file__${req.requirementId}`, file);
      }

      const res = await fetch(
        `/api/request-links/public/${encodeURIComponent(slug)}/submit`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (loadError || !link) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-semibold text-slate-900">
            Link unavailable
          </h1>
          <p className="text-sm text-slate-500">
            {loadError || "This collection link is not active."}
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h1 className="text-2xl font-semibold text-slate-900">
            Documents received
          </h1>
          <p className="text-sm text-slate-600">
            Thanks — your files were sent securely to {brandName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-3 mb-6">
            {link.branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={link.branding.logoUrl}
                alt=""
                className="h-10 w-10 rounded-lg object-cover bg-white"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold">
                {brandName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm text-slate-300">{brandName}</p>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                {link.title}
              </h1>
            </div>
          </div>
          {link.description && (
            <p className="text-sm text-slate-300 leading-relaxed">
              {link.description}
            </p>
          )}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="max-w-xl mx-auto px-4 -mt-6 pb-16 space-y-5"
      >
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Your details</h2>
          {link.settings.collectName && (
            <label className="block space-y-1">
              <span className="text-xs text-slate-600">Full name</span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </label>
          )}
          {link.settings.requireEmail && (
            <div className="space-y-2">
              <label className="block space-y-1">
                <span className="text-xs text-slate-600">Email</span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailProof(null);
                    setEmailChallenge(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </label>
              {link.settings.verifyEmail && (
                <div className="flex flex-wrap gap-2 items-end">
                  {!emailProof ? (
                    <>
                      <button
                        type="button"
                        disabled={otpBusy || !email}
                        onClick={() => requestOtp("email")}
                        className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg"
                      >
                        Send email OTP
                      </button>
                      {emailChallenge && (
                        <>
                          <input
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                            placeholder="OTP"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-28"
                          />
                          <button
                            type="button"
                            disabled={otpBusy}
                            onClick={() => verifyOtp("email")}
                            className="px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg"
                          >
                            Verify
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-emerald-700">Email verified</p>
                  )}
                </div>
              )}
            </div>
          )}
          {link.settings.requireMobile && (
            <div className="space-y-2">
              <label className="block space-y-1">
                <span className="text-xs text-slate-600">Mobile</span>
                <input
                  required
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setMobileProof(null);
                    setMobileChallenge(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="+91…"
                />
              </label>
              {link.settings.verifyMobile && (
                <div className="flex flex-wrap gap-2 items-end">
                  {!mobileProof ? (
                    <>
                      <button
                        type="button"
                        disabled={otpBusy || !mobile}
                        onClick={() => requestOtp("mobile")}
                        className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg"
                      >
                        Send SMS OTP
                      </button>
                      {mobileChallenge && (
                        <>
                          <input
                            value={mobileOtp}
                            onChange={(e) => setMobileOtp(e.target.value)}
                            placeholder="OTP"
                            className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-28"
                          />
                          <button
                            type="button"
                            disabled={otpBusy}
                            onClick={() => verifyOtp("mobile")}
                            className="px-3 py-2 text-xs font-medium bg-slate-900 text-white rounded-lg"
                          >
                            Verify
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-emerald-700">Mobile verified</p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Documents</h2>
          {link.requirements.map((req) => (
            <label
              key={req.requirementId}
              className="block border border-slate-100 rounded-xl p-4 space-y-2 bg-slate-50/60"
            >
              <span className="text-sm font-medium text-slate-900">
                {req.label}
                {req.required !== false ? " *" : ""}
              </span>
              {req.description && (
                <span className="block text-xs text-slate-500">
                  {req.description}
                </span>
              )}
              <input
                type="file"
                required={req.required !== false}
                accept={acceptAttr[req.requirementId]}
                onChange={(e) =>
                  setFiles((prev) => ({
                    ...prev,
                    [req.requirementId]: e.target.files?.[0] || null,
                  }))
                }
                className="block w-full text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-900 file:text-white file:text-xs"
              />
            </label>
          ))}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-900">Consent</h2>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              I accept the{" "}
              <Link
                href="/legal/privacy-policy"
                target="_blank"
                className="text-[#2563eb] underline"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consentTerms}
              onChange={(e) => setConsentTerms(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              I accept the{" "}
              <Link
                href="/legal/terms-of-service"
                target="_blank"
                className="text-[#2563eb] underline"
              >
                Terms of Service
              </Link>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={consentDpa}
              onChange={(e) => setConsentDpa(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              I accept the{" "}
              <Link
                href="/legal/data-processing-agreement"
                target="_blank"
                className="text-[#2563eb] underline"
              >
                Data Processing Agreement
              </Link>
            </span>
          </label>
        </section>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || needsEmailOtp || needsMobileOtp}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-[#2563eb] rounded-xl hover:bg-[#1d4ed8] disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {submitting ? "Uploading…" : "Submit documents"}
        </button>

        <p className="text-center text-[11px] text-slate-400">
          Powered by DoqSeal · Secure document collection
        </p>
      </form>
    </div>
  );
}
