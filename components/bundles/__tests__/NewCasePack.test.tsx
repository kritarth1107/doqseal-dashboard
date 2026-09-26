// @vitest-environment happy-dom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StarterTemplate, TemplateDetail, TemplateListItem } from "@/lib/bundles/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));

const api = {
  starters: vi.fn(),
  templates: vi.fn(),
  adoptStarter: vi.fn(),
  template: vi.fn(),
  create: vi.fn(),
  createTemplate: vi.fn(),
  publishTemplate: vi.fn(),
};
vi.mock("@/lib/bundles/hooks", () => ({ useBundleApi: () => api }));

import { NewCasePack } from "../NewCasePack";

const starters: StarterTemplate[] = [
  {
    key: "home_loan",
    vertical: "lending",
    verticalLabel: "Lending",
    name: "Home loan",
    description: "Salaried home loan application",
    documentTypes: [
      { key: "pan_card", label: "PAN card", required: true, conditional: false, minCount: 1 },
      { key: "bank_statement", label: "Bank statement", required: true, conditional: false, minCount: 1 },
      { key: "salary_slip", label: "Salary slip", required: true, conditional: false, minCount: 3 },
      { key: "form_16", label: "Form 16", required: false, conditional: true, minCount: 1 },
    ],
    profileFieldCount: 1,
    ruleCount: 2,
    templateId: null,
    templateStatus: null,
  },
  {
    key: "lab_intake",
    vertical: "diagnostics",
    verticalLabel: "Diagnostics",
    name: "Lab report intake",
    description: "Pathology report with prescription",
    documentTypes: [{ key: "lab_report", label: "Lab report", required: true, conditional: false, minCount: 1 }],
    profileFieldCount: 0,
    ruleCount: 1,
    templateId: null,
    templateStatus: null,
  },
];
const templates: TemplateListItem[] = [
  { templateId: "tpl-own", name: "Dealer onboarding", description: "Our dealer checklist", status: "published", latestVersion: 1, documentTypeCount: 4 },
];
const detail: TemplateDetail = {
  templateId: "tpl-home",
  name: "Home loan",
  status: "published",
  latestVersion: 1,
  draft: {
    documentTypes: [
      { key: "pan_card", label: "PAN card", required: true },
      { key: "form_16", label: "Form 16", required: "employment == salaried" },
    ],
    profileFields: [{ key: "employment", label: "Employment", type: "select", options: ["salaried", "self_employed"], required: true }],
  },
};

