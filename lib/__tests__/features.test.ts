import { describe, expect, it } from "vitest";
import { isOrgFeatureEnabled } from "../features";

describe("isOrgFeatureEnabled", () => {
  it("treats case packs as on unless the profile says false", () => {
    expect(isOrgFeatureEnabled(undefined, "bundles")).toBe(true);
    expect(isOrgFeatureEnabled(null, "bundles")).toBe(true);
    expect(isOrgFeatureEnabled({}, "bundles")).toBe(true);
    expect(isOrgFeatureEnabled({ bundles: true }, "bundles")).toBe(true);
    expect(isOrgFeatureEnabled({ bundles: false }, "bundles")).toBe(false);
  });
});
