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

function FieldCard({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string;
  confidence?: number;
}) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-800/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
          {label}
        </p>
        {typeof confidence === "number" && (
          <span className="text-[10px] font-medium text-[#2563eb]">
            {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-900 dark:text-slate-100 whitespace-pre-wrap break-words">
        {value}
      </p>
    </div>
  );
}

function PointerList({
  items,
}: {
  items: Array<Record<string, unknown>>;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const label = formatPrimitive(item.label ?? item.key ?? `Item ${index + 1}`);
        const value = formatPrimitive(item.value ?? item.text ?? item.summary);
        const page = item.page;
        return (
          <li
            key={`${label}-${index}`}
            className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-800/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                {label}
              </p>
              {page != null && page !== "" && (
                <span className="text-[10px] text-gray-400 dark:text-slate-500">
                  p.{String(page)}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-900 dark:text-slate-100 whitespace-pre-wrap break-words">
              {value}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function ExtractionFields({
  data,
  fieldConfidence = {},
}: {
  data: Record<string, unknown>;
  fieldConfidence?: Record<string, number>;
}) {
  const entries = Object.entries(data).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  if (!entries.length) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 rounded-2xl p-8 text-center text-sm text-gray-500 dark:text-slate-400">
        No extracted fields yet.
      </div>
    );
  }

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
    ? data.auto_tags.filter((t) => typeof t === "string") as string[]
    : [];

  const reserved = new Set([
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

  const scalarEntries = entries.filter(([key, value]) => {
    if (reserved.has(key)) return false;
    return (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  });

  const objectEntries = entries.filter(([key, value]) => {
    if (reserved.has(key)) return false;
    return isPlainObject(value);
  });

  const arrayEntries = entries.filter(([key, value]) => {
    if (reserved.has(key)) return false;
    return Array.isArray(value);
  });

  return (
    <div className="space-y-4">
      {(suggestedTitle || summary) && (
        <Section title="Document overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suggestedTitle && (
              <FieldCard
                label="Title"
                value={suggestedTitle}
                confidence={fieldConfidence.suggested_title}
              />
            )}
            {typeof data.project_context === "string" && (
              <FieldCard label="Project" value={data.project_context} />
            )}
            {summary && (
              <div className="sm:col-span-2">
                <FieldCard
                  label="Summary"
                  value={summary}
                  confidence={fieldConfidence.summary}
                />
              </div>
            )}
          </div>
        </Section>
      )}

      {keyEntities && Object.keys(keyEntities).length > 0 && (
        <Section title="Key entities">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(keyEntities).map(([key, value]) => (
              <FieldCard
                key={key}
                label={formatLabel(key)}
                value={formatPrimitive(value)}
              />
            ))}
          </div>
        </Section>
      )}

      {pointers.length > 0 && (
        <Section title="Extracted pointers">
          <PointerList items={pointers} />
        </Section>
      )}

      {pages.length > 0 && (
        <Section title="Pages">
          <div className="space-y-2">
            {pages.map((page, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-slate-800/40 p-3"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  Page {formatPrimitive(page.page ?? index + 1)}
                  {page.title ? ` · ${formatPrimitive(page.title)}` : ""}
                </p>
                {page.summary != null && page.summary !== "" && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
                    {formatPrimitive(page.summary)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {scalarEntries.length > 0 && (
        <Section title="Extracted fields">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scalarEntries.map(([key, value]) => (
              <FieldCard
                key={key}
                label={formatLabel(key)}
                value={formatPrimitive(value)}
                confidence={fieldConfidence[key]}
              />
            ))}
          </div>
        </Section>
      )}

      {objectEntries.map(([key, value]) => (
        <Section key={key} title={formatLabel(key)}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(value as Record<string, unknown>).map(
              ([childKey, childValue]) => (
                <FieldCard
                  key={childKey}
                  label={formatLabel(childKey)}
                  value={
                    Array.isArray(childValue)
                      ? childValue.map(formatPrimitive).join(", ")
                      : isPlainObject(childValue)
                        ? JSON.stringify(childValue, null, 2)
                        : formatPrimitive(childValue)
                  }
                />
              )
            )}
          </div>
        </Section>
      ))}

      {arrayEntries.map(([key, value]) => {
        const list = value as unknown[];
        if (list.every(isPlainObject)) {
          return (
            <Section key={key} title={formatLabel(key)}>
              <PointerList items={list as Array<Record<string, unknown>>} />
            </Section>
          );
        }
        return (
          <Section key={key} title={formatLabel(key)}>
            <ul className="space-y-1">
              {list.map((item, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-900 dark:text-slate-100 flex items-start gap-2"
                >
                  <span className="text-[#2563eb] mt-0.5">•</span>
                  {formatPrimitive(item)}
                </li>
              ))}
            </ul>
          </Section>
        );
      })}

      {typeof data.ocr_preview === "string" && data.ocr_preview && (
        <Section title="OCR preview">
          <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap break-words">
            {data.ocr_preview}
          </p>
        </Section>
      )}

      {autoTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {autoTags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
