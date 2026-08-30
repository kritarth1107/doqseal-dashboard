import { redirect } from "next/navigation";
import { features } from "@/lib/features";

export default function SignSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!features.esignEnabled) {
    redirect("/dashboard");
  }
  return children;
}
