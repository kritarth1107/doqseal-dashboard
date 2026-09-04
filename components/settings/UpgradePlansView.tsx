"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";
import { withOrgHeaders } from "@/lib/client-api";
import { openRazorpaySubscriptionCheckout } from "@/lib/razorpay-checkout";
import {
  formatPlanPrice,
  type BillingInterval,
} from "@/lib/subscription-pricing";

export type UpgradePlan = {
  id: string;
  name: string;
  priceInrMonthly: number | null;
  priceInrYearly?: number | null;
  yearlyDiscountPercent?: number;
  storageLimitBytes?: number | null;
  monthlyExtractionLimit?: number | null;
  dailyApiRequestLimit?: number | null;
  contactSales?: boolean;
  description?: string;
  tagline?: string;
  features?: string[];
  highlighted?: boolean;
};

declare global {
  interface Window {
    Cashfree?: (opts: { mode: "sandbox" | "production" }) => {
      checkout: (opts: {
        paymentSessionId: string;
        redirectTarget?: string;
      }) => Promise<unknown>;
      subscriptionsCheckout?: (opts: {
        subscriptionSessionId: string;
        redirectTarget?: string;
      }) => Promise<unknown>;
    };
  }
}

function PlanIcon({ id }: { id: string }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
      <Sparkles
        className={`w-5 h-5 ${
          id === "scale" || id === "growth"
            ? "text-[#2563eb]"
            : "text-zinc-400"
        }`}
      />
    </div>
  );
}

async function loadCashfreeSdk() {
  if (window.Cashfree) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-cashfree-sdk="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Cashfree SDK"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.dataset.cashfreeSdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Cashfree SDK"));
    document.body.appendChild(script);
  });
}

function isCheckoutPlan(plan: UpgradePlan) {
  return plan.id !== "custom" && !plan.contactSales;
}

