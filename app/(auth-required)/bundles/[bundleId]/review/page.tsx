"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleDashed, FileQuestion, Loader2, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/components/AuthProvider";
import { ConflictCard } from "@/components/bundles/ConflictCard";
import { SlotPicker } from "@/components/bundles/SlotPicker";
import { Timeline } from "@/components/bundles/Timeline";
import {
  CARD_CLASS,
  EmptyState,
  ErrorState,
  FeatureDisabledNotice,
  INPUT_CLASS,
  LoadingState,
  PAGE_CLASS,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  StaleBanner,
  StatusChip,
  formatDateTime,
} from "@/components/bundles/ui";
import {
  documentLabel,
  isOpenConflict,
  reviewReadiness,
  slotLabel,
  slotViews,
  unsortedDocuments,
} from "@/lib/bundles/derive";
import { useBundle, useBundleTimeline } from "@/lib/bundles/hooks";

const DISMISS_ROLES = new Set(["owner", "admin"]);

export default function BundleReviewPage() {
  const params = useParams<{ bundleId: string }>();
  const bundleId = typeof params?.bundleId === "string" ? params.bundleId : null;
  const { activeOrg } = useAuth();
  const { phase, error, stale, view: bundle, refresh, actions, isPending, actionError } = useBundle(bundleId);
  const [note, setNote] = useState("");
  const [showAuto, setShowAuto] = useState(false);

  const timelineVersion = bundle
    ? [bundle.updatedAt, bundle.status, bundle.documents.length, bundle.pipeline?.evaluatedAt, bundle.review?.reviewedAt].join("|")
    : null;
  const timeline = useBundleTimeline(bundleId, timelineVersion);

  const unsorted = useMemo(() => (bundle ? unsortedDocuments(bundle) : { sorting: [], needsSlot: [] }), [bundle]);
  const autoPlaced = useMemo(
    () => (bundle ? bundle.documents.filter((d) => d.typeKey && d.assignedBy === "auto") : []),
    [bundle]
  );
  const conflicts = useMemo(() => {
    const all = bundle?.pipeline?.conflicts ?? [];
    return [...all.filter(isOpenConflict), ...all.filter((c) => !isOpenConflict(c))];
  }, [bundle]);
  const missing = useMemo(() => (bundle ? slotViews(bundle).filter((s) => s.missing) : []), [bundle]);
  const readiness = bundle ? reviewReadiness(bundle) : null;
  const canDismiss = DISMISS_ROLES.has(activeOrg?.role ?? "");

  const shell = (children: React.ReactNode) => (
    <div className={PAGE_CLASS}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );

  if (phase === "disabled") return shell(<FeatureDisabledNotice />);
  if (phase === "not_found") {
    return shell(
      <EmptyState
        icon={<FileQuestion className="w-10 h-10 text-slate-300" />}
        title="Case pack not found"
        message="It may have been deleted, or it belongs to another organisation."
        action={<Link href="/bundles" className={SECONDARY_BUTTON}>Back to case packs</Link>}
      />
    );
  }
  if (phase === "error" && !bundle) {
    return shell(<ErrorState title="Could not load this case pack" message={error} onRetry={() => void refresh()} />);
  }
  if (!bundle || !readiness) return shell(<LoadingState label="Loading review…" />);

  const title = bundle.name || bundle.externalRef || "Untitled case pack";
  const errorFor = (key: string) => (actionError?.key === key ? actionError.message : null);
  const openCount = unsorted.needsSlot.length + conflicts.filter(isOpenConflict).length;

  return shell(
    <>
      <PageHeader
        title={`Review: ${title}`}
        description="Place documents DoqSeal was unsure about, settle details that differ between documents, then mark the pack reviewed."
        breadcrumbs={[
          { label: "Case packs", href: "/bundles" },
          { label: title, href: `/bundles/${bundle.bundleId}` },
          { label: "Review" },
        ]}
        actions={
          <Link href={`/bundles/${bundle.bundleId}`} className={SECONDARY_BUTTON}>
            <ArrowLeft className="w-4 h-4" /> Back to case
          </Link>
        }
      />
      {stale && <StaleBanner onRetry={() => void refresh()} />}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className={`${CARD_CLASS} p-5`} aria-labelledby="place-heading">
            <div className="flex items-baseline justify-between mb-3">
              <h2 id="place-heading" className="font-semibold text-slate-900 dark:text-slate-100">
                Documents that need a slot
              </h2>
              {unsorted.sorting.length > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                  <Loader2 className="w-3 h-3 animate-spin" /> {unsorted.sorting.length} still sorting
                </span>
              )}
            </div>
            {unsorted.needsSlot.length === 0 ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Every document is in a slot.
              </p>
            ) : (
              <ul className="space-y-4">
                {unsorted.needsSlot.map((doc) => {
                  const reason = doc.classification?.reasons?.[0];
                  return (
                    <li key={doc.documentId} className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/40 dark:bg-amber-950/10 p-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {doc.available && !doc.restricted ? (
                          <Link href={`/drive/${doc.documentId}`} className="text-sm font-medium text-slate-900 dark:text-slate-100 hover:text-[#2563eb] truncate">
                            {documentLabel(doc)}
                          </Link>
                        ) : (
                          <span className="text-sm font-medium text-slate-500 truncate">{documentLabel(doc)}</span>
                        )}
                        <span className="text-xs text-amber-700 dark:text-amber-300 shrink-0">
                          {doc.classification?.status === "failed" ? "Could not sort" : "Needs attention"}
                        </span>
                      </div>
                      {reason && <p className="text-xs text-slate-500 mb-2">{reason}</p>}
                      {actions && (
                        <SlotPicker
                          bundle={bundle}
                          doc={doc}
                          pending={isPending(`slot:${doc.documentId}`)}
                          onAssign={(key) => void actions.assignSlot(doc.documentId, key)}
                        />
                      )}
                      {errorFor(`slot:${doc.documentId}`) && (
                        <p className="text-sm text-red-600 mt-2" role="alert">{errorFor(`slot:${doc.documentId}`)}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {autoPlaced.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                <button type="button" className="text-sm font-medium text-[#2563eb]" onClick={() => setShowAuto((v) => !v)}>
                  {showAuto ? "Hide" : "Check"} {autoPlaced.length} automatic placement{autoPlaced.length === 1 ? "" : "s"}
                </button>
                {showAuto && (
                  <ul className="mt-3 space-y-2">
                    {autoPlaced.map((doc) => (
                      <li key={doc.documentId} className="grid sm:grid-cols-2 gap-2 items-center">
                        <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{documentLabel(doc)}</span>
                        {actions && (
                          <SlotPicker
                            compact
                            bundle={bundle}
                            doc={doc}
                            pending={isPending(`slot:${doc.documentId}`)}
                            onAssign={(key) => void actions.assignSlot(doc.documentId, key)}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className={`${CARD_CLASS} p-5`} aria-labelledby="conflicts-heading">
            <h2 id="conflicts-heading" className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Details that differ between documents
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Pick the correct value, or dismiss the difference with a reason when it does not matter.
            </p>
            {conflicts.length === 0 ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No conflicts found.
              </p>
            ) : (
              <div className="space-y-3">
                {conflicts.map((c) => (
                  <ConflictCard
                    key={`${c.field}:${c.valuesHash ?? ""}`}
                    bundle={bundle}
                    conflict={c}
                    canDismiss={canDismiss}
                    interactive={Boolean(actions) && !bundle.readOnly}
                    pending={isPending(`conflict:${c.field}`)}
                    error={errorFor(`conflict:${c.field}`)}
                    handlers={
                      actions && c.valuesHash
                        ? {
                            resolve: (value) => void actions.resolveConflict(c.field, c.valuesHash!, value),
                            dismiss: (reason) => void actions.dismissConflict(c.field, c.valuesHash!, reason),
                            reopen: () => void actions.reopenConflict(c.field, c.valuesHash!),
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <section className={`${CARD_CLASS} p-5`} aria-labelledby="missing-heading">
            <h2 id="missing-heading" className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Missing required items
            </h2>
            {missing.length === 0 ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Everything required has been received.
              </p>
            ) : (
              <>
                <ul className="space-y-1.5">
                  {missing.map((s) => (
                    <li key={s.slot.key} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <CircleDashed className="w-4 h-4 text-red-500" />
                      {slotLabel(bundle, s.slot.key)}
                      {s.slot.minCount > 1 && (
                        <span className="text-xs text-slate-400">
                          ({s.received} of {s.slot.minCount})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                <Link href={`/bundles/${bundle.bundleId}`} className={`${SECONDARY_BUTTON} mt-3`}>
                  Add documents
                </Link>
              </>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className={`${CARD_CLASS} p-5`} aria-labelledby="mark-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="mark-heading" className="font-semibold text-slate-900 dark:text-slate-100">
                Mark reviewed
              </h2>
              <StatusChip status={bundle.status} reviewed={bundle.reviewed} />
            </div>
            {readiness.alreadyReviewed && bundle.review ? (
              <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                <p className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium">
                  <ShieldCheck className="w-4 h-4" /> Reviewed
                </p>
                <p>
                  By {bundle.review.reviewer?.name ?? "a team member"} · {formatDateTime(bundle.review.reviewedAt)}
                </p>
                {bundle.review.note && <p className="italic text-slate-500">“{bundle.review.note}”</p>}
                <p className="text-xs text-slate-400 pt-1">
                  Adding, removing or moving a document clears the review.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {readiness.reasons.length > 0 ? (
                  <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                    {readiness.reasons.map((r) => (
                      <li key={r} className="flex items-start gap-2">
                        <CircleDashed className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    All documents are placed, nothing required is missing and there are no open conflicts.
                  </p>
                )}
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
                  Note (optional)
                  <textarea
                    className={`${INPUT_CLASS} mt-1`}
                    rows={3}
                    maxLength={1000}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Anything the next person should know."
                  />
                </label>
                <button
                  type="button"
                  className={`${PRIMARY_BUTTON} w-full`}
                  disabled={!readiness.canMark || isPending("review") || !actions}
                  onClick={() => void actions?.markReviewed(note.trim() || undefined).then((ok) => ok && setNote(""))}
                >
                  {isPending("review") && <Loader2 className="w-4 h-4 animate-spin" />}
                  Mark reviewed
                </button>
                {openCount > 0 && (
                  <p className="text-xs text-slate-400 text-center">
                    {openCount} item{openCount === 1 ? "" : "s"} need attention first.
                  </p>
                )}
                {errorFor("review") && (
                  <p className="text-sm text-red-600" role="alert">{errorFor("review")}</p>
                )}
              </div>
            )}
          </section>

          <section className={`${CARD_CLASS} p-5`} aria-labelledby="timeline-heading">
            <h2 id="timeline-heading" className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Activity
            </h2>
            <Timeline entries={timeline.entries} phase={timeline.phase} error={timeline.error} bundle={bundle} />
          </section>
        </aside>
      </div>
    </>
  );
}
