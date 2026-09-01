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
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
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

async function loadRazorpaySdk() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay SDK"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpaySdk = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
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
  checkoutProvider = "razorpay",
  onCheckoutStarted,
}: {
  open: boolean;
  onClose: () => void;
  currentPlanId: string;
  plans: UpgradePlan[];
  organisationId: string | null;
  checkoutAvailable?: boolean;
  checkoutMode?: "sandbox" | "production";
  checkoutProvider?: "cashfree" | "razorpay" | null;
  onCheckoutStarted?: () => void;
}) {
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<string | null>(
    null
  );
  const [phoneModalPlan, setPhoneModalPlan] = useState<UpgradePlan | null>(null);
  const [phone, setPhone] = useState("");

  if (!open) return null;

  const runCheckout = async (plan: UpgradePlan, customerPhone?: string) => {
    if (!organisationId) {
      toast.error("Organisation not selected");
      return;
    }

    setCheckingOutPlanId(plan.id);
    try {
      const body: Record<string, string> = { planId: plan.id };
      if (customerPhone) body.customerPhone = customerPhone;

      const res = await fetch(
        `/api/organisations/${organisationId}/billing/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-organisation-id": organisationId,
          },
          body: JSON.stringify(body),
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
      setPhoneModalPlan(null);
      setPhone("");

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }

      if (
        data.paymentProvider === "razorpay" ||
        data.razorpaySubscriptionId
      ) {
        if (!data.razorpayKeyId || !data.razorpaySubscriptionId) {
          throw new Error("Incomplete Razorpay checkout session");
        }
        await loadRazorpaySdk();
        if (!window.Razorpay) {
          throw new Error("Razorpay SDK unavailable");
        }
        await new Promise<void>((resolve, reject) => {
          const rzp = new window.Razorpay!({
            key: data.razorpayKeyId,
            subscription_id: data.razorpaySubscriptionId,
            name: "DoqSeal",
            description: `${plan.name} monthly plan`,
            theme: { color: "#2563eb" },
            handler: () => {
              if (data.returnUrl) {
                window.location.href = data.returnUrl;
              } else {
                resolve();
              }
            },
            modal: {
              ondismiss: () => reject(new Error("Checkout cancelled")),
            },
          });
          rzp.open();
        });
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
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckingOutPlanId(null);
    }
  };

  const startCheckout = (plan: UpgradePlan) => {
    if (!checkoutAvailable) {
      toast.error("Payments are not configured yet");
      return;
    }
    if (plan.contactSales || plan.priceInrMonthly == null) {
      window.location.href = `mailto:hello@doqseal.com?subject=Custom%20DoqSeal%20plan`;
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
            Monthly autopay via{" "}
            {checkoutProvider === "cashfree" ? "Cashfree" : "Razorpay"}. Card,
            UPI Autopay, or eNACH — payment details are collected at checkout.
          </p>

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
                        onClick={() => startCheckout(plan)}
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

      {phoneModalPlan && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Mobile number</h3>
            <p className="text-sm text-zinc-400 mt-1">
              Cashfree requires a 10-digit mobile number for autopay mandate.
            </p>
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              placeholder="10-digit mobile"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-4 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#2563eb]"
            />
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhoneModalPlan(null);
                  setPhone("");
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={checkingOutPlanId === phoneModalPlan.id}
                onClick={submitPhoneModal}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white text-black hover:bg-zinc-200 disabled:opacity-50"
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
