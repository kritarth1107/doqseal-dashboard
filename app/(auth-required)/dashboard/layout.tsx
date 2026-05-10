import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your DoqSeal dashboard overview, featuring recent activity and document insights.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
