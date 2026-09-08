"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Models often return { value, low_confidence } — unwrap for display. */
function unwrapConfidenceValue(value: unknown): unknown {
  if (!isPlainObject(value)) return value;
  const keys = Object.keys(value);
  if (
    "value" in value &&
    (keys.length === 1 ||
      (keys.length <= 3 &&
        keys.every((k) =>
          ["value", "low_confidence", "confidence", "confidence_score"].includes(k)
        )))
  ) {
    return value.value;
  }
  return value;
}

function formatPrimitive(value: unknown): string {
  const unwrapped = unwrapConfidenceValue(value);
  if (unwrapped === null || unwrapped === undefined || unwrapped === "") {
    return "—";
  }
  if (typeof unwrapped === "boolean") return unwrapped ? "Yes" : "No";
  if (typeof unwrapped === "number") return String(unwrapped);
  if (typeof unwrapped === "string") return unwrapped;
  if (Array.isArray(unwrapped)) {
    const parts = unwrapped
      .map((item) => formatPrimitive(item))
      .filter((part) => part && part !== "—");
    return parts.length ? parts.join(", ") : "—";
  }
  if (isPlainObject(unwrapped)) {
    if (typeof unwrapped.text === "string") return unwrapped.text;
    if (typeof unwrapped.content === "string") return unwrapped.content;
    if (typeof unwrapped.name === "string") return unwrapped.name;
    if (typeof unwrapped.label === "string" && "value" in unwrapped) {
      return `${unwrapped.label}: ${formatPrimitive(unwrapped.value)}`;
    }
    const parts = Object.entries(unwrapped)
      .filter(
        ([k, v]) =>
          !["low_confidence", "confidence", "confidence_score"].includes(k) &&
          v !== null &&
          v !== undefined &&
          v !== ""
      )
      .map(([k, v]) => `${formatLabel(k)}: ${formatPrimitive(v)}`);
    return parts.length ? parts.join(" · ") : "—";
  }
  return String(unwrapped);
}

function confidenceFromValue(
  value: unknown,
  fallback?: number
): number | undefined {
  if (
    isPlainObject(value) &&
    typeof value.low_confidence === "boolean"
  ) {
    return value.low_confidence ? 0.55 : 0.92;
  }
  if (isPlainObject(value) && typeof value.confidence === "number") {
    return value.confidence;
  }
  return fallback;
}

