"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, FileStack, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  CARD_CLASS,
  EmptyState,
  ErrorState,
  FeatureDisabledNotice,
  INPUT_CLASS,
  LoadingState,
  PAGE_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
} from "@/components/bundles/ui";
import { isFeatureDisabled } from "@/lib/bundles/api";
import { useBundleApi } from "@/lib/bundles/hooks";
import { buildProfile, groupByVertical, initialProfile, type ProfileDraft } from "@/lib/bundles/profile";
import type { ProfileFieldDef, StarterTemplate, TemplateDetail, TemplateListItem } from "@/lib/bundles/types";

type Choice = { kind: "starter"; starter: StarterTemplate } | { kind: "template"; template: TemplateListItem };

function choiceKey(c: Choice | null) {
  if (!c) return "";
  return c.kind === "starter" ? `s:${c.starter.key}` : `t:${c.template.templateId}`;
}

export default function NewBundlePage() {
  const api = useBundleApi();
  const router = useRouter();

  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "disabled">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starters, setStarters] = useState<StarterTemplate[]>([]);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [vertical, setVertical] = useState<string>("all");
  const [reloadKey, setReloadKey] = useState(0);

  const [choice, setChoice] = useState<Choice | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [profile, setProfile] = useState<ProfileDraft>({});
  const [submitting, setSubmitting] = useState(false);
  const [showMissing, setShowMissing] = useState(false);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    setPhase("loading");
    Promise.all([api.starters(), api.templates()])
      .then(([s, t]) => {
        if (cancelled) return;
        setStarters(s);
        setTemplates(t);
        setPhase("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (isFeatureDisabled(err)) return setPhase("disabled");
        setLoadError(err instanceof Error ? err.message : "Could not load templates.");
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, [api, reloadKey]);

  // Templates copied from a starter appear in the starter list, not twice.
  const starterTemplateIds = useMemo(
    () => new Set(starters.map((s) => s.templateId).filter(Boolean) as string[]),
    [starters]
  );
  const ownTemplates = templates.filter((t) => !starterTemplateIds.has(t.templateId) && !t.isExample);
  const groups = groupByVertical(starters);
  const visibleGroups = vertical === "all" ? groups : groups.filter((g) => g.vertical === vertical);

  const fields: ProfileFieldDef[] = template?.draft?.profileFields ?? [];

  const pick = async (next: Choice) => {
    if (!api) return;
    setChoice(next);
    setTemplate(null);
    setStepError(null);
    setPreparing(true);
    try {
      const detail =
        next.kind === "starter" ? await api.adoptStarter(next.starter.key) : await api.template(next.template.templateId);
      setTemplate(detail);
      setProfile(initialProfile(detail.draft?.profileFields ?? []));
      setShowMissing(false);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : "Could not prepare this template.");
    } finally {
      setPreparing(false);
    }
  };

  const { profile: builtProfile, missing } = buildProfile(fields, profile);
  const canSubmit = Boolean(template) && (name.trim() || externalRef.trim()) && !submitting;

  const submit = async () => {
    if (!api || !template) return;
    if (missing.length) {
      setShowMissing(true);
      return;
    }
    setSubmitting(true);
    setStepError(null);
    try {
      const created = await api.create({
        templateId: template.templateId,
        name: name.trim() || undefined,
        externalRef: externalRef.trim() || undefined,
        profile: builtProfile,
      });
      router.push(`/bundles/${created.bundleId}?add=1`);
    } catch (err) {
      setStepError(err instanceof Error ? err.message : "Could not create the case pack.");
      setSubmitting(false);
    }
  };

  return (
    <div className={PAGE_CLASS}>
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="New case pack"
          description="Pick the template that matches the case. It sets the documents to collect and the checks DoqSeal runs across them."
          breadcrumbs={[{ label: "Case packs", href: "/bundles" }, { label: "New" }]}
          actions={
            <button type="button" onClick={() => router.push("/bundles")} className={SECONDARY_BUTTON}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          }
        />

        {phase === "disabled" ? (
          <FeatureDisabledNotice />
        ) : phase === "loading" ? (
          <LoadingState label="Loading templates…" />
        ) : phase === "error" ? (
          <ErrorState title="Could not load templates" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            <section className="lg:col-span-3 space-y-6" aria-label="Templates">
              {groups.length > 1 && (
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Line of business">
                  {[{ vertical: "all", label: "All" }, ...groups].map((g) => (
                    <button
                      key={g.vertical}
                      type="button"
                      role="tab"
                      aria-selected={vertical === g.vertical}
                      onClick={() => setVertical(g.vertical)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        vertical === g.vertical
                          ? "bg-[#2563eb] border-[#2563eb] text-white"
                          : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              )}

              {vertical === "all" && ownTemplates.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Your organisation&apos;s templates
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {ownTemplates.map((t) => (
                      <TemplateCard
                        key={t.templateId}
                        title={t.name}
                        description={t.description}
                        meta={t.documentTypeCount ? `${t.documentTypeCount} document types` : undefined}
                        selected={choiceKey(choice) === `t:${t.templateId}`}
                        onSelect={() => void pick({ kind: "template", template: t })}
                      />
                    ))}
                  </div>
                </div>
              )}

              {visibleGroups.map((g) => (
                <div key={g.vertical}>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{g.label}</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {g.items.map((s) => (
                      <TemplateCard
                        key={s.key}
                        title={s.name}
                        description={s.description}
                        meta={`${s.documentTypes.filter((d) => d.required).length} required · ${s.documentTypes.length} document types`}
                        badge={s.templateId ? "In use" : undefined}
                        selected={choiceKey(choice) === `s:${s.key}`}
                        onSelect={() => void pick({ kind: "starter", starter: s })}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {groups.length === 0 && ownTemplates.length === 0 && (
                <EmptyState
                  icon={<FileStack className="w-10 h-10 text-slate-300" />}
                  title="No templates available"
                  message="There are no published templates for this organisation yet."
                />
              )}
            </section>

            <aside className="lg:col-span-2">
              <div className={`${CARD_CLASS} p-5 lg:sticky lg:top-6`}>
                {!choice ? (
                  <div className="text-sm text-slate-500 py-8 text-center">Choose a template to continue.</div>
                ) : preparing ? (
                  <LoadingState label="Preparing template…" />
                ) : !template ? (
                  <ErrorState
                    title="Could not prepare this template"
                    message={stepError}
                    onRetry={() => void pick(choice)}
                  />
                ) : (
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void submit();
                    }}
                  >
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Template</p>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">{template.name}</p>
                      {choice.kind === "starter" && (
                        <DocumentChecklist items={choice.starter.documentTypes} />
                      )}
                    </div>
                    <Field label="Case name" hint="For example the customer or application name.">
                      <input
                        className={INPUT_CLASS}
                        value={name}
                        maxLength={200}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Priya Sharma – home loan"
                      />
                    </Field>
                    <Field label="Reference" hint="Your application, folio or claim number (optional).">
                      <input
                        className={INPUT_CLASS}
                        value={externalRef}
                        maxLength={200}
                        onChange={(e) => setExternalRef(e.target.value)}
                        placeholder="APP-2026-00123"
                      />
                    </Field>

                    {fields.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-zinc-800">
                        <p className="text-xs text-slate-500 pt-2">
                          These details decide which documents are required for this case.
                        </p>
                        {fields.map((f) => (
                          <ProfileInput
                            key={f.key}
                            field={f}
                            value={profile[f.key]}
                            invalid={showMissing && missing.includes(f.key)}
                            onChange={(v) => setProfile((p) => ({ ...p, [f.key]: v }))}
                          />
                        ))}
                      </div>
                    )}

                    {stepError && (
                      <p className="text-sm text-red-600" role="alert">
                        {stepError}
                      </p>
                    )}
                    {showMissing && missing.length > 0 && (
                      <p className="text-sm text-amber-700" role="alert">
                        Fill in the highlighted fields.
                      </p>
                    )}
                    <button type="submit" disabled={!canSubmit} className={`${PRIMARY_BUTTON} w-full`}>
                      {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Create case pack
                    </button>
                    {!name.trim() && !externalRef.trim() && (
                      <p className="text-xs text-slate-400 text-center">Add a case name or a reference.</p>
                    )}
                  </form>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({
  title,
  description,
  meta,
  badge,
  selected,
  onSelect,
}: {
  title: string;
  description?: string;
  meta?: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`text-left rounded-xl border p-4 transition-colors bg-white dark:bg-[#111827] ${
        selected
          ? "border-[#2563eb] ring-1 ring-[#2563eb]"
          : "border-gray-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-slate-900 dark:text-slate-100">{title}</p>
        {selected ? (
          <Check className="w-4 h-4 text-[#2563eb] shrink-0" />
        ) : badge ? (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300 shrink-0">
            {badge}
          </span>
        ) : null}
      </div>
      {description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{description}</p>}
      {meta && <p className="text-[11px] text-slate-400 mt-2">{meta}</p>}
    </button>
  );
}

function DocumentChecklist({ items }: { items: StarterTemplate["documentTypes"] }) {
  return (
    <ul className="mt-3 space-y-1 max-h-48 overflow-y-auto pr-1">
      {items.map((d) => (
        <li key={d.key} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>{d.label}</span>
          <span className="text-slate-400">{d.required ? "Required" : d.conditional ? "Depends on case" : "Optional"}</span>
        </li>
      ))}
    </ul>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

function ProfileInput({
  field,
  value,
  invalid,
  onChange,
}: {
  field: ProfileFieldDef;
  value: string | boolean | undefined;
  invalid: boolean;
  onChange: (v: string | boolean) => void;
}) {
  const cls = `${INPUT_CLASS} ${invalid ? "border-amber-400 ring-1 ring-amber-400" : ""}`;
  const label = `${field.label}${field.required ? "" : " (optional)"}`;
  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
        />
        {field.label}
      </label>
    );
  }
  if (field.type === "select" && field.options?.length) {
    return (
      <Field label={label}>
        <select className={cls} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select…</option>
          {field.options.map((o) => (
            <option key={o} value={o}>
              {o.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </Field>
    );
  }
  return (
    <Field label={label}>
      <input
        className={cls}
        type={field.type === "number" ? "number" : "text"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}
