import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { Link } from "react-router-dom";
import { KEYS, pushItem, genId, deductStockForInvoice, loadList, loadState, removeState, tenantKey } from "./stores";
import { useAuth } from "./AuthContext";
import { RAZORPAY_KEY, loadRazorpay } from "./razorpay";
import { usePaywall } from "./paywall";
import { trackStaffAction } from "./staffTracking";
import PresenceBeacon from "./PresenceBeacon";
import HSNAutocomplete from "./HSNAutocomplete";
import {
  AlertCircle,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Download,
  FilePenLine,
  FilePlus2,
  FileText,
  ImagePlus,
  Info,
  History,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Pencil,
  Plus,
  RotateCcw,
  Scissors,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

const initialInvoice = {
  business: { name: "", email: "", phone: "", gstin: "", address: "" },
  client: { name: "", company: "", email: "", phone: "", gstin: "", address: "" },
  number: "", issueDate: "", dueDate: "", currency: "INR",
  items: [
    { id: "item-1", description: "", quantity: "", rate: "", gstRate: 18 },
  ],
  taxRate: 18, taxMode: "split", discountType: "percent", discount: "",
  notes: "", terms: "", upiId: "",
};

const inputClass = "mt-1.5 w-full rounded-lg border bg-card px-3 py-2.5 text-[13px] text-foreground transition-colors placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/10";
const smallInputClass = "w-full rounded-md border bg-card px-2.5 py-2 text-[13px] text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10";
const descInputClass = "w-full min-w-0 rounded-lg border bg-card px-3.5 py-3 text-[14px] text-foreground transition-colors placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/10";
const itemDescInputClass = "w-full min-w-[260px] rounded-lg border bg-card px-3.5 text-[14px] text-black transition-colors placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/10";
const invalidInputClass = "border-destructive focus:border-destructive focus:ring-destructive/10";
const withErrorClass = (baseClass, error) => `${baseClass} ${error ? invalidInputClass : ""}`;

function useStored(key, fallback, resetMarker) {
  const scopedKey = tenantKey(key);
  const [value, setValue] = useState(() => {
    try {
      if (resetMarker && localStorage.getItem(tenantKey(resetMarker)) !== "1") {
        localStorage.removeItem(scopedKey);
        localStorage.setItem(tenantKey(resetMarker), "1");
        return fallback;
      }
      const stored = localStorage.getItem(scopedKey);
      return stored ? JSON.parse(stored) : fallback;
    } catch { return fallback; }
  });
  useEffect(() => { try { localStorage.setItem(scopedKey, JSON.stringify(value)); } catch { /* local persistence is best effort */ } }, [scopedKey, value]);
  return [value, setValue];
}

function Field({ label, children, hint, error }) {
  return (
    <label className="block text-[12px] font-semibold text-muted-foreground">
      <span className="flex items-center justify-between">{label}{hint && <span className="font-normal opacity-70">{hint}</span>}</span>
      {children}
      {error && <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive"><AlertCircle className="h-3 w-3" />{error}</span>}
    </label>
  );
}

function SectionCard({ icon: Icon, title, eyebrow, children, action }) {
  return (
    <section className="rounded-xl border bg-card p-4 transition-colors sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            {eyebrow && (
              <p className="text-xs font-medium text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}

export default function Home() {
  const [invoice, setInvoice] = useState(initialInvoice);

  return (
    <div className="container mx-auto max-w-5xl p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Invoice Builder</h1>
        <Link to="/invoice-history" className="text-sm text-primary hover:underline">
          Invoice History
        </Link>
      </div>

      <SectionCard icon={FileText} title="Invoice Details" eyebrow="General">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Invoice Number">
            <input
              type="text"
              className={inputClass}
              placeholder="INV-001"
              value={invoice.number}
              onChange={(e) => setInvoice({ ...invoice, number: e.target.value })}
            />
          </Field>
          <Field label="Issue Date">
            <input
              type="date"
              className={inputClass}
              value={invoice.issueDate}
              onChange={(e) => setInvoice({ ...invoice, issueDate: e.target.value })}
            />
          </Field>
              </div>
    </SectionCard>
  </div>
);
}
