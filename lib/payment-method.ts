export type PaymentMethodSummary = {
  type?: string;
  brand: string;
  last4: string;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  umn?: string | null;
};

export function brandLabel(brand: string) {
  const b = brand.toLowerCase();
  if (b === "visa") return "Visa";
  if (b === "mastercard") return "Mastercard";
  if (b === "rupay") return "RuPay";
  if (b === "upi") return "UPI";
  if (b === "enach") return "eNACH";
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}

export function formatPaymentMethodLabel(method: PaymentMethodSummary) {
  const type = (method.type || "").toLowerCase();
  if (type === "upi") {
    const handle = method.umn || method.last4;
    return handle ? `UPI · ${handle}` : `UPI · •••• ${method.last4}`;
  }
  const brand = brandLabel(method.brand || "Card");
  let label = `${brand} · •••• ${method.last4}`;
  if (method.expiryMonth && method.expiryYear) {
    const mm = String(method.expiryMonth).padStart(2, "0");
    const yy = String(method.expiryYear).slice(-2);
    label += ` · ${mm}/${yy}`;
  }
  return label;
}
