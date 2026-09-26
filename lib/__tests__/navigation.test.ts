import { describe, expect, it } from "vitest";
import { navGroups, visibleNavGroups } from "../navigation";

const hrefs = (groups: ReturnType<typeof visibleNavGroups>) => groups.flatMap((g) => g.items.map((i) => i.href));

describe("visibleNavGroups", () => {
  it("hides case packs unless the organisation has the feature", () => {
    expect(hrefs(visibleNavGroups(navGroups, undefined))).not.toContain("/bundles");
    expect(hrefs(visibleNavGroups(navGroups, { bundles: false }))).not.toContain("/bundles");
    expect(hrefs(visibleNavGroups(navGroups, { bundles: true }))).toContain("/bundles");
  });

  it("leaves other items alone", () => {
    const all = hrefs(visibleNavGroups(navGroups, { bundles: true }));
    expect(hrefs(visibleNavGroups(navGroups, null))).toEqual(all.filter((h) => h !== "/bundles"));
  });

  it("drops groups that end up empty", () => {
    const groups = [{ label: "Only", items: [{ name: "X", href: "/x", icon: navGroups[0].items[0].icon, requiresFeature: "bundles" as const }] }];
    expect(visibleNavGroups(groups, {})).toEqual([]);
  });
});
