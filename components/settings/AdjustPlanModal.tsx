"use client";

import { ArrowLeft, Check, Mail, Sparkles, X } from "lucide-react";

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
};

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

export function AdjustPlanModal({
  open,
  onClose,
  currentPlanId,
  plans,
}: {
  open: boolean;
  onClose: () => void;
  currentPlanId: string;
  plans: UpgradePlan[];
}) {
  if (!open) return null;

  const standardPlans = plans.filter((p) => p.id !== "custom");
  const customPlan = plans.find((p) => p.id === "custom");

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
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16">
          <h1 className="text-3xl sm:text-4xl font-serif text-center text-zinc-50 tracking-tight">
            Plans that grow with you
          </h1>
          <p className="text-center text-sm text-zinc-500 mt-3 max-w-lg mx-auto">
            Start free, then upgrade when you need more storage, extractions, or
            API access. All paid plans include document TTL and AI chat context.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {standardPlans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const price = formatPrice(plan);
              const isHighlighted = plan.id === "growth";

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
                    <div className="flex items-center gap-2">
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
                      <p className="text-sm text-zinc-500 mt-1">{plan.tagline}</p>
                    )}
                  </div>

                  <div className="mt-6">
                    <p className="text-3xl font-semibold text-white tracking-tight">
                      {price.main}
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">{price.sub}</p>
                  </div>

                  {isCurrent && plan.id === "free" && (
                    <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 px-3 py-2.5 text-xs text-zinc-400">
                      You&apos;re on the free tier — 5 MB, 2 extractions/month,
                      no API keys.
                    </div>
                  )}

                  <div className="mt-6 flex-1">
                    <p className="text-xs font-medium text-zinc-500 mb-3">
                      {plan.id === "free"
                        ? "Includes:"
                        : plan.id === "custom"
                          ? "Enterprise:"
                          : `Everything in ${plan.id === "starter" ? "Free" : "lower tiers"}, plus:`}
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
                      disabled={isCurrent}
                      onClick={() => {
                        if (plan.id === "free") return;
                        window.location.href = `mailto:hello@doqseal.com?subject=Upgrade%20to%20${encodeURIComponent(plan.name)}`;
                      }}
                      className={`mt-6 w-full py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        isHighlighted && !isCurrent
                          ? "bg-white text-black hover:bg-zinc-200"
                          : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                      }`}
                    >
                      {isCurrent
                        ? "Current plan"
                        : plan.id === "free"
                          ? "Downgrade to Free"
                          : `Get ${plan.name} plan`}
                    </button>
                  )}

                  {!plan.contactSales && plan.priceInrMonthly !== 0 && (
                    <p className="text-[11px] text-zinc-600 text-center mt-2">
                      No commitment — cancel anytime
                    </p>
                  )}
                </div>
              );
            })}

            {customPlan && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 flex flex-col min-h-[420px]">
                <PlanIcon id="custom" />
                <div className="mt-5">
                  <h2 className="text-xl font-semibold text-white">Custom</h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    Per-extraction pricing + storage metering
                  </p>
                </div>
                <div className="mt-6">
                  <p className="text-3xl font-semibold text-white">Custom</p>
                  <p className="text-sm text-zinc-500 mt-1">Contact for pricing</p>
                </div>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {(customPlan.features || []).map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-zinc-300"
                    >
                      <Check className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="mailto:hello@doqseal.com?subject=Custom%20DoqSeal%20plan"
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                >
                  <Mail className="w-4 h-4" />
                  Contact sales
                </a>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-zinc-600 mt-10">
            Online checkout coming soon. Email us to activate a paid plan — we
            update your organisation from the backend.
          </p>
        </div>
      </div>
    </div>
  );
}
