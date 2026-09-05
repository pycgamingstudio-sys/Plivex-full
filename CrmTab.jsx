import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, X, ArrowRight, UserPlus, Search, ChevronDown, ChevronRight, Users, Target, Wallet } from "lucide-react";
import ClientRiskBadge from "@/components/ClientRiskBadge";
import { KEYS, loadList, saveList, removeItem, genId } from "@/lib/stores";
import { inputCls, btnGhost } from "@/lib/ui";
import { money2, btnAccent, subPill, Empty } from "@/lib/dashboardData";
import { paginate, totalPages } from "@/lib/paging";
import { usePaywall } from "@/lib/paywall";
import SummaryCard from "@/components/dashboard/SummaryCard";

const STAGES = ["New Lead", "Negotiation", "Won", "Lost"];
const blankClient = { name: "", company: "", email: "", phone: "", gstin: "", address: "" };
const blankLead = { name: "", phone: "", requirement: "", value: "" };

export default function CrmTab({ intent, onConsumeIntent }) {
  const { requestAction } = usePaywall();
  const [sub, setSub] = useState("clients");
  const [clients, setClients] = useState(() => loadList(KEYS.clients));
  const [leads, setLeads] = useState(() => loadList(KEYS.leads));
  const [invoices] = useState(() => loadList(KEYS.history));
  const [clientModal, setClientModal] = useState(null);
  const [leadModal, setLeadModal] = useState(false);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (intent === "new-client") { setSub("clients"); setClientModal({ ...blankClient }); onConsumeIntent(); }
    if (intent === "new-lead") { setSub("leads"); setLeadModal(true); onConsumeIntent(); }
  }, [intent]);

  const persistClients = (n) => { setClients(n); saveList(KEYS.clients, n); };
  const persistLeads = (n) => { setLeads(n); saveList(KEYS.leads, n); };
  const saveClient = (entry) => { if (!entry.name.trim()) return; if (!requestAction()) return; const n = clientModal.id ? clients.map((c) => (c.id === clientModal.id ? { ...entry, id: clientModal.id } : c)) : [{ ...entry, id: genId("client") }, ...clients]; persistClients(n); setClientModal(null); };
  const saveLead = (entry) => { if (!entry.name.trim()) return; if (!requestAction()) return; persistLeads([{ ...entry, id: genId("lead"), stage: "New Lead", value: Number(entry.value) || 0 }, ...leads]); setLeadModal(false); };
  const moveLead = (id, stage) => persistLeads(leads.map((l) => (l.id === id ? { ...l, stage } : l)));
  const invoiceFor = (c) => { localStorage.setItem(KEYS.pendingClient, JSON.stringify({ name: c.name, company: c.company, email: c.email, phone: c.phone, gstin: c.gstin, address: c.address })); navigate("/invoice-builder"); };

  const filteredClients = useMemo(() => clients.filter((c) => {
    const hay = `${c.name} ${c.company} ${c.email} ${c.phone} ${c.gstin}`.toLowerCase();
    return !q || hay.includes(q.toLowerCase());
  }), [clients, q]);
  const rows = paginate(filteredClients, page);
  const pages = totalPages(filteredClients);

  const activeLeads = leads.filter((l) => l.stage === "New Lead" || l.stage === "Negotiation");
  const pipelineValue = activeLeads.reduce((s, l) => s + Number(l.value || 0), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total Clients" value={String(clients.length)} gradient="bg-gradient-to-br from-[#6D28D9] to-[#7C3AED]" icon={Users} badge="directory" />
        <SummaryCard label="Active Leads" value={String(activeLeads.length)} gradient="bg-gradient-to-br from-[#2563EB] to-[#3B82F6]" icon={Target} badge="open" />
        <SummaryCard label="Pipeline Value" value={money2(pipelineValue)} gradient="bg-gradient-to-br from-[#059669] to-[#10B981]" icon={Wallet} badge="forecast" />
      </div>

      <div className="flex gap-1.5 rounded-xl border border-[#E5E7EB] bg-white p-1.5">
        <button onClick={() => { setSub("clients"); setPage(1); }} className={subPill(sub, "clients")}>Clients Directory</button>
        <button onClick={() => setSub("leads")} className={subPill(sub, "leads")}>Lead Management</button>
      </div>

      {sub === "clients" ? (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#E5E7EB] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search clients…" className={`${inputCls} pl-9`} />
            </div>
            <button onClick={() => setClientModal({ ...blankClient })} className={btnAccent}><Plus className="h-3.5 w-3.5" />Add client</button>
          </div>

          {filteredClients.length === 0 ? (
            <Empty label="No clients match your search. Add a client to invoice them in one click." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[12px]">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="w-8 px-3 py-2.5" />
                    <th className="px-3 py-2.5">Name</th>
                    <th className="px-3 py-2.5">Company</th>
                    <th className="px-3 py-2.5">Contact</th>
                    <th className="px-3 py-2.5">GSTIN</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {rows.map((c) => {
                    const open = expanded === c.id;
                    const history = invoices.filter((it) => it.clientName === c.name);
                    return (
                      <>
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-3 py-3">
                            <button onClick={() => setExpanded(open ? null : c.id)} className="rounded-md p-1 text-slate-400 hover:bg-slate-100" aria-label="Expand">