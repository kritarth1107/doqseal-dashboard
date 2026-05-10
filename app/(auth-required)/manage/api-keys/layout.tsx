import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Management",
  description: "Create and manage your DoqSeal API keys, monitor usage, and integrate document intelligence into your apps.",
};

export default function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
