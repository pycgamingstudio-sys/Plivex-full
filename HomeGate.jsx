import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import Dashboard from "@/pages/Dashboard";
import GuestDashboard from "@/pages/GuestDashboard";

// Public landing gate: guests land on the demo dashboard without any account;
// authenticated users land on their real workspace. Pending guest intents
// (stored before sign-in) are resumed automatically.
export default function HomeGate() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      try {
        const p = sessionStorage.getItem("plivex:pendingAction");
        if (p) { sessionStorage.removeItem("plivex:pendingAction"); setPending(p); }
      } catch { /* ignore */ }
    }
  }, [isAuthenticated]);

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <GuestDashboard />;

  if (pending === "create-invoice") return <Navigate to="/invoice-builder" replace />;
  if (pending === "settings") return <Navigate to="/settings" replace />;
  if (pending === "add-stock") return <Dashboard initialTab="stock" />;
  if (pending === "open-crm") return <Dashboard initialTab="crm" />;
  if (pending === "export-gst") return <Dashboard initialTab="sales" />;
  return <Dashboard />;
}