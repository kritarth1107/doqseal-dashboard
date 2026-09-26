"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ClipboardCheck, FileQuestion, Loader2, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { AddDocumentsModal } from "@/components/bundles/AddDocumentsModal";
import { ProgressCell } from "@/components/bundles/ProgressCell";
import { SlotCard } from "@/components/bundles/SlotCard";
import { SlotPicker } from "@/components/bundles/SlotPicker";
import {
  CARD_CLASS,
  EmptyState,
  ErrorState,
  FeatureDisabledNotice,
  LoadingState,
  PAGE_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  StaleBanner,
  StatusChip,
  formatDateTime,
  formatRelative,
} from "@/components/bundles/ui";
import { documentLabel, openConflicts, slotViews, unsortedDocuments } from "@/lib/bundles/derive";
import { useBundle } from "@/lib/bundles/hooks";
import { conflictFieldLabel, statusMeta } from "@/lib/bundles/status";
import type { BundleDocumentView } from "@/lib/bundles/types";

export default function BundlePage() {
  return (
    <Suspense fallback={<LoadingState label="Loading case pack…" />}>
      <BundleView />
    </Suspense>
  );
}

function BundleView() {
  const params = useParams<{ bundleId: string }>();
  const bundleId = typeof params?.bundleId === "string" ? params.bundleId : null;
  const search = useSearchParams();
  const router = useRouter();
  const { activeOrgId } = useAuth();
  const { phase, error, stale, view: bundle, refresh, actions, isPending, actionError, updatedAt } = useBundle(bundleId);

  // Straight after creating a pack the add-documents dialog opens.
  const [addOpen, setAddOpen] = useState(() => search?.get("add") === "1");
  const [addSlot, setAddSlot] = useState<string | null>(null);
  const [addKey, setAddKey] = useState(0);

  useEffect(() => {
    if (search?.get("add") === "1" && bundleId) router.replace(`/bundles/${bundleId}`);
  }, [search, bundleId, router]);

  const slots = useMemo(() => (bundle ? slotViews(bundle) : []), [bundle]);
  const unsorted = useMemo(() => (bundle ? unsortedDocuments(bundle) : { sorting: [], needsSlot: [] }), [bundle]);
  const conflicts = useMemo(() => (bundle ? openConflicts(bundle) : []), [bundle]);

  const openAdd = (slotKey: string | null) => {
    setAddSlot(slotKey);
    setAddKey((k) => k + 1);
    setAddOpen(true);
  };

  const remove = (doc: BundleDocumentView) => {
    if (!actions) return;
    if (!window.confirm(`Remove “${documentLabel(doc)}” from this case pack? The document stays in Drive.`)) return;
    void actions.removeDocument(doc.documentId);
  };

  if (phase === "disabled") return <Shell><FeatureDisabledNotice /></Shell>;
  if (phase === "not_found") {
    return (
      <Shell>
        <EmptyState
          icon={<FileQuestion className="w-10 h-10 text-slate-300" />}
          title="Case pack not found"
          message="It may have been deleted, or it belongs to another organisation."
          action={<Link href="/bundles" className={SECONDARY_BUTTON}>Back to case packs</Link>}
        />
      </Shell>
    );
  }
  if (phase === "error" && !bundle) {
    return <Shell><ErrorState title="Could not load this case pack" message={error} onRetry={() => void refresh()} /></Shell>;
  }
  if (!bundle) return <Shell><LoadingState label="Loading case pack…" /></Shell>;

  const meta = statusMeta(bundle.status, bundle.reviewed);
  const attention = unsorted.needsSlot.length + conflicts.length;
  const title = bundle.name || bundle.externalRef || "Untitled case pack";
  const missingSlots = slots.filter((s) => s.missing);

  return (
    <Shell>
      <PageHeader
        title={title}
        description={[bundle.externalRef && bundle.name ? bundle.externalRef : null, bundle.templateName || bundle.template?.name]
          .filter(Boolean)
          .join(" · ") || undefined}
        breadcrumbs={[{ label: "Case packs", href: "/bundles" }, { label: title }]}
        actions={
          <>
            <button type="button" className={SECONDARY_BUTTON} onClick={() => void refresh()} title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            {!bundle.readOnly && (
              <button type="button" className={SECONDARY_BUTTON} onClick={() => openAdd(null)}>
                <Plus className="w-4 h-4" /> Add documents
              </button>
            )}
            <Link href={`/bundles/${bundle.bundleId}/review`} className={PRIMARY_BUTTON}>
              <ClipboardCheck className="w-4 h-4" />
              Review{attention > 0 ? ` (${attention})` : ""}
            </Link>
          </>
        }
      />

      {stale && <StaleBanner onRetry={() => void refresh()} />}
      {actionError && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700" role="alert">
          <span>{actionError.message}</span>
          <button type="button" className="font-medium underline" onClick={() => actions?.clearError()}>
            Dismiss
          </button>
        </div>
      )}

      <div className={`${CARD_CLASS} p-5 mb-6 grid gap-4 md:grid-cols-3 items-center`}>
        <div>
          <StatusChip status={bundle.status} reviewed={bundle.reviewed} />
          <p className="text-sm text-slate-500 mt-2">{meta.description}</p>
        </div>
        <div className="md:col-span-1">
          <ProgressCell progress={bundle.progress} documentCount={bundle.documents.length} />
        </div>
        <div className="text-xs text-slate-500 md:text-right space-y-1">
          {bundle.review ? (
            <p>
              Marked reviewed by {bundle.review.reviewer?.name ?? "a team member"} · {formatDateTime(bundle.review.reviewedAt)}
            </p>
          ) : null}
          <p>Updated {formatRelative(bundle.updatedAt)}</p>
          {updatedAt && <p className="text-slate-400">Refreshes automatically</p>}
        </div>
      </div>

      {(unsorted.needsSlot.length > 0 || conflicts.length > 0) && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Needs attention:{" "}
              {[
                unsorted.needsSlot.length
                  ? `${unsorted.needsSlot.length} document${unsorted.needsSlot.length === 1 ? "" : "s"} without a slot`
                  : null,
                conflicts.length
                  ? `${conflicts.length} conflict${conflicts.length === 1 ? "" : "s"} (${conflicts
                      .map((c) => conflictFieldLabel(c.field))
                      .join(", ")})`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <Link href={`/bundles/${bundle.bundleId}/review`} className={SECONDARY_BUTTON}>
            Open review
          </Link>
        </div>
      )}

      {bundle.documents.length === 0 ? (
        <div className="mb-6">
          <EmptyState
            title="No documents in this pack yet"
            message="Upload the customer's documents or pick them from Drive. DoqSeal places each one in the right slot and shows what is still missing."
            action={
              !bundle.readOnly ? (
                <button type="button" className={PRIMARY_BUTTON} onClick={() => openAdd(null)}>
                  <Plus className="w-4 h-4" /> Add documents
                </button>
              ) : undefined
            }
          />
        </div>
      ) : null}

      {(unsorted.sorting.length > 0 || unsorted.needsSlot.length > 0) && (
        <section className={`${CARD_CLASS} p-5 mb-6`} aria-label="Documents without a slot">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Not in a slot yet</h2>
          <ul className="space-y-3">
            {unsorted.sorting.map((doc) => (
              <li key={doc.documentId} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <Loader2 className="w-4 h-4 animate-spin text-[#2563eb]" />
                <span className="truncate">{documentLabel(doc)}</span>
                <span className="text-xs text-slate-400">Sorting…</span>
              </li>
            ))}
            {unsorted.needsSlot.map((doc) => (
              <li key={doc.documentId} className="grid md:grid-cols-2 gap-2 items-center">
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-100 truncate">{documentLabel(doc)}</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {doc.classification?.status === "failed"
                      ? "Could not be sorted automatically. Choose a slot."
                      : doc.classification
                      ? "Not sure where this goes. Choose a slot."
                      : "Choose a slot."}
                  </p>
                </div>
                {!bundle.readOnly && actions && (
                  <SlotPicker
                    bundle={bundle}
                    doc={doc}
                    pending={isPending(`slot:${doc.documentId}`)}
                    onAssign={(key) => void actions.assignSlot(doc.documentId, key)}
                  />
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Slots">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Documents by slot</h2>
          <span className="text-xs text-slate-500">
            {missingSlots.length
              ? `${missingSlots.length} required item${missingSlots.length === 1 ? "" : "s"} missing`
              : "All required items received"}
          </span>
        </div>
        {slots.length === 0 ? (
          <p className="text-sm text-slate-500">This template has no document slots.</p>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {slots.map((view) => (
              <SlotCard
                key={view.slot.key}
                bundle={bundle}
                view={view}
                isPending={isPending}
                onAdd={openAdd}
                onAssign={(documentId, key) => void actions?.assignSlot(documentId, key)}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </section>

      {bundle.profile && Object.keys(bundle.profile).length > 0 && (
        <section className={`${CARD_CLASS} p-5 mt-6`} aria-label="Case details">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Case details</h2>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            {Object.entries(bundle.profile).map(([key, value]) => {
              const label = bundle.template?.profileFields?.find((f) => f.key === key)?.label ?? key.replace(/_/g, " ");
              return (
                <div key={key} className="flex justify-between gap-3 border-b border-gray-100 dark:border-zinc-800 py-1.5">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-slate-900 dark:text-slate-100 text-right">
                    {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value ?? "").replace(/_/g, " ")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {actions && addOpen && (
        <AddDocumentsModal
          key={addKey}
          open={addOpen}
          onClose={() => setAddOpen(false)}
          bundle={bundle}
          organisationId={activeOrgId}
          initialSlot={addSlot}
          onAttach={(ids, slot) => actions.attach(ids, slot)}
        />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={PAGE_CLASS}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}
