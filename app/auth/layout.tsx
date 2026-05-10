import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Log in to your DoqSeal account to access your document intelligence dashboard.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
