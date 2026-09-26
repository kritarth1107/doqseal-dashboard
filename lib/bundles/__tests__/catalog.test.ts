import { describe, expect, it } from "vitest";
import {
  buildCatalog,
  catalogCategories,
  categoryCounts,
  documentSummary,
  filterCatalog,
  matchesQuery,
} from "../catalog";
import type { StarterTemplate, TemplateListItem } from "../types";

function starter(overrides: Partial<StarterTemplate> = {}): StarterTemplate {
  return {
    key: "home_loan",
    vertical: "lending",
    verticalLabel: "Lending",
    name: "Home loan",
    description: "Salaried home loan application",
    documentTypes: [
      { key: "pan_card", label: "PAN card", required: true, conditional: false, minCount: 1 },
      { key: "bank_statement", label: "Bank statement", required: true, conditional: false, minCount: 1 },
      { key: "form_16", label: "Form 16", required: false, conditional: true, minCount: 1 },
      { key: "photo", label: "Photograph", required: false, conditional: false, minCount: 1 },
    ],
    profileFieldCount: 1,
    ruleCount: 3,
    templateId: null,
    templateStatus: null,
    ...overrides,
  };
}

const own = (overrides: Partial<TemplateListItem> = {}): TemplateListItem => ({
  templateId: "tpl-own",
  name: "Dealer onboarding",
  description: "Our dealer checklist",
  status: "published",
  latestVersion: 2,
  documentTypeCount: 5,
  ...overrides,
});

describe("buildCatalog", () => {
  it("maps starters with document counts and requirement levels", () => {
    const [entry] = buildCatalog([starter()], []);
    expect(entry).toMatchObject({ id: "s:home_loan", kind: "starter", category: "lending", requiredCount: 2, totalCount: 4 });
    expect(entry.documents.map((d) => d.requirement)).toEqual(["required", "required", "conditional", "optional"]);
  });

  it("lists own templates under Your templates, without starter copies or examples", () => {
    const entries = buildCatalog(
      [starter({ templateId: "tpl-copy" })],
      [own(), own({ templateId: "tpl-copy", name: "Copy" }), own({ templateId: "tpl-ex", isExample: true })]
    );
    expect(entries.map((e) => e.id)).toEqual(["t:tpl-own", "s:home_loan"]);
    expect(entries[0]).toMatchObject({ category: "yours", totalCount: 5 });
    expect(entries[1].inUse).toBe(true);
  });
});

describe("search and categories", () => {
  const entries = buildCatalog(
    [
      starter(),
      starter({ key: "cbc", vertical: "diagnostics", verticalLabel: "Diagnostics", name: "Lab report intake", description: "Pathology reports", documentTypes: [] }),
      starter({ key: "kyc", vertical: "mutual_funds", verticalLabel: "Mutual funds", name: "Investor KYC", description: "Folio opening" }),
    ],
    [own()]
  );

  it("matches name, description, category and document labels, word by word", () => {
    expect(matchesQuery(entries[1], "HOME")).toBe(true);
    expect(matchesQuery(entries[1], "bank statement")).toBe(true);
    expect(matchesQuery(entries[1], "  loan   pan ")).toBe(true);
    expect(matchesQuery(entries[1], "loan insurance")).toBe(false);
    expect(matchesQuery(entries[2], "pathology")).toBe(true);
  });

  it("filters by category and query together", () => {
    expect(filterCatalog(entries, "all", "").length).toBe(4);
    expect(filterCatalog(entries, "lending", "").map((e) => e.name)).toEqual(["Home loan"]);
    expect(filterCatalog(entries, "yours", "").map((e) => e.name)).toEqual(["Dealer onboarding"]);
    expect(filterCatalog(entries, "all", "pan card").map((e) => e.name)).toEqual(["Home loan", "Investor KYC"]);
    expect(filterCatalog(entries, "diagnostics", "pan")).toEqual([]);
  });

  it("counts follow the search", () => {
    expect(categoryCounts(entries, "")).toEqual({ all: 4, yours: 1, lending: 1, diagnostics: 1, mutual_funds: 1 });
    expect(categoryCounts(entries, "pan")).toEqual({ all: 2, lending: 1, mutual_funds: 1 });
  });

  it("keeps the fixed chip order and adds unknown lines of business before Your templates", () => {
    const withExtra = [...entries, ...buildCatalog([starter({ key: "x", vertical: "logistics", verticalLabel: "Logistics" })], [])];
    expect(catalogCategories(withExtra).map((c) => c.label)).toEqual([
      "All",
      "Diagnostics",
      "Lending",
      "Mutual funds",
      "Insurance",
      "Vendor onboarding",
      "Logistics",
      "Your templates",
    ]);
  });

  it("summarises document counts", () => {
    expect(documentSummary(entries[1])).toBe("2 required · 4 documents");
    expect(documentSummary(entries[0])).toBe("5 documents");
    expect(documentSummary({ kind: "template", requiredCount: 0, totalCount: 0 })).toBe("Documents set in the template");
    expect(documentSummary({ kind: "starter", requiredCount: 1, totalCount: 1 })).toBe("1 required · 1 document");
  });
});
