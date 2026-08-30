import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project settings",
  description:
    "Manage project details, extraction context, webhooks, access, and danger zone.",
};

export default function ProjectSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
