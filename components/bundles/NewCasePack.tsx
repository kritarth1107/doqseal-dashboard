"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  FileStack,
  FlaskConical,
  Landmark,
  LayoutTemplate,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  EmptyState,
  ErrorState,
  FeatureDisabledNotice,
  INPUT_CLASS,
  LoadingState,
  PAGE_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  CARD_CLASS,
} from "@/components/bundles/ui";
import { isFeatureDisabled } from "@/lib/bundles/api";
import { useBundleApi } from "@/lib/bundles/hooks";
import {
  buildCatalog,
  catalogCategories,
  categoryCounts,
  documentSummary,
  filterCatalog,
  type CatalogDocument,
  type CatalogEntry,
} from "@/lib/bundles/catalog";
import { buildProfile, initialProfile, type ProfileDraft } from "@/lib/bundles/profile";
import type { ProfileFieldDef, StarterTemplate, TemplateDetail, TemplateListItem } from "@/lib/bundles/types";

type Look = { icon: LucideIcon; tile: string; bar: string };

const LOOKS: Record<string, Look> = {
  diagnostics: {
    icon: FlaskConical,
    tile: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300",
    bar: "bg-teal-500",
  },
  lending: {
    icon: Landmark,
    tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
    bar: "bg-blue-500",
  },
  mutual_funds: {
    icon: TrendingUp,
    tile: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
    bar: "bg-violet-500",
  },
  insurance: {
    icon: ShieldCheck,
    tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
    bar: "bg-emerald-500",
  },
  vendor_onboarding: {
    icon: Truck,
    tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
    bar: "bg-amber-500",
  },
  yours: {
    icon: LayoutTemplate,
    tile: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300",
    bar: "bg-slate-400",
  },
};

const FALLBACK_LOOK: Look = {
  icon: FileStack,
  tile: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300",
  bar: "bg-slate-400",
};

export function lookFor(category: string): Look {
  return LOOKS[category] ?? FALLBACK_LOOK;
}

const CHIP_LIMIT = 3;

type PackDocument = {
  key: string;
  label: string;
  requirement: CatalogDocument["requirement"];
  requiredRaw?: boolean | string;
};

function requirementFrom(doc: { required?: boolean | string; conditional?: boolean }): PackDocument["requirement"] {
  if (doc.required === true) return "required";
  if (doc.conditional || typeof doc.required === "string") return "conditional";
  return "optional";
}

export function documentKeyFromLabel(label: string, taken: string[]): string {
  const cleaned = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  let base = cleaned && /^[a-z]/.test(cleaned) ? cleaned : `doc_${cleaned || "type"}`;
  base = base.slice(0, 48);
  const used = new Set(taken);
  let key = base;
  let n = 2;
  while (used.has(key)) key = `${base.slice(0, 44)}_${n++}`;
  return key;
}

function fromTemplateDocuments(
  docs: Array<{ key: string; label: string; required?: boolean | string; conditional?: boolean }> | undefined
): PackDocument[] {
  return (docs ?? []).map((doc) => ({
    key: doc.key,
    label: doc.label,
    requirement: requirementFrom(doc),
    requiredRaw: doc.required,
  }));
}

