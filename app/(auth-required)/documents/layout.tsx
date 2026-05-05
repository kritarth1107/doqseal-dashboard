import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documents",
  description: "Browse, search, and manage all your documents indexed with Sakshya intelligence.",
};

export default function DocumentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
