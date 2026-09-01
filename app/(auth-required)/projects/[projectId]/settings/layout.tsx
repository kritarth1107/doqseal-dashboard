import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project settings",
  description:
    "Manage project details, extraction context, access, and danger zone.",
};

export default function ProjectSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
