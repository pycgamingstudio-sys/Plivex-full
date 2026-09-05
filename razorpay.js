export const RAZORPAY_KEY = "rzp_test_TPUR0A2OtTamoY";

export function loadRazorpay() {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

export async function openRazorpayCheckout({ amount, planName, userName, userEmail, onSuccess }) {
  const ok = await loadRazorpay();
  if (!ok || !window.Razorpay) return false;
  const inst = new window.Razorpay({
    key: RAZORPAY_KEY,
    amount,
    currency: "INR",
    name: "Plivex",
    description: planName,
    prefill: { name: userName || "", email: userEmail || "" },
    theme: { color: "#6D28D9" },
    handler: () => { onSuccess && onSuccess(); },
  });
  inst.open();
  return true;
}