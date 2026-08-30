/** Feature flags for the DoqSeal dashboard */
export const features = {
  /** E-sign / envelopes - disabled while focusing on document intelligence */
  esignEnabled: process.env.NEXT_PUBLIC_ESIGN_ENABLED === "true",
};
