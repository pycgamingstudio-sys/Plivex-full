import { db } from "@/api/base44Client";
import { useEffect, useState } from "react";
import { Radio, Activity, Users, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";

const ONLINE_WINDOW = 2 * 60 * 1000;  // green: active in the last 2 minutes
const IDLE_WINDOW = 10 * 60 * 1000;   // amber: idle for up to 10 minutes

const ago = (ms) => {
  if (ms < 15000) return "just now";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  return `${Math.floor(ms / 3600000)}h ago`;
};

const money = (v) => `₹${(Number(v) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

// Owner-only live tracking: staff presence + today's sales performance & action stream.
// Strictly scoped to the current workspace — no cross-tenant data is ever shown.
// Collaboration features require at least one teammate; solo owners see an invite prompt.
export default function OwnerTrackingWidgets() {
  const { user } = useAuth();
  const wsId = user?.workspace_id;
  const [staff, setStaff] = useState([]);
  const [teamCount, setTeamCount] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = async () => {
      let records = [];
      try { records = await db.entities.StaffActivity.list("-updated_date", 50); } catch { /* ignore */ }
      if (wsId) records = records.filter((s) => s.workspace_id === wsId);
      setStaff(records);
      let users = [];
      try { users = await db.entities.User.list(); } catch { /* admin-only or empty */ }
      if (wsId) users = users.filter((u) => u.workspace_id === wsId);
      setTeamCount(users.length);
    };
    load();
    const unsubscribe = db.entities.StaffActivity.subscribe(() => load());
    const tick = setInterval(() => { setNow(Date.now()); load(); }, 30000);
    return () => { unsubscribe(); clearInterval(tick); };
  }, [wsId]);

  // Feature rule: live team stats require at least one teammate besides the owner.
  if (teamCount !== null && teamCount <= 1) {
    return (
      <div className="rounded-2xl border border-dashed border-[#6D28D9]/40 bg-[#6D28D9]/5 p-6 text-center shadow-sm">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D28D9]/10 text-[#6D28D9]"><UserPlus className="h-5 w-5" /></span>
        <h3 className="mt-3 text-[15px] font-bold text-slate-900">Invite your team to unlock live collaboration</h3>
        <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-slate-500">Live staff presence and real-time sales activity need at least one teammate in your workspace. Invite your first team member to activate these features.</p>
        <Link to="/team-management" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-4 py-2.5 text-[12px] font-bold text-white hover:bg-[#7C3AED]"><UserPlus className="h-4 w-4" />Invite a team member</Link>
      </div>
    );
  }

  const withStatus = staff.map((s) => {
    const last = new Date(s.last_ping_at || s.updated_date || s.created_date).getTime();
    const elapsed = Math.max(0, now - last);
    return { ...s, elapsed, status: elapsed < ONLINE_WINDOW ? "online" : elapsed < IDLE_WINDOW ? "idle" : "offline" };
  });

  const today = new Date().toISOString().slice(0, 10);
  const todays = withStatus.filter((s) => s.today_date === today);
  const totals = {
    invoices: todays.reduce((a, s) => a + (Number(s.today_invoices) || 0), 0),
    quotations: todays.reduce((a, s) => a + (Number(s.today_quotations) || 0), 0),
    revenue: todays.reduce((a, s) => a + (Number(s.today_revenue) || 0), 0),
  };
  const feed = withStatus
    .flatMap((s) => (Array.isArray(s.actions) ? s.actions.filter((a) => String(a.at).slice(0, 10) === today).map((a) => ({ ...a, who: s.name })) : []))
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 12);

  const dot = (s) => s === "online" ? "bg-emerald-500" : s === "idle" ? "bg-amber-400" : "bg-rose-400";
  const dotLabel = (s) => s === "online" ? "Online" : s === "idle" ? "Idle" : "Offline";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6D28D9]/10 text-[#6D28D9]"><Radio className="h-4 w-4" /></span><h3 className="text-[14px] font-bold text-slate-900">Live Staff Presence</h3></div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Real-time</span>
        </div>
        <div className="mt-3 space-y-2">
          {withStatus.length === 0 && <p className="py-6 text-center text-[12px] text-slate-400">No staff presence yet — activity appears as your team uses the workspace.</p>}
          {withStatus.map((s) => (
            <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-[#E5E7EB] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot(s.status)}`} />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-bold text-slate-900">{s.name}{s.role === "admin" && <span className="ml-1.5 rounded bg-[#6D28D9]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#6D28D9]">Owner</span>}</p>
                  <p className="truncate text-[11px] text-slate-500">{s.current_page || "—"}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">