export function UpgradePlansView() {
  const { activeOrgId } = useAuth();
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState<{
    plan: { id: string };
    plans: UpgradePlan[];
    checkoutAvailable?: boolean;
    checkoutMode?: "sandbox" | "production";
    checkoutProvider?: "cashfree" | "razorpay" | null;
    yearlyDiscountPercent?: number;
  } | null>(null);
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<string | null>(
    null
  );
  const [phoneModalPlan, setPhoneModalPlan] = useState<UpgradePlan | null>(null);
  const [phone, setPhone] = useState("");
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("monthly");

  const isDark = resolvedTheme === "dark";

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
        if (res.ok && data.billing) setBilling(data.billing);
      } catch {
        setBilling(null);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [activeOrgId]);

  const currentPlanId = billing?.plan?.id || "free";
  const plans = billing?.plans || [];
  const checkoutAvailable = Boolean(billing?.checkoutAvailable);
  const checkoutMode = billing?.checkoutMode || "sandbox";
  const checkoutProvider = billing?.checkoutProvider || "razorpay";
  const yearlyDiscountPercent = billing?.yearlyDiscountPercent ?? 10;
  const displayPlans = plans.filter(isCheckoutPlan);
  const annualAvailable = checkoutProvider === "razorpay";

  const runCheckout = async (plan: UpgradePlan, customerPhone?: string) => {
    if (!activeOrgId) {
      toast.error("Organisation not selected");
      return;
    }

    setCheckingOutPlanId(plan.id);
    try {
      const body: Record<string, string> = {
        planId: plan.id,
        billingInterval,
      };
      if (customerPhone) body.customerPhone = customerPhone;

      const res = await fetch(
        `/api/organisations/${activeOrgId}/billing/subscribe`,
        withOrgHeaders(activeOrgId, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.subscriptionId) {
        sessionStorage.setItem(
          "doqseal_pending_subscription",
          data.subscriptionId
        );
      }

      setPhoneModalPlan(null);
      setPhone("");

      if (
        data.paymentProvider === "razorpay" ||
        data.razorpaySubscriptionId
      ) {
        if (!data.razorpayKeyId || !data.razorpaySubscriptionId) {
          throw new Error("Incomplete Razorpay checkout session");
        }
        await openRazorpaySubscriptionCheckout({
          isDark,
          session: {
            razorpayKeyId: data.razorpayKeyId,
            razorpaySubscriptionId: data.razorpaySubscriptionId,
            returnUrl: data.returnUrl,
            checkoutPrefill: data.checkoutPrefill,
            description: `${plan.name} ${
              billingInterval === "yearly" ? "annual" : "monthly"
            } plan`,
          },
        });
        return;
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      const sessionId =
        data.paymentSessionId || data.subscriptionSessionId || null;
      if (!sessionId) {
        throw new Error("No payment session returned from gateway");
      }

      await loadCashfreeSdk();
      if (!window.Cashfree) {
        throw new Error("Cashfree SDK unavailable");
      }

      const cashfree = window.Cashfree({ mode: checkoutMode });
      if (data.subscriptionSessionId && cashfree.subscriptionsCheckout) {
        await cashfree.subscriptionsCheckout({
          subscriptionSessionId: data.subscriptionSessionId,
          redirectTarget: "_self",
        });
      } else {
        await cashfree.checkout({
          paymentSessionId: sessionId,
          redirectTarget: "_self",
        });
      }
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        err.message !== "Checkout cancelled"
      ) {
        toast.error(err.message);
      }
    } finally {
      setCheckingOutPlanId(null);
    }
  };

  const startCheckout = (plan: UpgradePlan) => {
    if (!checkoutAvailable) {
      toast.error("Payments are not configured yet");
      return;
    }
    if (plan.id === "free" || plan.id === currentPlanId) return;

    if (checkoutProvider === "cashfree") {
      setPhoneModalPlan(plan);
      return;
    }

    void runCheckout(plan);
  };

  const submitPhoneModal = () => {
    if (!phoneModalPlan) return;
    const cleaned = phone.replace(/\D/g, "").slice(-10);
    if (cleaned.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number");
      return;
    }
    void runCheckout(phoneModalPlan, cleaned);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-[#f9f9f9] dark:bg-[#0b1220]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563eb]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f9f9f9] dark:bg-[#0b1220] text-zinc-900 dark:text-zinc-100">
      <div className="sticky top-0 z-10 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <Link
            href="/settings/billing"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to billing
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-10 py-10 sm:py-16 pb-20">
        <h1 className="text-3xl sm:text-4xl font-serif text-center text-zinc-900 dark:text-zinc-50 tracking-tight">
          Plans that grow with you
        </h1>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-3 max-w-lg mx-auto">
          {annualAvailable
            ? `Monthly or annual autopay via Razorpay — save ${yearlyDiscountPercent}% on yearly plans.`
            : `Monthly autopay via ${
                checkoutProvider === "cashfree" ? "Cashfree" : "Razorpay"
              }. Card, UPI Autopay, or eNACH — payment details are collected at checkout.`}
        </p>

        {annualAvailable && (
          <div className="mt-8 flex justify-center">
            <div
              className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1 shadow-sm"
              role="group"
              aria-label="Billing interval"
            >
              <button
                type="button"
                onClick={() => setBillingInterval("monthly")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingInterval === "monthly"
                    ? "bg-[#2563eb] text-white"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval("yearly")}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  billingInterval === "yearly"
                    ? "bg-[#2563eb] text-white"
                    : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                Yearly
                <span className="ml-1.5 text-[11px] font-semibold opacity-90">
                  {yearlyDiscountPercent}% off
                </span>
              </button>
            </div>
          </div>
        )}

        {displayPlans.length === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-16">
            No plans available. Please try again later.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-6 xl:gap-8">
            {displayPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const price = formatPlanPrice({
                priceInrMonthly: plan.priceInrMonthly,
                priceInrYearly: plan.priceInrYearly,
                interval: billingInterval,
                yearlyDiscountPercent:
                  plan.yearlyDiscountPercent ?? yearlyDiscountPercent,
              });
              const isHighlighted = Boolean(plan.highlighted);
              const busy = checkingOutPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-7 sm:p-8 flex flex-col min-h-[400px] min-w-[280px] shadow-sm ${
                    isHighlighted
                      ? "border-[#2563eb]/40 bg-white dark:bg-zinc-900/90 ring-1 ring-[#2563eb]/20"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/60"
                  }`}
                >
                  <PlanIcon id={plan.id} />
                  <div className="mt-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                        {plan.name}
                      </h2>
                      {isCurrent && (
                        <span className="text-[10px] uppercase tracking-wider font-medium text-[#2563eb] bg-[#2563eb]/10 px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    {plan.tagline && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {plan.tagline}
                      </p>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">
                      {price.main}
                    </p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                      {price.sub}
                    </p>
                    {price.compareAt != null && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-through">
                        ₹{price.compareAt.toLocaleString("en-IN")} / year
                      </p>
                    )}
                  </div>

                  {plan.description && (
                    <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      {plan.description}
                    </p>
                  )}

                  <div className="mt-6 flex-1">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                      Includes:
                    </p>
                    <ul className="space-y-2.5">
                      {(plan.features || []).map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300"
                        >
                          <Check className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled={
                      isCurrent ||
                      plan.id === "free" ||
                      Boolean(checkingOutPlanId)
                    }
                    onClick={() => startCheckout(plan)}
                    className={`mt-6 w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${
                      isHighlighted && !isCurrent
                        ? "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                        : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white border border-zinc-200 dark:border-zinc-700"
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : null}
                    {isCurrent
                      ? "Current plan"
                      : plan.id === "free"
                        ? "Included"
                        : `Get ${plan.name}`}
                  </button>

                  {plan.priceInrMonthly !== 0 && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 text-center mt-2">
                      Autopay {billingInterval === "yearly" ? "yearly" : "monthly"}{" "}
                      · Cancel anytime
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {phoneModalPlan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Mobile number
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Cashfree requires a 10-digit mobile number for autopay mandate.
            </p>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#2563eb]"
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhoneModalPlan(null);
                  setPhone("");
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={checkingOutPlanId === phoneModalPlan.id}
                onClick={submitPhoneModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
