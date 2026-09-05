import { Outlet } from "react-router-dom";
import { usePaywall } from "@/lib/paywall";
import SubscriptionLockScreen from "@/components/SubscriptionLockScreen";

// Absolute paywall: the moment the 14-day trial expires with no paid plan,
// every internal route locks and renders the mandatory upgrade screen.
// Legal & policy routes sit outside this gate and stay public.
export default function TrialGate() {
  const { isPremium, trialActive } = usePaywall();
  if (!isPremium && !trialActive) return <SubscriptionLockScreen />;
  return <Outlet />;
}