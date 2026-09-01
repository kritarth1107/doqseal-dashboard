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
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { AdjustPlanModal, type UpgradePlan } from "./AdjustPlanModal";

type PaymentMethod = {
  type?: string;
  brand: string;
  last4: string;
  expiryMonth?: number | null;
  expiryYear?: number | null;
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
    subscriptionStatus?: string | null;
  };
  paymentMethod: PaymentMethod | null;
  invoices: BillingInvoice[];
  plans: UpgradePlan[];
  checkoutAvailable?: boolean;
  checkoutMode?: "sandbox" | "production";
  checkoutProvider?: "cashfree" | "razorpay" | null;
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
  if (b === "upi") return "UPI";
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
          {label ? (
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-3">
              {label}
            </p>
          ) : null}
          {children}
        </div>
        {action ? (
          <div className={`shrink-0 ${label ? "pt-6" : "pt-1"}`}>{action}</div>
        ) : null}
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
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [showPlans, setShowPlans] = useState(false);

  const loadBilling = async () => {
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
  };

  useEffect(() => {
    void loadBilling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId]);

  useEffect(() => {
    async function syncReturn() {
      if (!activeOrgId) return;
      const checkout = searchParams.get("checkout");
      const subscriptionId =
        searchParams.get("subscription_id") ||
        sessionStorage.getItem("doqseal_pending_subscription");

      if (checkout !== "done" || !subscriptionId) return;

      try {
        const res = await fetch(
          `/api/organisations/${activeOrgId}/billing/sync`,
          withOrgHeaders(activeOrgId, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subscriptionId }),
          })
        );
        const data = await res.json();
        if (res.ok) {
          if (data.status === "active" || data.status === "bank_approval_pending") {
            toast.success("Subscription activated");
          } else {
            toast.message(`Subscription status: ${data.status || "updated"}`);
          }
          sessionStorage.removeItem("doqseal_pending_subscription");
          await loadBilling();
        }
      } catch {
        // ignore — webhook may still activate
      }
    }
    void syncReturn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrgId, searchParams]);

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
                {plan?.isFree ? "Free tier" : "Monthly · Cashfree autopay"}
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

        <Row
          label="Payment"
          action={
            <GhostButton onClick={() => setShowPlans(true)}>
              {billing?.paymentMethod ? "Update" : "Add"}
            </GhostButton>
          }
        >
          {billing?.paymentMethod ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-600 dark:text-zinc-300 uppercase">
                {(billing.paymentMethod.brand || "CARD").slice(0, 4)}
              </div>
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {brandLabel(billing.paymentMethod.brand || "Card")} ••••{" "}
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
                          <span title={inv.description} className="inline-flex">
                            <Info
                              className="w-3.5 h-3.5 text-zinc-400"
                              aria-hidden
                            />
                          </span>
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
                Subscription charges appear here after a successful payment.
              </p>
            </div>
          )}
        </div>

        <p className="text-xs text-zinc-400 mt-8">
          <Link href="/manage/limits" className="text-[#2563eb] hover:underline">
            View limits & usage
          </Link>
        </p>
      </div>

      <AdjustPlanModal
        open={showPlans}
        onClose={() => setShowPlans(false)}
        currentPlanId={plan?.id || "free"}
        plans={billing?.plans || []}
        organisationId={activeOrgId}
        checkoutAvailable={Boolean(billing?.checkoutAvailable)}
        checkoutMode={billing?.checkoutMode || "sandbox"}
        checkoutProvider={billing?.checkoutProvider || "razorpay"}
        onCheckoutStarted={() => setShowPlans(false)}
      />
    </>
  );
}
