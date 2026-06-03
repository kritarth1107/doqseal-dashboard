export const UPLOAD_ENABLED_PROJECT_IDS = [
  "p-test-request",
  "p-medical-prescription",
] as const;

export type UploadEnabledProjectId = (typeof UPLOAD_ENABLED_PROJECT_IDS)[number];

export function supportsProjectUpload(projectId: string): boolean {
  return UPLOAD_ENABLED_PROJECT_IDS.includes(projectId as UploadEnabledProjectId);
}

export function isPrescriptionProject(projectId: string): boolean {
  return projectId === "p-medical-prescription";
}

export function isTrfProject(projectId: string): boolean {
  return projectId === "p-test-request";
}
