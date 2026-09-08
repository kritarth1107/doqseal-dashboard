import { redirect } from "next/navigation";

/** Legacy mock collect page → Request Links */
export default function CollectDocumentsRedirect() {
  redirect("/request-links");
}
