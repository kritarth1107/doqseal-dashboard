import type { StarterTemplate, TemplateListItem } from "./types";

/** Categories shown as chips on the new case pack page, in display order. */
export const CATALOG_CATEGORIES = [
  { key: "all", label: "All" },
  { key: "diagnostics", label: "Diagnostics" },
  { key: "lending", label: "Lending" },
  { key: "mutual_funds", label: "Mutual funds" },
  { key: "insurance", label: "Insurance" },
  { key: "vendor_onboarding", label: "Vendor onboarding" },
  { key: "yours", label: "Your templates" },
] as const;

export type CatalogCategory = { key: string; label: string };

export type CatalogDocument = { key: string; label: string; requirement: "required" | "conditional" | "optional" };

export type CatalogEntry = {
  /** Stable id: `s:<starter key>` or `t:<template id>`. */
  id: string;
  kind: "starter" | "template";
  category: string;
  categoryLabel: string;
  name: string;
  description: string;
  requiredCount: number;
  totalCount: number;
  documents: CatalogDocument[];
  inUse: boolean;
  starter?: StarterTemplate;
  template?: TemplateListItem;
};

function requirementOf(d: { required?: boolean | string; conditional?: boolean }): CatalogDocument["requirement"] {
  if (d.required === true) return "required";
  if (d.conditional || typeof d.required === "string") return "conditional";
  return "optional";
}

export function toCatalogDocuments(
  docs: Array<{ key: string; label: string; required?: boolean | string; conditional?: boolean }> | undefined
): CatalogDocument[] {
  return (docs ?? []).map((d) => ({ key: d.key, label: d.label, requirement: requirementOf(d) }));
}

/**
 * Starters plus the organisation's own templates. Templates that were copied
 * from a starter show up as that starter (marked in use), and example
 * templates are left out, so nothing appears twice.
 */
export function buildCatalog(starters: StarterTemplate[], templates: TemplateListItem[]): CatalogEntry[] {
  const fromStarters = new Set(starters.map((s) => s.templateId).filter(Boolean) as string[]);
  const starterEntries: CatalogEntry[] = starters.map((s) => {
    const documents = toCatalogDocuments(s.documentTypes);
    return {
      id: `s:${s.key}`,
      kind: "starter",
      category: s.vertical,
      categoryLabel: s.verticalLabel,
      name: s.name,
      description: s.description,
      requiredCount: documents.filter((d) => d.requirement === "required").length,
      totalCount: documents.length,
      documents,
      inUse: Boolean(s.templateId),
      starter: s,
    };
  });
  const own: CatalogEntry[] = templates
    .filter((t) => !fromStarters.has(t.templateId) && !t.isExample)
    .map((t) => ({
      id: `t:${t.templateId}`,
      kind: "template",
      category: "yours",
      categoryLabel: "Your templates",
      name: t.name,
      description: t.description ?? "",
      requiredCount: 0,
      totalCount: t.documentTypeCount ?? 0,
      documents: [],
      inUse: true,
      template: t,
    }));
  return [...own, ...starterEntries];
}

export function normaliseQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function matchesQuery(entry: CatalogEntry, query: string): boolean {
  const q = normaliseQuery(query);
  if (!q) return true;
  const haystack = [entry.name, entry.description, entry.categoryLabel, ...entry.documents.map((d) => d.label)]
    .join(" \n ")
    .toLowerCase();
  return q.split(" ").every((word) => haystack.includes(word));
}

export function filterCatalog(entries: CatalogEntry[], category: string, query: string): CatalogEntry[] {
  return entries.filter((e) => (category === "all" || e.category === category) && matchesQuery(e, query));
}

/**
 * Chips to show: the fixed list, plus any extra line of business the backend
 * sends that the fixed list does not know about (placed before "Your templates").
 */
export function catalogCategories(entries: CatalogEntry[]): CatalogCategory[] {
  const known = new Set<string>(CATALOG_CATEGORIES.map((c) => c.key));
  const extra: CatalogCategory[] = [];
  for (const e of entries) {
    if (!known.has(e.category)) {
      known.add(e.category);
      extra.push({ key: e.category, label: e.categoryLabel });
    }
  }
  const base: CatalogCategory[] = CATALOG_CATEGORIES.map((c) => ({ key: c.key, label: c.label }));
  return [...base.slice(0, -1), ...extra, base[base.length - 1]];
}

/** Matches per chip for the current search, so counts follow what is typed. */
export function categoryCounts(entries: CatalogEntry[], query: string): Record<string, number> {
  const counts: Record<string, number> = { all: 0 };
  for (const e of entries) {
    if (!matchesQuery(e, query)) continue;
    counts.all += 1;
    counts[e.category] = (counts[e.category] ?? 0) + 1;
  }
  return counts;
}

export function documentSummary(entry: Pick<CatalogEntry, "kind" | "requiredCount" | "totalCount">): string {
  const docs = `${entry.totalCount} document${entry.totalCount === 1 ? "" : "s"}`;
  if (entry.kind === "template" && entry.requiredCount === 0) return entry.totalCount ? docs : "Documents set in the template";
  return `${entry.requiredCount} required · ${docs}`;
}
