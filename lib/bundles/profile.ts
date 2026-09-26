import type { ProfileFieldDef } from "./types";

export type ProfileDraft = Record<string, string | boolean>;

/** Initial form values for a template's case profile fields. */
export function initialProfile(fields: ProfileFieldDef[]): ProfileDraft {
  const out: ProfileDraft = {};
  for (const f of fields) {
    if (f.type === "boolean") out[f.key] = f.default === true;
    else out[f.key] = f.default === undefined || f.default === null ? "" : String(f.default);
  }
  return out;
}

/**
 * Converts form values to the profile object the backend stores. Empty
 * optional values are left out; numbers are parsed. Returns the keys of
 * required fields that are still empty or invalid.
 */
export function buildProfile(
  fields: ProfileFieldDef[],
  draft: ProfileDraft
): { profile: Record<string, string | number | boolean>; missing: string[] } {
  const profile: Record<string, string | number | boolean> = {};
  const missing: string[] = [];
  for (const f of fields) {
    const raw = draft[f.key];
    if (f.type === "boolean") {
      profile[f.key] = raw === true;
      continue;
    }
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) {
      if (f.required) missing.push(f.key);
      continue;
    }
    if (f.type === "number") {
      const n = Number(text);
      if (!Number.isFinite(n)) {
        missing.push(f.key);
        continue;
      }
      profile[f.key] = n;
    } else if (f.type === "select" && f.options?.length && !f.options.includes(text)) {
      missing.push(f.key);
    } else {
      profile[f.key] = text;
    }
  }
  return { profile, missing };
}

/** Groups starter templates by vertical, keeping the backend's order. */
export function groupByVertical<T extends { vertical: string; verticalLabel: string }>(items: T[]) {
  const groups: Array<{ vertical: string; label: string; items: T[] }> = [];
  for (const item of items) {
    let g = groups.find((x) => x.vertical === item.vertical);
    if (!g) {
      g = { vertical: item.vertical, label: item.verticalLabel, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  }
  return groups;
}