function sameDocuments(left: PackDocument[], right: PackDocument[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((doc, index) => {
    const other = right[index];
    return doc.key === other.key && doc.label.trim() === other.label.trim() && doc.requirement === other.requirement;
  });
}

function toDraftDocuments(docs: PackDocument[]) {
  return docs.map((doc) => ({
    key: doc.key,
    label: doc.label.trim(),
    required:
      doc.requirement === "required"
        ? true
        : doc.requirement === "conditional" && typeof doc.requiredRaw === "string"
          ? doc.requiredRaw
          : false,
    minCount: 1,
    maxCount: 1,
  }));
}

export function NewCasePack() {
  const api = useBundleApi();
  const router = useRouter();

  const [phase, setPhase] = useState<"loading" | "ready" | "error" | "disabled">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [starters, setStarters] = useState<StarterTemplate[]>([]);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [template, setTemplate] = useState<TemplateDetail | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const pickToken = useRef(0);

  const [name, setName] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [profile, setProfile] = useState<ProfileDraft>({});
  const [documents, setDocuments] = useState<PackDocument[]>([]);
  const [baseline, setBaseline] = useState<PackDocument[] | null>(null);
  const [draftLabel, setDraftLabel] = useState("");
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
        setLoadError(null);
        setPhase("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        if (isFeatureDisabled(err)) return setPhase("disabled");
        setLoadError(err instanceof Error ? err.message : "Could not load templates.");
        setStarters([]);
        setTemplates([]);
        setPhase("ready");
      });
    return () => {
      cancelled = true;
    };
  }, [api, reloadKey]);

  const catalog = useMemo(() => buildCatalog(starters, templates), [starters, templates]);
  const categories = useMemo(() => catalogCategories(catalog), [catalog]);
  const counts = useMemo(() => categoryCounts(catalog, query), [catalog, query]);
  const visible = useMemo(() => filterCatalog(catalog, category, query), [catalog, category, query]);

  const fields: ProfileFieldDef[] = template?.draft?.profileFields ?? [];

  const applyDetail = (detail: TemplateDetail) => {
    const next = fromTemplateDocuments(detail.draft?.documentTypes);
    setTemplate(detail);
    setDocuments(next);
    setBaseline(next.map((doc) => ({ ...doc })));
    setProfile(initialProfile(detail.draft?.profileFields ?? []));
  };

  const pick = useCallback(
    async (entry: CatalogEntry) => {
      if (!api) return;
      const token = ++pickToken.current;
      setSelected(entry);
      setTemplate(null);
      setStepError(null);
      setShowMissing(false);
      setPreparing(true);
      try {
        const detail =
          entry.kind === "starter" && entry.starter
            ? await api.adoptStarter(entry.starter.key)
            : await api.template(entry.template!.templateId);
        if (token !== pickToken.current) return;
        applyDetail(detail);
      } catch (err) {
        if (token !== pickToken.current) return;
        setStepError(err instanceof Error ? err.message : "Could not prepare this template.");
      } finally {
        if (token === pickToken.current) setPreparing(false);
      }
    },
    [api]
  );

  const clearTemplate = useCallback(() => {
    pickToken.current += 1;
    setSelected(null);
    setTemplate(null);
    setDocuments([]);
    setBaseline(null);
    setProfile({});
    setPreparing(false);
    setStepError(null);
    setShowMissing(false);
  }, []);

  const addDocument = () => {
    const label = draftLabel.trim();
    if (!label) return;
    setDocuments((current) => [
      ...current,
      { key: documentKeyFromLabel(label, current.map((doc) => doc.key)), label, requirement: "required" },
    ]);
    setDraftLabel("");
  };

  const { profile: builtProfile, missing } = buildProfile(fields, profile);
  const hasIdentity = Boolean(name.trim() || externalRef.trim());
  const documentsReady = documents.length > 0 && documents.every((doc) => doc.label.trim());
  const templateReady = !selected || Boolean(template);
  const canSubmit = templateReady && documentsReady && hasIdentity && !submitting && !preparing;

  const submit = async () => {
    if (!api || !canSubmit) return;
    if (missing.length) {
      setShowMissing(true);
      return;
    }
    setSubmitting(true);
    setStepError(null);
    try {
      const unchanged = Boolean(template && baseline && sameDocuments(documents, baseline));
      let templateId = template?.templateId;
      if (!unchanged || !templateId) {
        const packName = (name.trim() || template?.name || "Custom case pack").slice(0, 200);
        const createdTemplate = await api.createTemplate({
          name: packName,
          description: selected ? `Customised from ${selected.name}` : "Custom case pack",
          draft: {
            ...(template?.draft ?? {}),
            documentTypes: toDraftDocuments(documents),
          },
        });
        await api.publishTemplate(createdTemplate.templateId);
        templateId = createdTemplate.templateId;
      }
      const created = await api.create({
        templateId,
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

  const hasCatalog = catalog.length > 0;

  return (
    <div className={PAGE_CLASS}>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="New case pack"
          description="Name the case and list the documents you need. A template is optional — start from one when it already fits, then change anything."
          breadcrumbs={[{ label: "Case packs", href: "/bundles" }, { label: "New" }]}
          actions={
            <button type="button" onClick={() => router.push("/bundles")} className={SECONDARY_BUTTON}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          }
        />

        {phase === "disabled" ? (
          <FeatureDisabledNotice />
        ) : (
          <div className="flex flex-col xl:flex-row gap-8 items-start">
            <form
              aria-label="Your case pack"
              className={`${CARD_CLASS} w-full xl:w-[440px] xl:sticky xl:top-6 shrink-0`}
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <div className="px-5 py-5 space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Your case pack</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Add the documents this case needs. You can start from a blank list.
                  </p>
                </div>

                {selected && (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/70 dark:border-blue-500/20 dark:bg-blue-500/10 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                        Started from a template
                      </p>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{selected.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Edit the documents below. This case keeps your changes.</p>
                    </div>
                    <button type="button" onClick={clearTemplate} className={SECONDARY_BUTTON}>
                      Clear
                    </button>
                  </div>
                )}

                <div className="space-y-3">
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
                </div>

                {preparing && <LoadingState label="Applying template…" />}
                {selected && !preparing && !template && stepError && (
                  <ErrorState
                    title="Could not prepare this template"
                    message={stepError}
                    onRetry={() => void pick(selected)}
                  />
                )}

                {fields.length > 0 && (
                  <fieldset className="space-y-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <legend className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-4">
                      Case details
                    </legend>
                    <p className="text-xs text-slate-500">These details decide which documents are required for this case.</p>
                    {fields.map((f) => (
                      <ProfileInput
                        key={f.key}
                        field={f}
                        value={profile[f.key]}
                        invalid={showMissing && missing.includes(f.key)}
                        onChange={(v) => setProfile((p) => ({ ...p, [f.key]: v }))}
                      />
                    ))}
                  </fieldset>
                )}

                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Documents to collect</h3>
                  {documents.length === 0 ? (
                    <p className="text-sm text-slate-500">Add at least one document, or start from a template.</p>
                  ) : (
                    <ul className="space-y-2">
                      {documents.map((doc) => (
                        <li key={doc.key} className="flex items-center gap-2">
                          <input
                            aria-label={`Document name for ${doc.label || "untitled"}`}
                            className={INPUT_CLASS}
                            value={doc.label}
                            maxLength={120}
                            onChange={(e) =>
                              setDocuments((current) =>
                                current.map((item) => (item.key === doc.key ? { ...item, label: e.target.value } : item))
                              )
                            }
                          />
                          <select
                            aria-label={`Requirement for ${doc.label || "document"}`}
                            className={`${INPUT_CLASS} w-36 shrink-0`}
                            value={doc.requirement}
                            onChange={(e) =>
                              setDocuments((current) =>
                                current.map((item) =>
                                  item.key === doc.key
                                    ? { ...item, requirement: e.target.value as PackDocument["requirement"] }
                                    : item
                                )
                              )
                            }
                          >
                            <option value="required">Required</option>
                            <option value="optional">Optional</option>
                            {doc.requirement === "conditional" && <option value="conditional">Depends on case</option>}
                          </select>
                          <button
                            type="button"
                            aria-label={`Remove ${doc.label || "document"}`}
                            onClick={() => setDocuments((current) => current.filter((item) => item.key !== doc.key))}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2">
                    <input
                      aria-label="New document"
                      className={INPUT_CLASS}
                      value={draftLabel}
                      maxLength={120}
                      placeholder="PAN card, bank statement…"
                      onChange={(e) => setDraftLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addDocument();
                        }
                      }}
                    />
                    <button type="button" onClick={addDocument} disabled={!draftLabel.trim()} className={SECONDARY_BUTTON}>
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-gray-100 dark:border-zinc-800 space-y-2">
                {stepError && !(selected && !preparing && !template) && (
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
                {!hasIdentity ? (
                  <p className="text-xs text-slate-400 text-center">Add a case name or a reference.</p>
                ) : !documentsReady ? (
                  <p className="text-xs text-slate-400 text-center">Add at least one document.</p>
                ) : null}
              </div>
            </form>

            <section className="flex-1 min-w-0 w-full" aria-label="Templates" aria-busy={phase === "loading"}>
              <div className="mb-4">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Start from a template</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Optional. Pick one if it already matches this case, then edit the documents in your case pack.
                </p>
              </div>
              <div className="flex flex-col gap-3 mb-6">
                <div className="relative max-w-xl">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    aria-label="Search templates"
                    placeholder="Search templates or document types"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape" && query) {
                        e.stopPropagation();
                        setQuery("");
                      }
                    }}
                    disabled={phase === "loading"}
                    className={`${INPUT_CLASS} pl-9`}
                  />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by line of business">
                  {categories.map((c) => {
                    const active = category === c.key;
                    const count = phase === "ready" ? (counts[c.key] ?? 0) : null;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        aria-pressed={active}
                        disabled={phase === "loading"}
                        onClick={() => setCategory(c.key)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-1 disabled:opacity-60 ${
                          active
                            ? "bg-[#2563eb] border-[#2563eb] text-white"
                            : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-zinc-600"
                        } ${count === 0 && !active ? "opacity-60" : ""}`}
                      >
                        {c.label}
                        {count !== null && (
                          <span
                            className={`min-w-[1.25rem] px-1.5 py-px rounded-full text-[10px] tabular-nums ${
                              active ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {phase === "loading" ? (
                <CardSkeletons />
              ) : loadError ? (
                <ErrorState title="Could not load templates" message={loadError} onRetry={() => setReloadKey((k) => k + 1)} />
              ) : !hasCatalog ? (
                <EmptyState
                  icon={<FileStack className="w-10 h-10 text-slate-300" />}
                  title="No templates available"
                  message="There are no published templates for this organisation yet. You can still build this case pack yourself."
                />
              ) : visible.length === 0 ? (
                <EmptyState
                  icon={<Search className="w-10 h-10 text-slate-300" />}
                  title="No templates match"
                  message={
                    query.trim()
                      ? `Nothing matches “${query.trim()}”${category !== "all" ? " in this category" : ""}.`
                      : "There are no templates in this category yet."
                  }
                  action={
                    <button
                      type="button"
                      className={SECONDARY_BUTTON}
                      onClick={() => {
                        setQuery("");
                        setCategory("all");
                      }}
                    >
                      Show all templates
                    </button>
                  }
                />
              ) : (
                <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  {visible.map((entry) => (
                    <li key={entry.id} className="flex">
                      <TemplateCard
                        entry={entry}
                        selected={selected?.id === entry.id}
                        onSelect={() => void pick(entry)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ entry, selected, onSelect }: { entry: CatalogEntry; selected: boolean; onSelect: () => void }) {
  const look = lookFor(entry.category);
  const Icon = look.icon;
  const chips = entry.documents.slice(0, CHIP_LIMIT);
  const more = entry.documents.length - chips.length;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      data-testid="template-card"
      className={`group relative flex w-full flex-col text-left rounded-2xl border bg-white dark:bg-[#111827] p-4 pl-5 overflow-hidden shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2 ${
        selected
          ? "border-[#2563eb] ring-1 ring-[#2563eb] shadow-md"
          : "border-gray-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-600 hover:shadow-md"
      }`}
    >
      <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${look.bar}`} />
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${look.tile}`}>
          <Icon className="w-5 h-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">{entry.name}</p>
            {selected ? (
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-white">
                <Check className="w-3 h-3" aria-hidden />
              </span>
            ) : entry.inUse && entry.kind === "starter" ? (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-300 shrink-0">
                In use
              </span>
            ) : null}
          </div>
          <p className="text-[11px] font-medium text-slate-400 mt-0.5">{entry.categoryLabel}</p>
        </div>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-1" title={entry.description || undefined}>
        {entry.description || "No description"}
      </p>
      <div className="mt-auto pt-3">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">{documentSummary(entry)}</p>
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {chips.map((d) => (
              <span
                key={d.key}
                className="max-w-[10rem] truncate text-[11px] px-2 py-0.5 rounded-md bg-slate-50 dark:bg-zinc-800/70 border border-slate-200/70 dark:border-zinc-700 text-slate-600 dark:text-slate-300"
              >
                {d.label}
              </span>
            ))}
            {more > 0 && <span className="text-[11px] px-1.5 py-0.5 text-slate-400">+{more} more</span>}
          </div>
        )}
      </div>
    </button>
  );
}

function CardSkeletons() {
  return (
    <div role="status" aria-label="Loading templates">
      <ul className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#111827] p-4 animate-pulse">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-zinc-800" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 w-2/3 rounded bg-slate-100 dark:bg-zinc-800" />
                <div className="h-2.5 w-1/3 rounded bg-slate-100 dark:bg-zinc-800" />
              </div>
            </div>
            <div className="h-3 w-full rounded bg-slate-100 dark:bg-zinc-800 mt-4" />
            <div className="flex gap-1.5 mt-4">
              <div className="h-4 w-16 rounded bg-slate-100 dark:bg-zinc-800" />
              <div className="h-4 w-20 rounded bg-slate-100 dark:bg-zinc-800" />
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only">Loading templates…</span>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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
        <select
          className={cls}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
        >
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
        aria-invalid={invalid || undefined}
      />
    </Field>
  );
}
