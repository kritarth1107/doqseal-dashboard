import { readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

/**
 * Product copy rules for case packs: no approve/reject wording, no accuracy
 * figures and no certification claims anywhere in these screens.
 */
const ROOTS = ["components/bundles", "app/(auth-required)/bundles", "lib/bundles"];

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return name === "__tests__" ? [] : files(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

const sources = ROOTS.flatMap((root) => files(path.resolve(__dirname, "../../..", root)));

describe("case pack copy", () => {
  it("covers the case pack sources", () => {
    expect(sources.length).toBeGreaterThan(10);
  });

  it.each(sources.map((f) => [path.relative(process.cwd(), f), f]))("%s follows the wording rules", (_rel, file) => {
    const text = readFileSync(file, "utf8");
    expect(text).not.toMatch(/\bapprov/i);
    expect(text).not.toMatch(/\breject/i);
    expect(text).not.toMatch(/certif|ISO\s?27001|SOC\s?2|HIPAA/i);
    // Percentages in text (Tailwind classes like w-[50%] are not copy).
    const copyPercent = text.match(/[>"'`\s]\d{1,3}(\.\d+)?\s?%/g) ?? [];
    expect(copyPercent).toEqual([]);
    expect(text).not.toMatch(/accura/i);
  });
});
