import { db } from "@/api/base44Client";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, MessageCircle, ArrowRight, X, Search, ChevronDown, ChevronRight, Paperclip, PenLine, FileText, CheckCircle2, Clock, Receipt as ReceiptIcon, RotateCcw, Bell } from "lucide-react";
import { KEYS, loadList, saveList, removeItem, genId, loadState, saveState } from "@/lib/stores";
import { inputCls, btnGhost } from "@/lib/ui";
import { money2, dateLabel, btnAccent, subPill, statusBadge, Empty } from "@/lib/dashboardData";
import { paginate, totalPages, PAGE_SIZE } from "@/lib/paging";
import { usePaywall } from "@/lib/paywall";
import { useRole } from "@/lib/roles";

import { trackStaffAction } from "@/lib/staffTracking";
import SummaryCard from "@/components/dashboard/SummaryCard";

const BANKS = ["HDFC Bank · 501000123456789", "ICICI Bank · 623400987654321", "State Bank of India · 30012345678901", "Axis Bank · 910000456789012"];

export default function SalesTab({ intent, onConsumeIntent }) {
  const { requestAction } = usePaywall();
  const { isAccountant } = useRole();
  const [sub, setSub] = useState("invoices");
  const [invoices, setInvoices] = useState(() => loadList(KEYS.history));
  const [quotations, setQuotations] = useState(() => loadList(KEYS.quotations));
  const [paylog] = useState(() => loadList(KEYS.paymentLogs));
  const [view, setView] = useState(null);
  const [qOpen, setQOpen] = useState(false);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  useEffect(() => { if (intent === "new-quotation") { setSub("quotations"); setQOpen(true); onConsumeIntent(); } }, [intent]);

  const statusOf = (it) => (it.status === "Paid" || it.status === "Pending" ? it.status : (paylog.some((l) => l.status === "paid" && l.invoiceNumber === it.number) ? "Paid" : "Pending"));

  const filteredInv = useMemo(() => invoices.filter((it) => {
    const hay = `${it.clientName} ${it.number} ${it.businessName}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (from && new Date(it.issueDate) < new Date(from)) return false;
    if (to && new Date(it.issueDate) > new Date(to)) return false;
    if (statusFilter !== "all" && statusOf(it) !== statusFilter) return false;
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [invoices, q, from, to, statusFilter, paylog]);

  const filteredQuo = useMemo(() => quotations.filter((qt) => {
    const hay = `${qt.clientName} ${qt.number}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (from && new Date(qt.date) < new Date(from)) return false;
    if (to && new Date(qt.date) > new Date(to)) return false;
    return true;
  }), [quotations, q, from, to]);

  const list = sub === "invoices" ? filteredInv : filteredQuo;
  const rows = paginate(list, page);
  const pages = totalPages(list);

  const delInv = (id) => { setInvoices(removeItem(KEYS.history, id)); setExpanded(null); };
  const delQuo = (id) => { setQuotations(removeItem(KEYS.quotations, id)); setExpanded(null); };
  const sendReminder = async (it) => {
    const clients = loadList(KEYS.clients);
    const match = clients.find((c) => (c.name || "").toLowerCase() === (it.clientName || "").toLowerCase());
    const email = (match && match.email) || window.prompt(`Enter client email to send a payment reminder for ${it.clientName || it.number}:`);
    if (!email) return;
    const es = loadState("invoicepulse:emailSettings", {});
    try {
      await db.functions.invoke("sendPaymentReminder", { to: email, clientName: it.clientName, invoiceNumber: it.number, amount: money2(it.total, it.currency), dueDate: it.dueDate, senderEmail: es.senderEmail, appPassword: es.appPassword });
      alert("Payment reminder sent to " + email);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || "Failed to send reminder";
      alert("Reminder failed: " + msg);
    }
  };
  const share = (it) => { if (!requestAction()) return; const msg = `Hello ${it.clientName || "there"}, your invoice ${it.number || ""} for ${money2(it.total, it.currency)} from Plivex is ready.`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank"); };
  const convert = (qt) => { if (!requestAction()) return; const draft = loadState(KEYS.draft, {}); saveState(KEYS.draft, { ...draft, client: { ...draft.client, name: qt.clientName }, number: qt.number, items: qt.items || draft.items, taxRate: qt.taxRate ?? draft.taxRate }); navigate("/invoice-builder"); };
  const saveQuotation = (qt) => {
    if (!requestAction()) return;
    const next = [qt, ...quotations];
    setQuotations(next); saveList(KEYS.quotations, next); setQOpen(false);
    trackStaffAction({ label: `Quotation ${qt.number} created for ${qt.clientName}`, type: "quotation" });
  };
  const resetFilters = () => { setQ(""); setFrom(""); setTo(""); setStatusFilter("all"); setPage(1); };
  const toggleStatus = (it) => {
    if (sub === "invoices") {
      const next = statusOf(it) === "Paid" ? "Pending" : "Paid";
      const updated = invoices.map((x) => (x.id === it.id ? { ...x, status: next } : x));
      setInvoices(updated); saveList(KEYS.history, updated);
    } else {
      const next = it.status === "sent" ? "draft" : "sent";
      const updated = quotations.map((x) => (x.id === it.id ? { ...x, status: next } : x));
      setQuotations(updated); saveList(KEYS.quotations, updated);
    }
  };

  const paidCount = invoices.filter((it) => statusOf(it) === "Paid").length;
  const pendingCount = invoices.length - paidCount;