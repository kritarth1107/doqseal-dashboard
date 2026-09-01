export type BillingInterval = "monthly" | "yearly";

export const YEARLY_SUBSCRIPTION_DISCOUNT_PERCENT = 10;

export function computeYearlyPriceInr(monthlyInr: number): number {
  return Math.round(
    monthlyInr * 12 * (1 - YEARLY_SUBSCRIPTION_DISCOUNT_PERCENT / 100)
  );
}

export function formatPlanPrice(params: {
  priceInrMonthly: number | null;
  priceInrYearly?: number | null;
  interval: BillingInterval;
  yearlyDiscountPercent?: number;
}) {
  const { priceInrMonthly, interval } = params;
  const discount = params.yearlyDiscountPercent ?? YEARLY_SUBSCRIPTION_DISCOUNT_PERCENT;

  if (priceInrMonthly == null) {
    return { main: "—", sub: "Pricing unavailable" };
  }
  if (priceInrMonthly === 0) {
    return { main: "₹0", sub: "Free forever" };
  }

  if (interval === "yearly") {
    const yearly =
      params.priceInrYearly ?? computeYearlyPriceInr(priceInrMonthly);
    const fullYear = priceInrMonthly * 12;
    return {
      main: `₹${yearly.toLocaleString("en-IN")}`,
      sub: `INR / year · ${discount}% off`,
      compareAt: fullYear,
    };
  }

  return {
    main: `₹${priceInrMonthly.toLocaleString("en-IN")}`,
    sub: "INR / month",
  };
}
