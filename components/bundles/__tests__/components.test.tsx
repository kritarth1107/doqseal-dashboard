// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { bundle, doc } from "@/lib/bundles/__tests__/fixtures";
import type { BundleConflict } from "@/lib/bundles/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
const auth = { activeOrg: null as null | { features?: { bundles?: boolean } }, activeOrgId: "org-1", loading: false };
vi.mock("@/components/AuthProvider", () => ({ useAuth: () => auth }));

import { ConflictCard } from "../ConflictCard";
import { BundlesFeatureGate } from "../FeatureGate";
import { SlotCard } from "../SlotCard";
import { SlotPicker } from "../SlotPicker";
import { Timeline } from "../Timeline";
import { EmptyState, ErrorState, StatusChip } from "../ui";
import { slotViews } from "@/lib/bundles/derive";

afterEach(() => {
  cleanup();
  replace.mockReset();
});

const conflict = (overrides: Partial<BundleConflict> = {}): BundleConflict => ({
  field: "full_name",
  message: "Names differ",
  severity: "review",
  values: [
    { documentId: "d1", typeKey: "pan_card", value: "PRIYA SHARMA" },
    { documentId: "d2", typeKey: "bank_statement", value: "PRIYA S" },
  ],
  valuesHash: "h1",
  status: "open",
  ...overrides,
});

const withDocs = () =>
  bundle({
    documents: [
      doc({ documentId: "d1", typeKey: "pan_card", filename: "pan.pdf" }),
      doc({ documentId: "d2", typeKey: "bank_statement", filename: "statement.pdf" }),
    ],
  });

describe("StatusChip", () => {
  it("uses review wording", () => {
    render(<StatusChip status="needs_review" />);
    expect(screen.getByText("Needs attention")).toBeTruthy();
    cleanup();
    render(<StatusChip status="ready" reviewed />);
    expect(screen.getByText("Reviewed")).toBeTruthy();
  });
});

describe("ConflictCard", () => {
  it("resolves with the picked value", () => {
    const resolve = vi.fn();
    render(
      <ConflictCard
        bundle={withDocs()}
        conflict={conflict()}
        canDismiss={false}
        interactive
        pending={false}
        handlers={{ resolve, dismiss: vi.fn(), reopen: vi.fn() }}
      />
    );
    expect(screen.getByText("Name differs between documents")).toBeTruthy();
    expect(screen.getByText("PAN card · pan.pdf")).toBeTruthy();
    const use = screen.getByRole("button", { name: /use selected value/i }) as HTMLButtonElement;
    expect(use.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/PRIYA SHARMA/));
    expect(use.disabled).toBe(false);
    fireEvent.click(use);
    expect(resolve).toHaveBeenCalledWith("PRIYA SHARMA");
    expect(screen.queryByRole("button", { name: /^dismiss$/i })).toBeNull();
    expect(screen.getByText(/only admins can dismiss/i)).toBeTruthy();
  });

  it("lets admins dismiss with a reason", () => {
    const dismiss = vi.fn();
    render(
      <ConflictCard
        bundle={withDocs()}
        conflict={conflict()}
        canDismiss
        interactive
        pending={false}
        handlers={{ resolve: vi.fn(), dismiss, reopen: vi.fn() }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /^dismiss$/i }));
    const confirm = screen.getByRole("button", { name: /dismiss conflict/i }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "  Short name on PAN  " } });
    fireEvent.click(confirm);
    expect(dismiss).toHaveBeenCalledWith("Short name on PAN");
  });

  it("shows the decision and offers reopen", () => {
    const reopen = vi.fn();
    render(
      <ConflictCard
        bundle={withDocs()}
        conflict={conflict({
          status: "resolved",
          resolution: { action: "resolve", actorId: "u1", at: "2026-09-26T10:00:00Z", value: "PRIYA SHARMA" },
        })}
        canDismiss
        interactive
        pending={false}
        handlers={{ resolve: vi.fn(), dismiss: vi.fn(), reopen }}
      />
    );
    expect(screen.getByText(/Resolved as “PRIYA SHARMA”/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /reopen/i }));
    expect(reopen).toHaveBeenCalled();
  });
});

