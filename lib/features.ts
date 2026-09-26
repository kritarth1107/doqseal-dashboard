/** Feature flags for the DoqSeal dashboard */
export const features = {
  /** E-sign / envelopes - disabled while focusing on document intelligence */
  esignEnabled: process.env.NEXT_PUBLIC_ESIGN_ENABLED === "true",
};

/**
 * Organisation feature flags as sent in the user profile. Case packs are on
 * unless the profile says `bundles: false` (the backend's per-organisation
 * kill switch), so a missing flag counts as on.
 */
export type OrgFeature = "bundles";

export type OrgFeatureFlags = Partial<Record<OrgFeature, boolean>> | null | undefined;

const DEFAULT_ON: Record<OrgFeature, boolean> = {
  bundles: true,
};

export function isOrgFeatureEnabled(features: OrgFeatureFlags, feature: OrgFeature): boolean {
  const value = features?.[feature];
  return typeof value === "boolean" ? value : DEFAULT_ON[feature];
}
