import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { Link } from "react-router-dom";
import { KEYS, pushItem, genId, deductStockForInvoice, loadList, loadState, removeState, tenantKey } from "@/lib/stores";
import { useAuth } from "@/lib/AuthContext";
import { RAZORPAY_KEY, loadRazorpay } from "@/lib/razorpay";
import { usePaywall } from "@/lib/paywall";
import { trackStaffAction } from "@/lib/staffTracking";
import PresenceBeacon from "@/components/PresenceBeacon";
import HSNAutocomplete from "@/components/HSNAutocomplete";
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