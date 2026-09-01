"use client";

import { BrandLogo } from "@/components/BrandLogo";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

type UsageIntent = "individual" | "team";

const JOB_ROLES = [
  "Founder / CEO",
  "Operations",
  "Legal / Compliance",
  "Finance",
  "Engineering / Product",
  "HR / People",
  "Consultant",
  "Other",
];

const USE_CASES = [
  { id: "extract", label: "Extract data from documents" },
  { id: "verify", label: "Verify & validate documents" },
  { id: "compliance", label: "Compliance & audit trails" },
  { id: "automate", label: "Automate document workflows" },
  { id: "search", label: "Search across document archives" },
  { id: "api", label: "Integrate via API" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { userData, loading, refreshUser } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [usageIntent, setUsageIntent] = useState<UsageIntent | null>(null);
  const [name, setName] = useState("");
  const [organisationName, setOrganisationName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [useCases, setUseCases] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  // Prefill from profile once loaded (social login often already has a real name)
  useEffect(() => {
    if (!userData || prefilled) return;
    if (userData.name) {
      const looksPlaceholder = /doqseal user/i.test(userData.name);
      if (!looksPlaceholder) setName(userData.name);
    }
    setPrefilled(true);
  }, [userData, prefilled]);

  const toggleUseCase = (id: string) => {
    setUseCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const canContinueStep1 = Boolean(usageIntent);
  const canSubmit =
    name.trim().length >= 2 &&
    organisationName.trim().length >= 2 &&
    Boolean(jobRole) &&
    Boolean(usageIntent);

  const handleSubmit = async () => {
    if (!canSubmit || !usageIntent) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          organisationName: organisationName.trim(),
          usageIntent,
          jobRole,
          useCases,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Could not save onboarding");
        return;
      }
      toast.success("You're all set!");
      await refreshUser();
      router.replace("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] dark:bg-[#0b1220]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  const initial = (userData?.name || userData?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0b1220] text-zinc-900 dark:text-slate-50 flex flex-col">
      <header className="flex items-center justify-between px-6 sm:px-10 py-5">
        <BrandLogo className="h-8 w-auto" />
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-sm text-zinc-600 dark:text-slate-400 truncate max-w-[12rem]">
            {userData?.email}
          </div>
          <div className="w-9 h-9 rounded-full bg-[#2563eb]/15 text-[#2563eb] flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 pb-16 pt-4 sm:pt-10">
        {step === 1 ? (
          <div className="w-full max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-slate-50 mb-3">
                How would you like to use DoqSeal?
              </h1>
              <p className="text-zinc-500 dark:text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
                Tell us a bit about yourself so we can tailor your workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-10">
              <IntentCard
                selected={usageIntent === "individual"}
                onSelect={() => setUsageIntent("individual")}
                image="/illustrations/undraw-individual.svg"
                title="As an individual"
                description="Personal projects, freelancing, or exploring document intelligence on your own."
              />
              <IntentCard
                selected={usageIntent === "team"}
                onSelect={() => setUsageIntent("team")}
                image="/illustrations/undraw-team.svg"
                title="As part of a team"
                description="Collaborate with your organisation on secure document workflows at scale."
              />
            </div>

            <div className="flex justify-center">
              <button
                type="button"
                disabled={!canContinueStep1}
                onClick={() => setStep(2)}
                className="inline-flex items-center justify-center gap-2 min-w-[12rem] px-8 py-3.5 rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md dark:shadow-none"
              >
                Let&apos;s start <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="text-center mb-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#2563eb] mb-2">
                Almost there
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-slate-50 mb-2">
                Set up your workspace
              </h1>
              <p className="text-zinc-500 dark:text-slate-400">
                {usageIntent === "team"
                  ? "A few details so your team workspace is ready."
                  : "A few details to personalise your DoqSeal workspace."}
              </p>
            </div>

            <div className="bg-white dark:bg-[#111827] rounded-3xl border border-zinc-200/80 dark:border-white/10 shadow-sm dark:shadow-none p-6 sm:p-8 space-y-5">
              <Field label="Full name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-slate-900/80 px-4 py-3 text-sm text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                />
              </Field>

              <Field
                label={
                  usageIntent === "team"
                    ? "Organisation name"
                    : "Workspace / organisation name"
                }
              >
                <input
                  type="text"
                  value={organisationName}
                  onChange={(e) => setOrganisationName(e.target.value)}
                  placeholder={
                    usageIntent === "team" ? "Acme Pvt Ltd" : "Jane's Workspace"
                  }
                  className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-slate-900/80 px-4 py-3 text-sm text-zinc-900 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                />
              </Field>

              <Field label="Your role">
                <div className="grid grid-cols-2 gap-2">
                  {JOB_ROLES.map((role) => {
                    const selected = jobRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setJobRole(role)}
                        className={`text-left text-sm px-3 py-2.5 rounded-xl border transition-all ${
                          selected
                            ? "border-[#2563eb] bg-[#2563eb]/5 text-[#1d4ed8] dark:text-[#93c5fd] font-medium"
                            : "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-slate-900/80 text-zinc-700 dark:text-slate-300 hover:border-zinc-300 dark:hover:border-white/20"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="How are you planning to use DoqSeal?">
                <div className="space-y-2">
                  {USE_CASES.map((uc) => {
                    const selected = useCases.includes(uc.id);
                    return (
                      <button
                        key={uc.id}
                        type="button"
                        onClick={() => toggleUseCase(uc.id)}
                        className={`w-full flex items-center gap-3 text-left text-sm px-3 py-2.5 rounded-xl border transition-all text-zinc-800 dark:text-slate-200 ${
                          selected
                            ? "border-[#2563eb] bg-[#2563eb]/5"
                            : "border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-slate-900/80 hover:border-zinc-300 dark:hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                            selected
                              ? "bg-[#2563eb] border-[#2563eb] text-white"
                              : "border-zinc-300 dark:border-white/20 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </span>
                        {uc.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="sm:flex-1 px-4 py-3 rounded-full border border-zinc-200 dark:border-white/10 text-sm font-medium text-zinc-700 dark:text-slate-300 hover:bg-zinc-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!canSubmit || submitting}
                  onClick={handleSubmit}
                  className="sm:flex-[2] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:bg-[#1d4ed8] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Continue to dashboard <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function IntentCard({
  selected,
  onSelect,
  image,
  title,
  description,
}: {
  selected: boolean;
  onSelect: () => void;
  image: string;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group text-left rounded-3xl p-5 sm:p-6 border-2 transition-all duration-300 bg-white dark:bg-[#111827] hover:-translate-y-0.5 hover:shadow-md dark:hover:shadow-none ${
        selected
          ? "border-[#2563eb] bg-[#2563eb]/5 dark:bg-[#2563eb]/10 shadow-sm dark:shadow-none"
          : "border-transparent dark:border-white/10 shadow-sm dark:shadow-none hover:border-zinc-200 dark:hover:border-white/20"
      }`}
    >
      <div className="h-40 sm:h-48 flex items-center justify-center mb-5 rounded-2xl bg-zinc-50 dark:bg-slate-900/80 overflow-hidden">
        <img
          src={image}
          alt=""
          className="max-h-full max-w-[85%] object-contain transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-slate-50 mb-1.5">
        {title}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-zinc-400 dark:text-slate-500 uppercase tracking-widest px-0.5">
        {label}
      </label>
      {children}
    </div>
  );
}