function FieldRow({
  label,
  value,
  confidence,
  editable,
  draft,
  onDraftChange,
  multiline,
}: {
  label: string;
  value: string;
  confidence?: number;
  editable?: boolean;
  draft?: string;
  onDraftChange?: (next: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="grid grid-cols-[minmax(7rem,32%)_1fr] gap-x-3 gap-y-0.5 py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0 items-start">
      <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
          {label}
        </span>
        {typeof confidence === "number" && (
          <span className="text-[10px] text-[#2563eb] shrink-0">
            {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
      {editable ? (
        multiline ? (
          <textarea
            value={draft ?? value}
            onChange={(e) => onDraftChange?.(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#2563eb] resize-y"
          />
        ) : (
          <input
            type="text"
            value={draft ?? value}
            onChange={(e) => onDraftChange?.(e.target.value)}
            className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#2563eb]"
          />
        )
      ) : (
        <p className="text-sm text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap break-words leading-snug">
          {value}
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

function DataTable({
  name,
  headers,
  rows,
}: {
  name?: string | null;
  headers: string[];
  rows: string[][];
}) {
  if (!headers.length && !rows.length) return null;
  const cols =
    headers.length > 0
      ? headers
      : Array.from(
          { length: Math.max(0, ...rows.map((r) => r.length)) },
          (_, i) => `Col ${i + 1}`
        );
  return (
    <div className="mb-3 last:mb-0 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      {name && (
        <p className="px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800">
          {name}
        </p>
      )}
      <table className="min-w-full text-left text-[12px]">
        <thead className="bg-zinc-50 dark:bg-zinc-900/40 text-zinc-500">
          <tr>
            {cols.map((h, i) => (
              <th key={`${h}-${i}`} className="px-2.5 py-1.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className="border-t border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
            >
              {cols.map((_, ci) => (
                <td key={ci} className="px-2.5 py-1.5 align-top whitespace-pre-wrap">
                  {formatPrimitive(row[ci])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function uniformObjectTable(
  list: Array<Record<string, unknown>>
): { headers: string[]; rows: string[][] } | null {
  if (list.length < 2) return null;
  const keys = Object.keys(list[0]);
  if (keys.length < 2) return null;
  const allSame = list.every((item) => {
    const itemKeys = Object.keys(item);
    return (
      itemKeys.length === keys.length &&
      keys.every((k) => itemKeys.includes(k)) &&
      itemKeys.every(
        (k) =>
          typeof item[k] === "string" ||
          typeof item[k] === "number" ||
          typeof item[k] === "boolean" ||
          item[k] === null
      )
    );
  });
  if (!allSame) return null;
  return {
    headers: keys.map(formatLabel),
    rows: list.map((item) => keys.map((k) => formatPrimitive(item[k]))),
  };
}

const RESERVED = new Set([
  "document_type",
  "suggested_title",
  "summary",
  "pointers",
  "pages",
  "sections",
  "tables",
  "fields",
  "key_entities",
  "auto_tags",
  "project_context",
  "project_hint",
  "project_description",
  "source",
  "ocr_preview",
  "confidence_scores",
]);

export function ExtractionFields({
  data,
  fieldConfidence = {},
  documentId,
  organisationId,
  onSaved,
}: {
  data: Record<string, unknown>;
  fieldConfidence?: Record<string, number>;
  documentId?: string;
  organisationId?: string | null;
  onSaved?: (next: Record<string, unknown>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  const suggestedTitle =
    typeof data.suggested_title === "string" ? data.suggested_title : null;
  const summary = typeof data.summary === "string" ? data.summary : null;
  const documentType =
    typeof data.document_type === "string" ? data.document_type : null;
  const keyEntities = isPlainObject(data.key_entities) ? data.key_entities : null;
  const nestedFields = isPlainObject(data.fields) ? data.fields : null;
  const autoTags = Array.isArray(data.auto_tags)
    ? (data.auto_tags.filter((t) => typeof t === "string") as string[])
    : [];
  const pointers = Array.isArray(data.pointers) ? data.pointers : [];
  const sections = Array.isArray(data.sections)
    ? (data.sections.filter(isPlainObject) as Array<Record<string, unknown>>)
    : [];
  const tables = Array.isArray(data.tables)
    ? (data.tables.filter(isPlainObject) as Array<Record<string, unknown>>)
    : [];
  const pages = Array.isArray(data.pages)
    ? (data.pages.filter(isPlainObject) as Array<Record<string, unknown>>)
    : [];

  const scalarEntries = entries.filter(([key, value]) => {
    if (RESERVED.has(key)) return false;
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  });

  const objectEntries = entries.filter(([key, value]) => {
    if (RESERVED.has(key)) return false;
    return isPlainObject(value);
  });

  const arrayEntries = entries.filter(([key, value]) => {
    if (RESERVED.has(key)) return false;
    return Array.isArray(value);
  });

  const layoutHint = useMemo(() => {
    const type = (documentType || "").toLowerCase();
    if (pages.length > 0 || type.includes("deck") || type.includes("presentation")) {
      return "deck";
    }
    if (tables.length > 0) return "tabular";
    if (sections.length > 0) return "sections";
    return "fields";
  }, [documentType, pages.length, tables.length, sections.length]);

  const editableKeys: Array<{ key: string; value: string }> = [];
  if (suggestedTitle) {
    editableKeys.push({ key: "suggested_title", value: suggestedTitle });
  }
  if (summary) {
    editableKeys.push({ key: "summary", value: summary });
  }
  for (const [key, value] of scalarEntries) {
    editableKeys.push({ key, value: formatPrimitive(value) });
  }
  if (keyEntities) {
    for (const [key, value] of Object.entries(keyEntities)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        editableKeys.push({
          key: `key_entities.${key}`,
          value: formatPrimitive(value),
        });
      }
    }
  }

  useEffect(() => {
    if (!editing) return;
    const next: Record<string, string> = {};
    for (const row of editableKeys) {
      next[row.key] = row.value === "—" ? "" : row.value;
    }
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, data]);

  const canEdit = Boolean(documentId && organisationId);

  const handleSave = async () => {
    if (!documentId || !organisationId) return;
    setSaving(true);
    setError(null);
    try {
      const fields: Record<string, unknown> = {};
      for (const row of editableKeys) {
        const next = drafts[row.key];
        if (next === undefined) continue;
        const prev = row.value === "—" ? "" : row.value;
        if (next !== prev) {
          fields[row.key] = next;
        }
      }
      if (!Object.keys(fields).length) {
        setEditing(false);
        return;
      }

      const res = await fetch(`/api/documents/${documentId}/extraction`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-organisation-id": organisationId,
        },
        body: JSON.stringify({ fields }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Save failed");
      const nextData =
        payload.data && typeof payload.data === "object"
          ? (payload.data as Record<string, unknown>)
          : ({ ...data, ...fields } as Record<string, unknown>);
      onSaved?.(nextData);
      setEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!entries.length) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 px-4 py-8 text-center text-sm text-zinc-500">
        No extracted fields yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            Extracted fields
          </p>
          <p className="text-[11px] text-zinc-500 mt-0.5 capitalize">
            {[documentType?.replace(/_/g, " "), layoutHint].filter(Boolean).join(" · ")}
          </p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1.5">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSave()}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8] disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Save
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Pencil className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="px-3.5 py-2 text-xs text-red-600 dark:text-red-400 border-b border-zinc-100 dark:border-zinc-800">
          {error}
        </p>
      )}

      <div className="px-3.5 py-1 max-h-[70vh] overflow-y-auto">
        {suggestedTitle && (
          <FieldRow
            label="Title"
            value={suggestedTitle}
            confidence={fieldConfidence.suggested_title}
            editable={editing}
            draft={drafts.suggested_title}
            onDraftChange={(v) =>
              setDrafts((prev) => ({ ...prev, suggested_title: v }))
            }
          />
        )}

        {summary && (
          <SectionCard title="Summary">
            <FieldRow
              label="Overview"
              value={summary}
              confidence={fieldConfidence.summary}
              editable={editing}
              draft={drafts.summary}
              onDraftChange={(v) =>
                setDrafts((prev) => ({ ...prev, summary: v }))
              }
              multiline
            />
          </SectionCard>
        )}

        {autoTags.length > 0 && (
          <SectionCard title="Tags">
            <div className="flex flex-wrap gap-1.5 pb-1">
              {autoTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </SectionCard>
        )}

        {(keyEntities || nestedFields) && (
          <SectionCard title="Key entities">
            {keyEntities &&
              Object.entries(keyEntities).map(([key, value]) => {
                const path = `key_entities.${key}`;
                const display = formatPrimitive(value);
                const editableScalar =
                  typeof unwrapConfidenceValue(value) === "string" ||
                  typeof unwrapConfidenceValue(value) === "number" ||
                  typeof unwrapConfidenceValue(value) === "boolean";
                return (
                  <FieldRow
                    key={path}
                    label={formatLabel(key)}
                    value={display}
                    confidence={confidenceFromValue(
                      value,
                      fieldConfidence[`key_entities.${key}`]
                    )}
                    editable={editing && editableScalar}
                    draft={drafts[path]}
                    onDraftChange={(v) =>
                      setDrafts((prev) => ({ ...prev, [path]: v }))
                    }
                  />
                );
              })}
            {nestedFields &&
              Object.entries(nestedFields).map(([key, value]) => (
                <FieldRow
                  key={`fields.${key}`}
                  label={formatLabel(key)}
                  value={formatPrimitive(value)}
                  confidence={confidenceFromValue(value)}
                />
              ))}
          </SectionCard>
        )}

        {scalarEntries.length > 0 && (
          <SectionCard title="Fields">
            {scalarEntries.map(([key, value]) => (
              <FieldRow
                key={key}
                label={formatLabel(key)}
                value={formatPrimitive(value)}
                confidence={
                  confidenceFromValue(value, fieldConfidence[key]) ??
                  fieldConfidence[key]
                }
                editable={editing}
                draft={drafts[key]}
                onDraftChange={(v) =>
                  setDrafts((prev) => ({ ...prev, [key]: v }))
                }
              />
            ))}
          </SectionCard>
        )}

        {tables.length > 0 && (
          <SectionCard title="Tables">
            {tables.map((table, index) => {
              const headers = Array.isArray(table.headers)
                ? table.headers.map(formatPrimitive)
                : [];
              const rows = Array.isArray(table.rows)
                ? (table.rows as unknown[]).map((row) =>
                    Array.isArray(row)
                      ? row.map(formatPrimitive)
                      : [formatPrimitive(row)]
                  )
                : [];
              return (
                <DataTable
                  key={index}
                  name={
                    typeof table.name === "string" ? table.name : `Table ${index + 1}`
                  }
                  headers={headers}
                  rows={rows}
                />
              );
            })}
          </SectionCard>
        )}

        {sections.length > 0 && (
          <SectionCard title="Sections">
            <div className="space-y-3">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="rounded-lg bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {formatPrimitive(section.heading ?? `Section ${index + 1}`)}
                  </p>
                  <p className="text-[13px] text-zinc-600 dark:text-zinc-300 mt-1 whitespace-pre-wrap leading-relaxed">
                    {formatPrimitive(section.content)}
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {pages.length > 0 && (
          <SectionCard title={layoutHint === "deck" ? "Slides" : "Pages"}>
            <div className="space-y-2">
              {pages.map((page, index) => {
                const bullets = Array.isArray(page.bullets)
                  ? page.bullets.map(formatPrimitive)
                  : [];
                const points = Array.isArray(page.key_points)
                  ? page.key_points.map(formatPrimitive)
                  : [];
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2"
                  >
                    <p className="text-[11px] font-semibold text-[#2563eb]">
                      {formatPrimitive(page.page ?? index + 1)}.{" "}
                      {formatPrimitive(page.title ?? "Untitled")}
                    </p>
                    {(bullets.length > 0 || points.length > 0) && (
                      <ul className="mt-1.5 space-y-0.5">
                        {[...bullets, ...points].map((item, i) => (
                          <li
                            key={i}
                            className="text-[13px] text-zinc-700 dark:text-zinc-300 flex gap-1.5"
                          >
                            <span className="text-[#2563eb]">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        )}

        {objectEntries.map(([key, value]) => {
          const obj = value as Record<string, unknown>;
          // Single confidence wrapper masquerading as a section
          if (
            "value" in obj &&
            Object.keys(obj).every((k) =>
              ["value", "low_confidence", "confidence"].includes(k)
            )
          ) {
            return (
              <SectionCard key={key} title={formatLabel(key)}>
                <FieldRow
                  label={formatLabel(key)}
                  value={formatPrimitive(obj)}
                  confidence={confidenceFromValue(obj)}
                />
              </SectionCard>
            );
          }
          return (
            <SectionCard key={key} title={formatLabel(key)}>
              {Object.entries(obj).map(([childKey, childValue]) => (
                <FieldRow
                  key={childKey}
                  label={formatLabel(childKey)}
                  value={formatPrimitive(childValue)}
                  confidence={confidenceFromValue(childValue)}
                />
              ))}
            </SectionCard>
          );
        })}

        {arrayEntries.map(([key, value]) => {
          const list = value as unknown[];
          if (list.every(isPlainObject)) {
            const normalizedList = (list as Array<Record<string, unknown>>).map(
              (item) => {
                const next: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(item)) {
                  next[k] = unwrapConfidenceValue(v);
                }
                return next;
              }
            );
            const asTable = uniformObjectTable(normalizedList);
            if (asTable) {
              return (
                <SectionCard key={key} title={formatLabel(key)}>
                  <DataTable
                    headers={asTable.headers}
                    rows={asTable.rows}
                  />
                </SectionCard>
              );
            }
            return (
              <SectionCard key={key} title={formatLabel(key)}>
                <ul className="space-y-2">
                  {normalizedList.map((item, index) => {
                    const title =
                      item.name ??
                      item.drug_name ??
                      item.drug_name_as_written ??
                      item.test_name ??
                      item.label ??
                      item.heading ??
                      item.key ??
                      `Item ${index + 1}`;
                    const details = Object.entries(item)
                      .filter(
                        ([k, v]) =>
                          ![
                            "name",
                            "drug_name",
                            "drug_name_as_written",
                            "test_name",
                            "label",
                            "heading",
                            "key",
                          ].includes(k) &&
                          v !== null &&
                          v !== undefined &&
                          v !== ""
                      )
                      .map(
                        ([k, v]) => `${formatLabel(k)}: ${formatPrimitive(v)}`
                      );
                    return (
                      <li
                        key={`${formatPrimitive(title)}-${index}`}
                        className="text-sm rounded-lg bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-2"
                      >
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {formatPrimitive(title)}
                        </p>
                        {details.length > 0 && (
                          <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed">
                            {details.join(" · ")}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </SectionCard>
            );
          }
          return (
            <SectionCard key={key} title={formatLabel(key)}>
              <ul className="space-y-0.5">
                {list.map((item, index) => (
                  <li
                    key={index}
                    className="text-sm text-zinc-800 dark:text-zinc-200 flex gap-1.5"
                  >
                    <span className="text-[#2563eb]">•</span>
                    {formatPrimitive(item)}
                  </li>
                ))}
              </ul>
            </SectionCard>
          );
        })}

        {pointers.length > 0 && (
          <SectionCard title="Highlights">
            <ul className="space-y-1">
              {pointers.map((item, index) => (
                <li
                  key={index}
                  className="text-[13px] text-zinc-700 dark:text-zinc-300 flex gap-1.5"
                >
                  <span className="text-[#2563eb]">•</span>
                  <span>
                    {isPlainObject(item)
                      ? formatPrimitive(
                          item.text ?? item.summary ?? item.label ?? JSON.stringify(item)
                        )
                      : formatPrimitive(item)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
