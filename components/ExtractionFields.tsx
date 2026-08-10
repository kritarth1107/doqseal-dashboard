function formatLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function ExtractionFields({
  data,
  fieldConfidence = {},
}: {
  data: Record<string, unknown>;
  fieldConfidence?: Record<string, number>;
}) {
  const entries = Object.entries(data);

  if (!entries.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-500">
        No extracted fields yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Extracted fields</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {entries.map(([key, value]) => {
          const confidence = fieldConfidence[key];
          return (
            <div key={key} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {formatLabel(key)}
                </p>
                {typeof confidence === "number" && (
                  <span className="text-[10px] font-medium text-[#2563eb]">
                    {(confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">
                {formatValue(value)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}