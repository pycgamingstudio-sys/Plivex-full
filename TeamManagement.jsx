import { db } from "@/api/base44Client";
import { useEffect, useState } from "react";

import { useRole, ROLES, ROLE_ORDER, getRoleLabel, normalizeRole } from "@/lib/roles";
import { useAuth } from "@/lib/AuthContext";
import { loadState, saveState } from "@/lib/stores";
import { UsersRound, UserPlus, Mail, ShieldCheck, Pencil, Trash2, X, Loader2 } from "lucide-react";

const TEAM_INVITES_KEY = "invoicepulse:teamInvites";

const loadInvites = () => loadState(TEAM_INVITES_KEY, []);
const saveInvites = (list) => saveState(TEAM_INVITES_KEY, list);
const uid = () => `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const roleStyle = (role) => ({
  admin: "bg-[#6D28D9]/10 text-[#6D28D9]",
  manager: "bg-indigo-50 text-indigo-700",
  employee: "bg-blue-50 text-blue-700",
  storekeeper: "bg-teal-50 text-teal-700",
  accountant: "bg-amber-50 text-amber-700",
}[normalizeRole(role)] || "bg-slate-100 text-slate-600");

const statusStyle = (s) => (s === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700");

// Owners are only created via independent signup — the owner role can never be assigned by invite.
const ROLE_OPTIONS = [
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Billing Executive / Sales" },
  { value: "storekeeper", label: "Store Keeper / Inventory" },
  { value: "accountant", label: "Accountant / CA" },
];

export default function TeamManagement() {
  const { role } = useRole();
  const { user } = useAuth();
  const wsId = user?.workspace_id;
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const refresh = async () => {
    setLoading(true);
    // Strict workspace isolation: only members of THIS workspace are listed or counted.
    let users = [];
    try { users = await db.entities.User.list(); } catch { /* admin-only or empty */ }
    if (wsId) users = users.filter((u) => u.workspace_id === wsId);
    const invites = loadInvites();
    const userEmails = new Set(users.map((u) => (u.email || "").toLowerCase()).filter(Boolean));
    const pending = invites.filter((iv) => !userEmails.has(iv.email.toLowerCase()));
    const rows = [
      ...users.map((u) => ({ id: u.id, kind: "user", name: u.full_name || (u.email || "Member").split("@")[0], email: u.email || "—", role: u.role || "employee", status: "Active" })),
      ...pending.map((iv) => ({ id: iv.id, kind: "invite", name: iv.name || iv.email.split("@")[0], email: iv.email, role: iv.role, status: "Pending" })),
    ];
    setMembers(rows);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const addMember = async ({ email, name, role: assignedRole }) => {
    setBusy(true);
    const invites = loadInvites();
    invites.push({ id: uid(), email, name, role: assignedRole, date: new Date().toISOString() });
    saveInvites(invites);
    try { await db.users.inviteUser(email, assignedRole); } catch { /* invite may be queued offline */ }
    let issuedCode = null;
    try {
      const es = loadState("invoicepulse:emailSettings", {});
      const res = await db.functions.invoke("sendTeamInvite", { to: email, name, role: assignedRole, workspaceName: "Plivex", senderEmail: es.senderEmail, appPassword: es.appPassword });
      issuedCode = res?.data?.code || null;
    } catch { /* branded invite email best-effort */ }
    setInviteResult({ email, code: issuedCode });
    setBusy(false);
    setAddOpen(false);
    refresh();
  };

  const updateRole = async (member, newRole) => {
    // The Business Owner role is permanently locked — it can never be changed or downgraded.
    if (normalizeRole(member.role) === "admin") { setEditTarget(null); return; }
    setBusy(true);
    if (member.kind === "user") {
      try { await db.entities.User.update(member.id, { role: newRole }); } catch { /* ignore */ }
    } else {
      const invites = loadInvites().map((iv) => (iv.id === member.id ? { ...iv, role: newRole } : iv));
      saveInvites(invites);
    }
    setBusy(false);
    setEditTarget(null);
    refresh();
  };

  const removeMember = async (member) => {
    if (!window.confirm(`Remove ${member.name} from the workspace?`)) return;
    setBusy(true);
    if (member.kind === "user") {
      // Permanently remove: hard-delete the user record; if the platform restricts
      // that, detach them from this workspace so they no longer appear or count.
      let removed = false;
      try { await db.entities.User.delete(member.id); removed = true; } catch { /* platform may restrict hard delete */ }
      if (!removed) {
        try { await db.entities.User.update(member.id, { workspace_id: "", role: "user" }); } catch { /* ignore */ }
      }
    } else {
      const invites = loadInvites().filter((iv) => iv.id !== member.id);
      saveInvites(invites);
    }
    setBusy(false);
    refresh();
  };

  const counts = ROLE_ORDER.reduce((acc, r) => { acc[r] = members.filter((m) => normalizeRole(m.role) === r).length; return acc; }, {});
  counts.pending = members.filter((m) => m.status === "Pending").length;

  const stats = [
    { label: "Total members", value: members.length, color: "from-[#6D28D9] to-[#7C3AED]" },
    { label: "Owners", value: counts.admin || 0, color: "from-[#6D28D9] to-[#7C3AED]" },
    { label: "Managers", value: counts.manager || 0, color: "from-[#4F46E5] to-[#6366F1]" },
    { label: "Billing / Sales", value: counts.employee || 0, color: "from-[#2563EB] to-[#3B82F6]" },
    { label: "Store Keepers", value: counts.storekeeper || 0, color: "from-[#0D9488] to-[#14B8A6]" },
    { label: "Accountants", value: counts.accountant || 0, color: "from-[#D97706] to-[#F59E0B]" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6D28D9]/10 text-[#6D28D9]"><UsersRound className="h-5 w-5" /></span>
          <div>
            <h1 className="text-[20px] font-bold tracking-[-0.03em] text-slate-900">Team Management</h1>
            <p className="text-[12px] text-slate-500">Invite teammates and control what each role can access.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600">Your role: {getRoleLabel(role)}</span>
          <button onClick={() => setAddOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-3.5 py-2.5 text-[12px] font-bold text-white hover:bg-[#7C3AED]"><UserPlus className="h-4 w-4" />Add member</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-4 text-white shadow-sm`}>
            <p className="text-[22px] font-bold leading-none">{s.value}</p>
            <p className="mt-2 text-[11px] font-semibold text-white/80">{s.label}</p>
          </div>
        ))}
      </div>

      {inviteResult && (
        <div className="fade-up rounded-2xl border border-[#6D28D9]/30 bg-[#6D28D9]/5 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-slate-900">Invite issued for {inviteResult.email}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">Share this workspace invite token if the email doesn't arrive:</p>
              <p className="mt-1 break-all font-mono-ui text-[13px] font-bold text-[#6D28D9]">{inviteResult.code || "Sent via email"}</p>
            </div>
            {inviteResult.code && (
              <button onClick={() => { try { navigator.clipboard.writeText(`${window.location.origin}/register?invite_token=${encodeURIComponent(inviteResult.code)}`); } catch { /* best effort */ } }} className="rounded-lg border border-[#6D28D9] px-3 py-2 text-[11px] font-bold text-[#6D28D9] hover:bg-[#6D28D9]/10">Copy link</button>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
          <h3 className="text-[14px] font-bold text-slate-900">Staff members</h3>
          <span className="text-[11px] text-slate-400">{members.length} total · {counts.pending} pending</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 text-[12px] text-slate-400"><Loader2 className="h-4 w-4 animate-spin" />Loading members…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[12px]">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr><th className="px-4 py-2.5">Name</th><th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">Role</th><th className="px-4 py-2.5">Status</th><th className="px-4 py-2.5 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-bold text-slate-900">{m.name}</td>
                    <td className="px-4 py-3 text-slate-500">{m.email}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${roleStyle(m.role)}`}>{getRoleLabel(m.role)}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyle(m.status)}`}>{m.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {normalizeRole(m.role) !== "admin" ? (
                          <button onClick={() => setEditTarget(m)} className="rounded-lg border border-[#E5E7EB] p-1.5 text-slate-500 hover:bg-slate-50" aria-label="Edit role"><Pencil className="h-3.5 w-3.5" /></button>
                        ) : (
                          <span className="rounded-lg bg-[#6D28D9]/10 px-2 py-1.5 text-[9px] font-bold uppercase text-[#6D28D9]">Owner · Locked</span>
                        )}
                        <button onClick={() => removeMember(m)} className="rounded-lg border border-[#E5E7EB] p-1.5 text-red-500 hover:bg-red-50" aria-label="Delete member"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {members.length === 0 && (<tr><td colSpan={5} className="px-4 py-12 text-center text-[12px] text-slate-400">No team members yet. Add your first teammate to get started.</td></tr>)}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <h3 className="text-[14px] font-bold text-slate-900">Role permissions</h3>
        <div className="mt-3 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_ORDER.map((r) => (
            <div key={r} className="rounded-xl border border-[#E5E7EB] p-4">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${roleStyle(r)}`}>{ROLES[r].label}</span>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{ROLES[r].description}</p>
            </div>
          ))}
        </div>
      </div>

      {addOpen && <MemberModal mode="add" onClose={() => setAddOpen(false)} onSubmit={addMember} busy={busy} />}
      {editTarget && <MemberModal mode="edit" member={editTarget} onClose={() => setEditTarget(null)} onSubmit={(data) => updateRole(editTarget, data.role)} busy={busy} />}
    </div>
  );
}

function MemberModal({ mode, member, onClose, onSubmit, busy }) {
  const [email, setEmail] = useState(member?.email || "");
  const [name, setName] = useState(member?.name || "");
  const [role, setRole] = useState(member?.role || "employee");
  const isAdd = mode === "add";
  const submit = (e) => { e.preventDefault(); if (isAdd && !email.trim()) return; onSubmit({ email: email.trim(), name: name.trim(), role }); };
  const inputCls = "mt-1.5 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2.5 text-[13px] text-slate-900 placeholder:text-slate-300 focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/10";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-[460px] rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between"><h3 className="text-[16px] font-bold text-slate-900">{isAdd ? "Add new team member" : "Edit role"}</h3><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"><X className="h-4 w-4" /></button></div>
        {isAdd ? (
          <div className="mt-4 space-y-3">
            <label className="block text-[12px] font-semibold text-slate-500">Member email address (required)<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="teammate@company.com" /></label>
            <label className="block text-[12px] font-semibold text-slate-500">Member name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rahul" className={inputCls} /></label>
            <label className="block text-[12px] font-semibold text-slate-500">Select role<select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>{ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500"><Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6D28D9]" />An invite email will be sent to this address.</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-[12px]"><p className="font-bold text-slate-900">{member?.name}</p><p className="text-slate-500">{member?.email}</p></div>
            <label className="block text-[12px] font-semibold text-slate-500">Select role<select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>{ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#E5E7EB] px-3.5 py-2 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[#6D28D9] px-3.5 py-2 text-[12px] font-bold text-white hover:bg-[#7C3AED] disabled:opacity-50">{busy ? "Saving..." : "Save"}</button>
        </div>
      </form>
    </div>
  );
}
