"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Pencil, X } from "lucide-react";

function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  return String(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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
            rows={2}
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

const RESERVED = new Set([
  "document_type",
  "suggested_title",
  "summary",
  "pointers",
  "pages",
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
  const pointers = Array.isArray(data.pointers)
    ? (data.pointers.filter(isPlainObject) as Array<Record<string, unknown>>)
    : [];
  const pages = Array.isArray(data.pages)
    ? (data.pages.filter(isPlainObject) as Array<Record<string, unknown>>)
    : [];
  const keyEntities = isPlainObject(data.key_entities) ? data.key_entities : null;
  const autoTags = Array.isArray(data.auto_tags)
    ? (data.auto_tags.filter((t) => typeof t === "string") as string[])
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
          {typeof data.document_type === "string" && (
            <p className="text-[11px] text-zinc-500 mt-0.5 capitalize">
              {String(data.document_type).replace(/_/g, " ")}
            </p>
          )}
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

      <div className="px-3.5 py-1">
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
        {typeof data.project_context === "string" && data.project_context && (
          <FieldRow label="Project" value={data.project_context} />
        )}
        {summary && (
          <FieldRow
            label="Summary"
            value={summary}
            confidence={fieldConfidence.summary}
            editable={editing}
            draft={drafts.summary}
            onDraftChange={(v) =>
              setDrafts((prev) => ({ ...prev, summary: v }))
            }
            multiline
          />
        )}

        {keyEntities &&
          Object.entries(keyEntities).map(([key, value]) => {
            const path = `key_entities.${key}`;
            return (
              <FieldRow
                key={path}
                label={formatLabel(key)}
                value={formatPrimitive(value)}
                editable={
                  editing &&
                  (typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean")
                }
                draft={drafts[path]}
                onDraftChange={(v) =>
                  setDrafts((prev) => ({ ...prev, [path]: v }))
                }
              />
            );
          })}

        {scalarEntries.map(([key, value]) => (
          <FieldRow
            key={key}
            label={formatLabel(key)}
            value={formatPrimitive(value)}
            confidence={fieldConfidence[key]}
            editable={editing}
            draft={drafts[key]}
            onDraftChange={(v) =>
              setDrafts((prev) => ({ ...prev, [key]: v }))
            }
          />
        ))}

        {objectEntries.map(([key, value]) => (
          <div key={key} className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-1">
              {formatLabel(key)}
            </p>
            {Object.entries(value as Record<string, unknown>).map(
              ([childKey, childValue]) => (
                <FieldRow
                  key={childKey}
                  label={formatLabel(childKey)}
                  value={
                    Array.isArray(childValue)
                      ? childValue.map(formatPrimitive).join(", ")
                      : isPlainObject(childValue)
                        ? JSON.stringify(childValue)
                        : formatPrimitive(childValue)
                  }
                />
              )
            )}
          </div>
        ))}

        {arrayEntries.map(([key, value]) => {
          const list = value as unknown[];
          return (
            <div key={key} className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {formatLabel(key)}
              </p>
              {list.every(isPlainObject) ? (
                <ul className="space-y-1.5">
                  {(list as Array<Record<string, unknown>>).map((item, index) => {
                    const label = formatPrimitive(
                      item.label ?? item.key ?? `Item ${index + 1}`
                    );
                    const itemValue = formatPrimitive(
                      item.value ?? item.text ?? item.summary
                    );
                    return (
                      <li
                        key={`${label}-${index}`}
                        className="text-sm text-zinc-800 dark:text-zinc-200"
                      >
                        <span className="text-zinc-500">{label}:</span>{" "}
                        {itemValue}
                      </li>
                    );
                  })}
                </ul>
              ) : (
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
              )}
            </div>
          );
        })}

        {pointers.length > 0 && (
          <div className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <p className="text-[11px] font-medium text-zinc-500 mb-1">Pointers</p>
            <ul className="space-y-1">
              {pointers.map((item, index) => (
                <li key={index} className="text-sm text-zinc-800 dark:text-zinc-200">
                  <span className="text-zinc-500">
                    {formatPrimitive(item.label ?? item.key ?? `Item ${index + 1}`)}:
                  </span>{" "}
                  {formatPrimitive(item.value ?? item.text ?? item.summary)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {pages.length > 0 && (
          <div className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
            <p className="text-[11px] font-medium text-zinc-500 mb-1">Pages</p>
            <ul className="space-y-1">
              {pages.map((page, index) => (
                <li key={index} className="text-sm text-zinc-800 dark:text-zinc-200">
                  Page {formatPrimitive(page.page ?? index + 1)}
                  {page.title ? ` · ${formatPrimitive(page.title)}` : ""}
                  {page.summary ? (
                    <span className="block text-xs text-zinc-500 mt-0.5">
                      {formatPrimitive(page.summary)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {typeof data.ocr_preview === "string" && data.ocr_preview && (
          <div className="py-2">
            <p className="text-[11px] font-medium text-zinc-500 mb-1">OCR preview</p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap break-words max-h-40 overflow-y-auto">
              {data.ocr_preview}
            </p>
          </div>
        )}
      </div>

      {autoTags.length > 0 && (
        <div className="px-3.5 py-2.5 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-1.5">
          {autoTags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
