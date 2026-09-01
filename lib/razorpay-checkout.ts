export type RazorpayCheckoutPrefill = {
  name?: string;
  email?: string;
  contact?: string;
};

export type RazorpayCheckoutSession = {
  razorpayKeyId: string;
  razorpaySubscriptionId: string;
  returnUrl?: string | null;
  checkoutPrefill?: RazorpayCheckoutPrefill | null;
  description?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
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

function razorpayTheme(isDark: boolean) {
  return {
    color: "#2563eb",
    backdrop_color: isDark ? "#0b1220" : "#f4f4f5",
  };
}

export async function openRazorpaySubscriptionCheckout(params: {
  session: RazorpayCheckoutSession;
  isDark?: boolean;
  onSuccess?: () => void;
  onDismiss?: () => void;
}) {
  const { session, isDark = false, onSuccess, onDismiss } = params;
  await loadRazorpaySdk();
  if (!window.Razorpay) {
    throw new Error("Razorpay SDK unavailable");
  }

  const prefill = session.checkoutPrefill || {};
  const email = prefill.email?.trim();

  return new Promise<void>((resolve, reject) => {
    const rzp = new window.Razorpay!({
      key: session.razorpayKeyId,
      subscription_id: session.razorpaySubscriptionId,
      name: "DoqSeal",
      description: session.description || "DoqSeal subscription",
      theme: razorpayTheme(isDark),
      prefill: {
        name: prefill.name || undefined,
        email: email || undefined,
        contact: prefill.contact || undefined,
      },
      readonly: email ? { email: true } : undefined,
      handler: () => {
        onSuccess?.();
        if (session.returnUrl) {
          window.location.href = session.returnUrl;
        } else {
          resolve();
        }
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();
          reject(new Error("Checkout cancelled"));
        },
        escape: true,
        backdropclose: false,
      },
    });
    rzp.open();
  });
}
