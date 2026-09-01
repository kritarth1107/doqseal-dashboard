"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, Mail, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

export type UpgradePlan = {
  id: string;
  name: string;
  priceInrMonthly: number | null;
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

function formatPrice(plan: UpgradePlan) {
  if (plan.contactSales || plan.priceInrMonthly == null) {
    return { main: "Custom", sub: "Contact for pricing" };
  }
  if (plan.priceInrMonthly === 0) {
    return { main: "₹0", sub: "Free forever" };
  }
  return {
    main: `₹${plan.priceInrMonthly.toLocaleString("en-IN")}`,
    sub: "INR / month",
  };
}

function PlanIcon({ id }: { id: string }) {
  return (
    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
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

export function AdjustPlanModal({
  open,
  onClose,
  currentPlanId,
  plans,
  organisationId,
  checkoutAvailable,
  checkoutMode = "sandbox",
  onCheckoutStarted,
}: {
  open: boolean;
  onClose: () => void;
  currentPlanId: string;
  plans: UpgradePlan[];
  organisationId: string | null;
  checkoutAvailable?: boolean;
  checkoutMode?: "sandbox" | "production";
  onCheckoutStarted?: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<string | null>(
    null
  );

  if (!open) return null;

  const startCheckout = async (plan: UpgradePlan) => {
    if (!organisationId) {
      toast.error("Organisation not selected");
      return;
    }
    if (!checkoutAvailable) {
      toast.error("Payments are not configured yet");
      return;
    }
    if (plan.contactSales || plan.priceInrMonthly == null) {
      window.location.href = `mailto:hello@doqseal.com?subject=Custom%20DoqSeal%20plan`;
      return;
    }
    if (plan.id === "free" || plan.id === currentPlanId) return;

    const cleaned = phone.replace(/\D/g, "").slice(-10);
    if (cleaned.length !== 10) {
      toast.error("Enter a valid 10-digit mobile number for autopay");
      return;
    }

    setCheckingOutPlanId(plan.id);
    try {
      const res = await fetch(
        `/api/organisations/${organisationId}/billing/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organisation-id": organisationId,
          },
          body: JSON.stringify({
            planId: plan.id,
            customerPhone: cleaned,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.subscriptionId) {
        sessionStorage.setItem(
          "doqseal_pending_subscription",
          data.subscriptionId
        );
      }

      onCheckoutStarted?.();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      const sessionId =
        data.paymentSessionId || data.subscriptionSessionId || null;
      if (!sessionId) {
        throw new Error("No payment session returned from Cashfree");
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
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOutPlanId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a] text-zinc-100 animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 border-b border-zinc-800/80">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Upgrade
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-serif text-center text-zinc-50 tracking-tight">
            Plans that grow with you
          </h1>
          <p className="text-center text-sm text-zinc-500 mt-3 max-w-lg mx-auto">
            Monthly autopay via Cashfree. Card, UPI Autopay, or eNACH — cancel
            anytime.
          </p>

          <div className="mt-8 max-w-md mx-auto">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              Mobile number for autopay mandate
            </label>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
            />
          </div>

          {plans.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 mt-16">
              No plans available. Please try again later.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {plans.map((plan) => {
                const isCurrent = plan.id === currentPlanId;
                const price = formatPrice(plan);
                const isHighlighted = Boolean(plan.highlighted);
                const busy = checkingOutPlanId === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`rounded-2xl border p-6 flex flex-col min-h-[420px] ${
                      isHighlighted
                        ? "border-zinc-600 bg-zinc-900/80"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <PlanIcon id={plan.id} />
                    <div className="mt-5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-semibold text-white">
                          {plan.name}
                        </h2>
                        {isCurrent && (
                          <span className="text-[10px] uppercase tracking-wider font-medium text-[#2563eb] bg-[#2563eb]/10 px-2 py-0.5 rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      {plan.tagline && (
                        <p className="text-sm text-zinc-500 mt-1">
                          {plan.tagline}
                        </p>
                      )}
                    </div>

                    <div className="mt-6">
                      <p className="text-3xl font-semibold text-white tracking-tight">
                        {price.main}
                      </p>
                      <p className="text-sm text-zinc-500 mt-1">{price.sub}</p>
                    </div>

                    {plan.description && (
                      <p className="mt-4 text-xs text-zinc-500 leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    <div className="mt-6 flex-1">
                      <p className="text-xs font-medium text-zinc-500 mb-3">
                        Includes:
                      </p>
                      <ul className="space-y-2.5">
                        {(plan.features || []).map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2.5 text-sm text-zinc-300"
                          >
                            <Check className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {plan.contactSales ? (
                      <a
                        href="mailto:hello@doqseal.com?subject=Custom%20DoqSeal%20plan"
                        className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        Contact sales
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          isCurrent ||
                          plan.id === "free" ||
                          Boolean(checkingOutPlanId)
                        }
                        onClick={() => void startCheckout(plan)}
                        className={`mt-6 w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${
                          isHighlighted && !isCurrent
                            ? "bg-white text-black hover:bg-zinc-200"
                            : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
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
                    )}

                    {!plan.contactSales && plan.priceInrMonthly !== 0 && (
                      <p className="text-[11px] text-zinc-600 text-center mt-2">
                        Autopay monthly · Cancel anytime
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
