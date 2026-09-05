import { useState, useEffect } from "react";

// ──────────────────────────────────────────────────────────────────────────
// Multi-tenant storage layer.
// Every record is namespaced under invoicepulse:u:<tenantId>:<base> so that
// invoices, clients, expenses and workspace state can NEVER leak, merge or be
// cross-visible between different authenticated users on the same device.
// The tenant id is the logged-in user's id (set by AuthContext after auth).
// ──────────────────────────────────────────────────────────────────────────

// Base storage keys (the tenant namespace is applied transparently below).
export const KEYS = {
  history: "history",
  businessProfile: "businessProfile",
  clients: "clients",
  templates: "templates",
  paymentLogs: "paymentLogs",
  activity: "activity",
  settings: "settings",
  services: "services",
  quotations: "quotations",
  expenses: "expenses",
  leads: "leads",
  stock: "stock",
  pendingClient: "pendingClient",
  draft: "draft",
};

const NAMESPACE = "invoicepulse";
let _tenantId = "guest";

export function setTenantId(id) {
  _tenantId = id ? String(id) : "guest";
  migrateLegacyData(_tenantId);
}

export function getTenantId() {
  return _tenantId;
}

// Strict per-tenant key — every record lives under invoicepulse:u:<tenantId>:<base>.
export function tenantKey(key) {
  const base = String(key || "").replace(/^(invoicepulse:|invoicepulse-)/, "");
  return `${NAMESPACE}:u:${_tenantId}:${base}`;
}

// One-time migration: move pre-isolation (un-namespaced) data into this tenant's
// namespace, then drop the legacy keys so they can never leak to another account.
const MIGRATED_FLAG = "invoicepulse:migrated";
const LEGACY_MAP = {
  "invoicepulse:history": "history",
  "invoicepulse:businessProfile": "businessProfile",
  "invoicepulse:clients": "clients",
  "invoicepulse:templates": "templates",
  "invoicepulse:paymentLogs": "paymentLogs",
  "invoicepulse:activity": "activity",
  "invoicepulse:settings": "settings",
  "invoicepulse:services": "services",
  "invoicepulse:quotations": "quotations",
  "invoicepulse:expenses": "expenses",
  "invoicepulse:leads": "leads",
  "invoicepulse:stock": "stock",
  "invoicepulse:pendingClient": "pendingClient",
  "invoicepulse:cardVisibility": "cardVisibility",
  "invoicepulse:teamInvites": "teamInvites",
  "invoicepulse:emailSettings": "emailSettings",
  "invoicepulse_usage_count": "invoicepulse_usage_count",
  "is_premium_user": "is_premium_user",
  "invoicepulse-dark": "dark",
  "invoicepulse-draft": "draft",
};
function migrateLegacyData(tenantId) {
  try {
    if (localStorage.getItem(`${MIGRATED_FLAG}:${tenantId}`)) return;
    Object.entries(LEGACY_MAP).forEach(([legacy, base]) => {
      const scoped = `${NAMESPACE}:u:${tenantId}:${base}`;
      if (localStorage.getItem(scoped) === null && localStorage.getItem(legacy) !== null) {
        localStorage.setItem(scoped, localStorage.getItem(legacy));
      }
    });
    // Drop all legacy un-namespaced keys once copied into this tenant.
    Object.keys(LEGACY_MAP).forEach((legacy) => localStorage.removeItem(legacy));
    localStorage.setItem(`${MIGRATED_FLAG}:${tenantId}`, "1");
  } catch { /* best effort */ }
}

export function genId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function loadList(key) {
  try { const s = localStorage.getItem(tenantKey(key)); return s ? JSON.parse(s) : []; } catch { return []; }
}
export function saveList(key, items) {
  try { localStorage.setItem(tenantKey(key), JSON.stringify(items)); } catch { /* best effort */ }
}
export function pushItem(key, item) {
  const next = [item, ...loadList(key)];
  saveList(key, next);
  return next;
}
export function removeItem(key, id) {
  const next = loadList(key).filter((it) => it.id !== id);
  saveList(key, next);
  return next;
}

export function loadState(key, fallback) {
  try { const s = localStorage.getItem(tenantKey(key)); return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
export function saveState(key, value) {
  try { localStorage.setItem(tenantKey(key), JSON.stringify(value)); } catch { /* best effort */ }
}
export function removeState(key) {
  try { localStorage.removeItem(tenantKey(key)); } catch { /* best effort */ }
}

export function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => loadState(key, fallback));
  useEffect(() => { saveState(key, value); }, [key, value]);
  return [value, setValue];
}

const _deductedInvoices = new Set();

export function deductStockForInvoice(invoice) {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const key = String(invoice?.number || invoice?.issueDate || "draft") + "|" + items.map((i) => `${i.description}:${i.quantity}`).join(",");
  if (_deductedInvoices.has(key)) return false;
  const list = loadList(KEYS.stock);
  let changed = false;
  items.forEach((it) => {
    const desc = String(it.description || "").trim().toLowerCase();
    const qty = Math.max(0, Number(it.quantity) || 0);
    if (!desc || !qty) return;
    const match = list.find((p) => String(p.name || "").trim().toLowerCase() === desc);
    if (match) { match.quantity = Math.max(0, (Number(match.quantity) || 0) - qty); changed = true; }
  });
  if (changed) saveList(KEYS.stock, list);
  _deductedInvoices.add(key);
  return changed;
}