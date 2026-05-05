import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your profile, organisation settings, and personal preferences.",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
