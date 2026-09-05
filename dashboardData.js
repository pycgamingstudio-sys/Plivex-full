import { KEYS, loadList, saveList } from "@/lib/stores";

export const money2 = (v, c = "INR") => {
  const sym = { INR: "₹", USD: "$", EUR: "€" }[c] || c;
  return `${sym} ${(Number(v) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
export const dateLabel = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export const btnAccent = "inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-3.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#7C3AED]";
export const subPill = (cur, key) => `flex-1 rounded-lg py-2 text-[12px] font-bold transition-colors ${cur === key ? "bg-[#6D28D9] text-white" : "text-slate-500 hover:bg-slate-100"}`;
export const statusBadge = (s) => `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${["Paid", "Sent", "Won"].includes(s) ? "bg-emerald-100 text-emerald-700" : ["Pending", "Negotiation", "Draft"].includes(s) ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`;
export { Empty } from "@/components/dashboard/Empty";

export function seedDashboard() {
  if (localStorage.getItem("invoicepulse:dashboard-seeded")) return;
  if (loadList(KEYS.clients).length === 0) saveList(KEYS.clients, [
    { id: "c1", name: "Aarav Sharma", company: "Sharma Traders", email: "aarav@sharmatraders.in", phone: "9876543210", gstin: "27AAAAA0000A1Z5", address: "Andheri, Mumbai, MH" },
    { id: "c2", name: "Priya Nair", company: "Nair & Co", email: "priya@nairco.in", phone: "9123456780", gstin: "29BBBBB1111B1Z2", address: "Indiranagar, Bengaluru, KA" },
  ]);
  if (loadList(KEYS.quotations).length === 0) saveList(KEYS.quotations, [
    { id: "q1", number: "QTN-0001", clientName: "Aarav Sharma", date: new Date().toISOString().slice(0, 10), total: 24500, status: "sent", taxRate: 18, items: [{ description: "Brand identity pack", quantity: 1, rate: 20000 }, { description: "Stationery design", quantity: 1, rate: 4500 }] },
  ]);
  if (loadList(KEYS.expenses).length === 0) saveList(KEYS.expenses, [
    { id: "e1", vendor: "WeWork", category: "Rent", amount: 18000, date: new Date().toISOString().slice(0, 10), status: "Paid" },
    { id: "e2", vendor: "BESCOM", category: "Utilities", amount: 4200, date: new Date().toISOString().slice(0, 10), status: "Unpaid" },
  ]);
  if (loadList(KEYS.leads).length === 0) saveList(KEYS.leads, [
    { id: "l1", name: "Rohan Mehta", phone: "9988776655", requirement: "Logo + branding package", value: 35000, stage: "New Lead" },
    { id: "l2", name: "Sneha Kapoor", phone: "9123450000", requirement: "Monthly social media retainer", value: 15000, stage: "Negotiation" },
    { id: "l3", name: "Vikram Rao", phone: "9000011111", requirement: "Website redesign", value: 60000, stage: "Won" },
  ]);
  localStorage.setItem("invoicepulse:dashboard-seeded", "1");
}

export function exportCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
}