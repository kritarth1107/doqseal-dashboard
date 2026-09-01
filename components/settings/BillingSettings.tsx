"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  ExternalLink,
  Info,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { AdjustPlanModal, type UpgradePlan } from "./AdjustPlanModal";

type PaymentMethod = {
  brand: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
};

type BillingInvoice = {
  invoiceId: string;
  date: string;
  totalInr: number;
  status: "paid" | "pending" | "failed";
  description: string;
};

type BillingData = {
  plan: {
    id: string;
    name: string;
    priceInrMonthly: number | null;
    isFree: boolean;
    renewsAt: string | null;
    storageDayRateInr: number;
  };
  paymentMethod: PaymentMethod | null;
  storageCredits: {
    balanceInr: number;
    billableDocuments: number;
    rateInr: number;
    description: string;
  };
  invoices: BillingInvoice[];
  plans: UpgradePlan[];
};

function formatInvoiceDate(iso: string) {
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatRenewal(iso: string | null) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function brandLabel(brand: string) {
  const b = brand.toLowerCase();
  if (b === "visa") return "Visa";
  if (b === "mastercard") return "Mastercard";
  if (b === "rupay") return "RuPay";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

function Row({
  label,
  children,
  action,
}: {
  label: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-5 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
            {label}
          </p>
          {children}
        </div>
        {action ? <div className="shrink-0 pt-6">{action}</div> : null}
      </div>
    </div>
  );
}

function GhostButton({
  children,
  onClick,
  href,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
}) {
  const cls =
    "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl border border-zinc-300 dark:border-zinc-600 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors";
  if (href) {
    return (
      <a href={href} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function BillingSettings() {
  const { activeOrgId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  useEffect(() => {
    async function load() {
      if (!activeOrgId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(
          `/api/organisations/${activeOrgId}/billing`,
          withOrgHeaders(activeOrgId)
        );
        const data = await res.json();
        if (res.ok && data.billing) {
          setBilling(data.billing);
        }
      } catch {
        setBilling(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeOrgId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  const plan = billing?.plan;
  const renewal = formatRenewal(plan?.renewsAt ?? null);

  return (
    <>
      <div className="flex flex-col animate-in fade-in duration-300 max-w-2xl">
        {/* Current plan */}
        <Row
          label=""
          action={
            <GhostButton onClick={() => setShowPlans(true)}>
              Adjust plan
            </GhostButton>
          }
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-[#2563eb]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {plan?.name || "Free"} plan
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                {plan?.isFree ? "Free tier" : "Monthly"}
              </p>
              {plan?.isFree ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  5 MB storage · 2 extractions/month · no API access. Upgrade
                  for higher limits.
                </p>
              ) : renewal ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  Your subscription will auto renew on {renewal}.
                </p>
              ) : null}
            </div>
          </div>
        </Row>

        {/* Payment */}
        <Row
          label="Payment"
          action={
            billing?.paymentMethod ? (
              <GhostButton href="mailto:hello@doqseal.com?subject=Update%20payment%20method">
                Update
              </GhostButton>
            ) : (
              <GhostButton href="mailto:hello@doqseal.com?subject=Add%20payment%20method">
                Add
              </GhostButton>
            )
          }
        >
          {billing?.paymentMethod ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                {billing.paymentMethod.brand.slice(0, 4)}
              </div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {brandLabel(billing.paymentMethod.brand)} ••••{" "}
                {billing.paymentMethod.last4}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
              <CreditCard className="w-5 h-5 shrink-0 opacity-60" />
              <span>No payment method on file</span>
            </div>
          )}
        </Row>

        {/* Storage / usage credits */}
        <Row
          label="Usage credits"
          action={
            <GhostButton href="mailto:hello@doqseal.com?subject=Buy%20usage%20credits">
              Buy more
            </GhostButton>
          }
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
            Document storage is metered at ₹{billing?.storageCredits.rateInr ?? 0.12}
            /doc/day while the original file is kept. After TTL, the file is
            removed but AI context remains.
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              ₹{(billing?.storageCredits.balanceInr ?? 0).toFixed(2)}
            </span>
            <span className="text-sm text-zinc-500">est. daily charge</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {billing?.storageCredits.billableDocuments ?? 0} documents with
            stored originals
          </p>

          <div className="mt-5 pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Auto-reload
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Automatically add credits when balance is low
              </p>
            </div>
            <GhostButton href="mailto:hello@doqseal.com?subject=Enable%20auto-reload">
              Turn on
            </GhostButton>
          </div>
        </Row>

        {/* Invoices */}
        <div className="pt-5">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Invoices
          </p>
          {billing?.invoices && billing.invoices.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {billing.invoices.map((inv) => (
                    <tr key={inv.invoiceId}>
                      <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">
                        {formatInvoiceDate(inv.date)}
                      </td>
                      <td className="px-4 py-3.5 text-zinc-700 dark:text-zinc-300">
                        <span className="inline-flex items-center gap-1">
                          ₹{inv.totalInr.toFixed(2)}
                          <Info className="w-3.5 h-3.5 text-zinc-400" title={inv.description} />
                        </span>
                      </td>
                      <td className="px-4 py-3.5 capitalize text-zinc-600 dark:text-zinc-400">
                        {inv.status}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <a
                          href={`mailto:hello@doqseal.com?subject=Invoice%20${encodeURIComponent(inv.invoiceId)}`}
                          className="text-sm text-[#2563eb] hover:underline inline-flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-10 text-center">
              <p className="text-sm text-zinc-500">No invoices yet</p>
              <p className="text-xs text-zinc-400 mt-1">
                Storage-day charges appear here once documents are stored on a
                paid plan.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-400 mt-8">
          <Link href="/manage/limits" className="text-[#2563eb] hover:underline">
            View limits & usage
          </Link>
          {" · "}
          Payment processing via Razorpay — coming soon.
        </p>
      </div>

      <AdjustPlanModal
        open={showPlans}
        onClose={() => setShowPlans(false)}
        currentPlanId={plan?.id || "free"}
        plans={billing?.plans || []}
      />
    </>
  );
}
