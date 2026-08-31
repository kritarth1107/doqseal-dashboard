import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ documentId: string }>;
};

/** Old /documents/:id links → /view/:id */
export default async function DocumentsIdRedirect({ params }: Props) {
  const { documentId } = await params;
  if (!documentId) redirect("/drive");
  redirect(`/view/${documentId}`);
}
