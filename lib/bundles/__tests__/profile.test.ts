import { describe, expect, it } from "vitest";
import { buildProfile, groupByVertical, initialProfile } from "../profile";
import type { ProfileFieldDef } from "../types";

const fields: ProfileFieldDef[] = [
  { key: "employment", label: "Employment", type: "select", options: ["salaried", "self_employed"], required: true },
  { key: "amount", label: "Amount", type: "number" },
  { key: "nri", label: "NRI", type: "boolean", default: false },
  { key: "city", label: "City", type: "string", default: "Pune" },
];

describe("profile form", () => {
  it("starts from defaults", () => {
    expect(initialProfile(fields)).toEqual({ employment: "", amount: "", nri: false, city: "Pune" });
  });

  it("builds typed values and reports missing required fields", () => {
    expect(buildProfile(fields, { employment: "", amount: "", nri: true, city: " " })).toEqual({
      profile: { nri: true },
      missing: ["employment"],
    });
    expect(buildProfile(fields, { employment: "salaried", amount: "250000", nri: false, city: "Delhi" })).toEqual({
      profile: { employment: "salaried", amount: 250000, nri: false, city: "Delhi" },
      missing: [],
    });
  });

  it("flags values outside the options and non-numbers", () => {
    const r = buildProfile(fields, { employment: "student", amount: "abc", nri: false, city: "" });
    expect(r.missing).toEqual(["employment", "amount"]);
  });

  it("groups starters by vertical in order", () => {
    const groups = groupByVertical([
      { key: "a", vertical: "lending", verticalLabel: "Lending" },
      { key: "b", vertical: "insurance", verticalLabel: "Insurance" },
      { key: "c", vertical: "lending", verticalLabel: "Lending" },
    ]);
    expect(groups.map((g) => [g.label, g.items.map((i) => i.key)])).toEqual([
      ["Lending", ["a", "c"]],
      ["Insurance", ["b"]],
    ]);
  });
});
