"use client";

import type { ReactNode } from "react";

function formatInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-gray-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={i} className="text-gray-700 not-italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function isTableSeparator(line: string): boolean {
  return /^\|[\s\-:|]+\|$/.test(line.trim());
}

function parseTableRow(line: string): string[] {
  return line
    .trim()
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim());
}

export function ChatMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (isTableRow(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim())) {
      const header = parseTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && isTableRow(lines[i].trim())) {
        rows.push(parseTableRow(lines[i].trim()));
        i += 1;
      }
      blocks.push(
        <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {header.map((cell, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                  >
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="border-b border-gray-100 last:border-0">
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-3 py-2.5 text-gray-800 align-top">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      blocks.push(
        <p key={`li-${i}`} className="flex gap-2.5 pl-0.5 text-[15px] leading-relaxed text-gray-800">
          <span className="text-[#2563eb] shrink-0 mt-0.5">•</span>
          <span>{formatInline(trimmed.slice(2))}</span>
        </p>
      );
      i += 1;
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      blocks.push(
        <p key={`ol-${i}`} className="text-[15px] leading-relaxed text-gray-800 pl-0.5">
          {formatInline(trimmed)}
        </p>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.slice(2, -2).includes("**")) {
      blocks.push(
        <p key={`h-${i}`} className="text-[15px] font-semibold text-gray-900 mt-4 first:mt-0">
          {trimmed.slice(2, -2)}
        </p>
      );
      i += 1;
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className="text-[15px] leading-relaxed text-gray-800">
        {formatInline(trimmed)}
      </p>
    );
    i += 1;
  }

  return <div className="space-y-1.5">{blocks}</div>;
}