describe("SlotPicker", () => {
  it("preselects the suggestion and assigns on click", () => {
    const onAssign = vi.fn();
    const d = doc({
      classification: {
        status: "needs_review",
        suggestedTypeKey: "bank_statement",
        confidence: 0.4,
        alternatives: [],
        reasons: [],
        lastError: null,
      },
    });
    render(<SlotPicker bundle={bundle({ documents: [d] })} doc={d} pending={false} onAssign={onAssign} />);
    const select = screen.getByLabelText("Slot for this document") as HTMLSelectElement;
    expect(select.value).toBe("bank_statement");
    expect(select.options[1].textContent).toBe("Bank statement (suggested, weak match)");
    fireEvent.click(screen.getByRole("button", { name: /place in slot/i }));
    expect(onAssign).toHaveBeenCalledWith("bank_statement");
  });
});

describe("SlotCard", () => {
  it("marks missing and conflicting slots", () => {
    const b = bundle({
      documents: [doc({ documentId: "d1", typeKey: "pan_card", filename: "pan.pdf" })],
      pipeline: {
        evaluatedAt: "",
        documents: { total: 1, inProgress: 0, classified: 1, needsReview: 0, failed: 0, unassigned: 0 },
        checklist: [],
        missing: [],
        conflicts: [conflict()],
      },
    });
    const [pan, statement] = slotViews(b);
    const props = { bundle: b, isPending: () => false, onAdd: vi.fn(), onAssign: vi.fn(), onRemove: vi.fn() };
    render(<SlotCard {...props} view={pan} />);
    expect(screen.getByText("Conflict")).toBeTruthy();
    expect(screen.getByText("pan.pdf").getAttribute("href")).toBe("/drive/d1");
    cleanup();
    render(<SlotCard {...props} view={statement} />);
    expect(screen.getByText("Missing")).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Add a document to Bank statement"));
    expect(props.onAdd).toHaveBeenCalledWith("bank_statement");
  });
});

describe("Timeline", () => {
  it("renders loading, empty and entries", () => {
    const { rerender } = render(<Timeline entries={[]} phase="loading" error={null} bundle={null} />);
    expect(screen.getByRole("status")).toBeTruthy();
    rerender(<Timeline entries={[]} phase="ready" error={null} bundle={null} />);
    expect(screen.getByText("No activity yet.")).toBeTruthy();
    rerender(
      <Timeline
        phase="ready"
        error={null}
        bundle={null}
        entries={[
          {
            id: "1",
            action: "bundle.reviewed",
            timestamp: "2026-09-26T10:00:00Z",
            actor: { userId: "u", name: "Asha", isSystem: false },
            details: { note: "All good" },
          },
        ]}
      />
    );
    expect(screen.getByText("Marked reviewed")).toBeTruthy();
    expect(screen.getByText("“All good”")).toBeTruthy();
    expect(screen.getByText(/^Asha ·/)).toBeTruthy();
  });
});

describe("states", () => {
  it("error state retries", () => {
    const onRetry = vi.fn();
    render(<ErrorState message="down" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalled();
  });
  it("empty state renders its action", () => {
    render(<EmptyState title="Nothing" action={<button>Go</button>} />);
    expect(screen.getByRole("button", { name: "Go" })).toBeTruthy();
  });
});

describe("BundlesFeatureGate", () => {
  it("redirects when the organisation does not have case packs", () => {
    auth.activeOrg = { features: {} };
    render(
      <BundlesFeatureGate>
        <p>secret</p>
      </BundlesFeatureGate>
    );
    expect(screen.queryByText("secret")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/dashboard");
  });

  it("waits for auth, then renders the page", () => {
    auth.loading = true;
    auth.activeOrg = null;
    const { rerender } = render(
      <BundlesFeatureGate>
        <p>secret</p>
      </BundlesFeatureGate>
    );
    expect(replace).not.toHaveBeenCalled();
    auth.loading = false;
    auth.activeOrg = { features: { bundles: true } };
    rerender(
      <BundlesFeatureGate>
        <p>secret</p>
      </BundlesFeatureGate>
    );
    expect(screen.getByText("secret")).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
