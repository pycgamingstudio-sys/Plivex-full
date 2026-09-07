import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, ShoppingCart, BarChart3, Users, UsersRound, Package, Sparkles, Zap, LayoutGrid, X, RefreshCw, FileText, ScrollText } from "lucide-react";
import DashboardTab from "@/components/dashboard/DashboardTab";
import SalesTab from "@/components/dashboard/SalesTab";
import PurchaseTab from "@/components/dashboard/PurchaseTab";
import ReportsTab from "@/components/dashboard/ReportsTab";
import CrmTab from "@/components/dashboard/CrmTab";
import StockTab from "@/components/dashboard/StockTab";
import TeamManagement from "@/pages/TeamManagement";
import ChatWidget from "@/components/dashboard/ChatWidget";
import ReconciliationTab from "@/components/dashboard/ReconciliationTab";
import WelcomePopup from "@/components/WelcomePopup";
import { seedDashboard } from "@/lib/dashboardData";
import { navItems, HIDDEN_FROM_SIDEBAR } from "@/lib/nav";
import { usePaywall } from "@/lib/paywall";
import { useAuth } from "@/lib/AuthContext";
import { useRole, canAccessTab } from "@/lib/roles";
import AccountProfileModal from "@/components/AccountProfileModal";
import PresenceBeacon from "@/components/PresenceBeacon";
import { processDueReminders } from "@/lib/reminders";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sales", label: "Sales", icon: Receipt },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "crm", label: "Client CRM", icon: Users },
  { id: "stock", label: "Stock", icon: Package },
  { id: "team", label: "Team", icon: UsersRound },
  { id: "reconciliation", label: "Reconcile", icon: RefreshCw },
];

export default function Dashboard({ initialTab }) {
  const [tab, setTab] = useState(initialTab || "dashboard");
  const [intent, setIntent] = useState(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const { isPremium, used, limit, openPaywall, planName, canAccess, trialActive, trialDaysLeft } = usePaywall();
  const { user } = useAuth();
  const { role, isAccountant } = useRole();

  useEffect(() => {
    seedDashboard();
    processDueReminders();
    const sweep = setInterval(processDueReminders, 30 * 60 * 1000);
    return () => clearInterval(sweep);
  }, []);

  const go = (t, i = null) => { setTab(t); setIntent(i); window.scrollTo({ top: 0 }); };
  const createInvoice = () => navigate("/invoice-builder");
  const consume = () => setIntent(null);
  const visibleTabs = TABS.filter((t) => canAccessTab(role, t.id));
  const active = visibleTabs.find((t) => t.id === tab) || visibleTabs[0] || TABS[0];
  const pages = navItems.filter((i) => i.to !== "/" && !HIDDEN_FROM_SIDEBAR.includes(i.to) && (!i.roles || i.roles.includes(role)));
  const teamUnlocked = canAccess("team_management");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-[#E5E7EB] bg-white md:flex">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6D28D9] text-[14px] font-bold text-white">P</div>
          <div><p className="text-[16px] font-bold tracking-[-0.03em]">Plivex</p><p className="text-[10px] text-slate-400">Enterprise billing</p></div>
        </div>
        <nav className="mt-2 space-y-1 px-3">
          {visibleTabs.map((t) => (
            <button key={t.id} onClick={() => go(t.id)} className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-semibold transition-colors ${tab === t.id ? "bg-[#6D28D9] text-white" : "text-slate-600 hover:bg-slate-100"}`}><t.icon className="h-4 w-4" />{t.label}</button>
          ))}
        </nav>
        <div className="mt-4 px-3">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</p>
          <div className="mt-2 space-y-0.5 pr-1">
            {pages.map((p) => {
              const locked = p.pro && !teamUnlocked;
              if (locked) {
                return (
                  <button key={p.to} onClick={openPaywall} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"><p.icon className="h-3.5 w-3.5" />{p.label}<span className="ml-auto rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold text-amber-900">PRO</span></button>
                );
              }
              return (
                <NavLink key={p.to} to={p.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"><p.icon className="h-3.5 w-3.5" />{p.label}</NavLink>
              );
            })}
          </div>
          <div className="mt-3 border-t border-[#E5E7EB] pt-2">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Legal</p>
            <div className="mt-1.5 space-y-0.5">
              <NavLink to="/privacy-policy" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"><FileText className="h-3.5 w-3.5" />Privacy Policy</NavLink>
              <NavLink to="/terms-of-service" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"><ScrollText className="h-3.5 w-3.5" />Terms &amp; Conditions</NavLink>
              <NavLink to="/cancellation-and-refund" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"><Receipt className="h-3.5 w-3.5" />Refund Policy</NavLink>
            </div>
          </div>
        </div>
        <div className="mt-auto border-t border-[#E5E7EB] p-3">
          <button onClick={() => setAccountOpen(true)} className="mb-3 flex w-full items-center gap-2.5 rounded-xl border border-[#E5E7EB] px-2.5 py-2 text-left hover:bg-slate-50">
            {user?.profilePicture ? <img src={user.profilePicture} alt="avatar" className="h-8 w-8 rounded-full object-cover" /> : <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6D28D9] text-[12px] font-bold text-white">{(user?.full_name || user?.email || "U").charAt(0).toUpperCase()}</div>}
            <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold text-slate-900">{user?.full_name || "Account"}</p><p className="truncate text-[10px] text-slate-400">{user?.email || "View profile"}</p></div>
          </button>
        </div>
      </aside>

      <main className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[#E5E7EB] bg-white px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-bold">{active?.label || "Dashboard"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={createInvoice} className="flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2 text-[13px] font-semibold text-white shadow-sm hover:bg-[#5b21b6]"><Zap className="h-4 w-4" />Create Invoice</button>
          </div>
        </header>

        <div className="p-4 md:p-8">
          {tab === "dashboard" && <DashboardTab go={go} createInvoice={createInvoice} />}
          {tab === "sales" && <SalesTab intent={intent} consume={consume} />}
          {tab === "purchase" && <PurchaseTab intent={intent} consume={consume} />}
          {tab === "reports" && <ReportsTab />}
          {tab === "crm" && <CrmTab />}
          {tab === "stock" && <StockTab />}
          {tab === "team" && <TeamManagement />}
          {tab === "reconciliation" && <ReconciliationTab />}
        </div>
      </main>

      <ChatWidget />
      <WelcomePopup />
      <PresenceBeacon />
      {accountOpen && <AccountProfileModal onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