beforeEach(() => {
  api.starters.mockResolvedValue(starters);
  api.templates.mockResolvedValue(templates);
  api.adoptStarter.mockResolvedValue(detail);
  api.template.mockResolvedValue({ ...detail, templateId: "tpl-own", name: "Dealer onboarding" });
  api.create.mockResolvedValue({ bundleId: "b-1" });
  api.createTemplate.mockResolvedValue({ templateId: "tpl-custom", name: "Custom" });
  api.publishTemplate.mockResolvedValue({ templateId: "tpl-custom", version: 1 });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const cards = () => screen.getAllByTestId("template-card");

describe("NewCasePack", () => {
  it("shows the case pack form beside the template grid", async () => {
    render(<NewCasePack />);
    expect(screen.getByRole("status", { name: "Loading templates" })).toBeTruthy();
    expect(screen.getByRole("form", { name: "Your case pack" })).toBeTruthy();
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(screen.queryByRole("region", { name: /Set up/ })).toBeNull();
  });

  it("cards show counts and the first document types", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    const home = cards().find((c) => c.textContent?.includes("Home loan"))!;
    expect(home.textContent).toContain("3 required · 4 documents");
    expect(home.textContent).toContain("PAN card");
    expect(home.textContent).toContain("Salary slip");
    expect(home.textContent).not.toContain("Form 16");
    expect(home.textContent).toContain("+1 more");
  });

  it("category chips carry counts and filter the grid", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    const chips = within(screen.getByRole("group", { name: "Filter by line of business" }));
    expect(chips.getByRole("button", { name: /All/ }).textContent).toContain("3");
    expect(chips.getByRole("button", { name: /Insurance/ }).textContent).toContain("0");
    fireEvent.click(chips.getByRole("button", { name: /Your templates/ }));
    expect(chips.getByRole("button", { name: /Your templates/ }).getAttribute("aria-pressed")).toBe("true");
    expect(cards().map((c) => c.textContent)).toEqual([expect.stringContaining("Dealer onboarding")]);
  });

  it("search narrows results and shows an empty state that resets", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    const search = screen.getByRole("searchbox", { name: "Search templates" });
    fireEvent.change(search, { target: { value: "pathology" } });
    expect(cards()).toHaveLength(1);
    fireEvent.change(search, { target: { value: "no such thing" } });
    expect(screen.getByText("No templates match")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show all templates" }));
    expect(cards()).toHaveLength(3);
  });

  it("fills the case pack from a template and creates it unchanged", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    const home = cards().find((c) => c.textContent?.includes("Home loan"))!;
    await act(async () => {
      fireEvent.click(home);
    });
    expect(api.adoptStarter).toHaveBeenCalledWith("home_loan");
    expect(home.getAttribute("aria-pressed")).toBe("true");
    const form = screen.getByRole("form", { name: "Your case pack" });
    await within(form).findByDisplayValue("PAN card");
    expect(within(form).getByRole("option", { name: "Depends on case" })).toBeTruthy();

    const create = within(form).getByRole("button", { name: "Create case pack" }) as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    fireEvent.change(within(form).getByPlaceholderText("APP-2026-00123"), { target: { value: "APP-1" } });
    expect(create.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(create);
    });
    expect(within(form).getByText("Fill in the highlighted fields.")).toBeTruthy();
    expect(api.create).not.toHaveBeenCalled();

    fireEvent.change(within(form).getByRole("combobox", { name: "Employment" }), { target: { value: "salaried" } });
    await act(async () => {
      fireEvent.click(create);
    });
    expect(api.createTemplate).not.toHaveBeenCalled();
    expect(api.create).toHaveBeenCalledWith({
      templateId: "tpl-home",
      name: undefined,
      externalRef: "APP-1",
      profile: { employment: "salaried" },
    });
    expect(push).toHaveBeenCalledWith("/bundles/b-1?add=1");
  });

  it("creates a case pack from documents the user adds", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    const form = screen.getByRole("form", { name: "Your case pack" });
    fireEvent.change(within(form).getByPlaceholderText("Priya Sharma – home loan"), { target: { value: "Priya Sharma" } });
    fireEvent.change(within(form).getByLabelText("New document"), { target: { value: "Passport" } });
    fireEvent.click(within(form).getByRole("button", { name: "Add" }));
    await act(async () => {
      fireEvent.click(within(form).getByRole("button", { name: "Create case pack" }));
    });
    expect(api.adoptStarter).not.toHaveBeenCalled();
    expect(api.createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Priya Sharma",
        draft: expect.objectContaining({
          documentTypes: [expect.objectContaining({ key: "passport", label: "Passport", required: true })],
        }),
      })
    );
    expect(api.publishTemplate).toHaveBeenCalledWith("tpl-custom");
    expect(api.create).toHaveBeenCalledWith({
      templateId: "tpl-custom",
      name: "Priya Sharma",
      externalRef: undefined,
      profile: {},
    });
  });

  it("keeps edits made after choosing a template", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    await act(async () => {
      fireEvent.click(cards().find((c) => c.textContent?.includes("Home loan"))!);
    });
    const form = screen.getByRole("form", { name: "Your case pack" });
    await within(form).findByDisplayValue("PAN card");
    fireEvent.click(within(form).getByRole("button", { name: "Remove Form 16" }));
    fireEvent.change(within(form).getByPlaceholderText("APP-2026-00123"), { target: { value: "APP-1" } });
    fireEvent.change(within(form).getByRole("combobox", { name: "Employment" }), { target: { value: "salaried" } });
    await act(async () => {
      fireEvent.click(within(form).getByRole("button", { name: "Create case pack" }));
    });
    expect(api.createTemplate).toHaveBeenCalled();
    const draft = api.createTemplate.mock.calls[0][0].draft;
    expect(draft.documentTypes.map((doc: { key: string }) => doc.key)).toEqual(["pan_card"]);
    expect(api.publishTemplate).toHaveBeenCalledWith("tpl-custom");
    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ templateId: "tpl-custom" }));
  });

  it("own templates load through the template call, and Clear removes them", async () => {
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    await act(async () => {
      fireEvent.click(cards().find((c) => c.textContent?.includes("Dealer onboarding"))!);
    });
    expect(api.template).toHaveBeenCalledWith("tpl-own");
    await screen.findByDisplayValue("PAN card");
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("Started from a template")).toBeNull();
    expect(screen.queryByDisplayValue("PAN card")).toBeNull();
  });

  it("shows a retry when a template cannot be prepared", async () => {
    api.adoptStarter.mockRejectedValueOnce(new Error("Template service unavailable"));
    render(<NewCasePack />);
    await waitFor(() => expect(cards()).toHaveLength(3));
    await act(async () => {
      fireEvent.click(cards()[1]);
    });
    expect(screen.getByText("Template service unavailable")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Try again|Retry/ }));
    });
    await screen.findByDisplayValue("PAN card");
  });

  it("shows an error state with retry when templates fail to load", async () => {
    api.starters.mockRejectedValueOnce(new Error("Network down"));
    render(<NewCasePack />);
    await screen.findByText("Could not load templates");
    expect(screen.getByText("Network down")).toBeTruthy();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Try again|Retry/ }));
    });
    await waitFor(() => expect(cards()).toHaveLength(3));
  });
});
