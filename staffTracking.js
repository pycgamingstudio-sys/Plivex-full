import { db } from "@/api/base44Client";
const PAGE_LABELS = {
  "/": "Workspace Dashboard",
  "/dashboard": "Workspace Dashboard",
  "/invoice-builder": "Creating an invoice",
  "/invoice-history": "Browsing invoice history",
  "/business-profile": "Business profile settings",
  "/client-database": "Viewing Client CRM",
  "/usage-reports": "Usage reports",
  "/settings": "Workspace settings",
  "/templates": "Quotation templates",
  "/payment-logs": "Payment logs",
  "/tax-summary": "Tax summary",
  "/help-center": "Help center",
  "/account-activity": "Account activity",
  "/service-catalog": "Service catalog",
  "/team-management": "Team management",
};

export const describeRoute = (pathname) => PAGE_LABELS[pathname] || `Viewing ${pathname}`;

const getMyRecord = async (userId) => {
  const records = await db.entities.StaffActivity.filter({ created_by_id: userId }, "-updated_date", 1);
  return records[0] || null;
};

// Real-time presence heartbeat — one StaffActivity record per staff member.
export async function pingPresence(pageLabel) {
  try {
    const me = await db.auth.me();
    if (!me?.id) return;
    const existing = await getMyRecord(me.id);
    const payload = {
      name: me.full_name || (me.email || "Member").split("@")[0],
      email: me.email || "",
      role: me.role || "employee",
      workspace_id: me.workspace_id || "",
      current_page: pageLabel,
      last_ping_at: new Date().toISOString(),
    };
    if (existing) {
      await db.entities.StaffActivity.update(existing.id, payload);
    } else {
      await db.entities.StaffActivity.create({ ...payload, today_date: "", today_invoices: 0, today_quotations: 0, today_revenue: 0, actions: [] });
    }
  } catch { /* presence is best-effort */ }
}

// Action stream + daily per-staff aggregation (invoices, quotations, revenue).
export async function trackStaffAction({ label, type, revenue = 0 }) {
  try {
    const me = await db.auth.me();
    if (!me?.id) return;
    const existing = await getMyRecord(me.id);
    if (!existing) return;
    const today = new Date().toISOString().slice(0, 10);
    const sameDay = existing.today_date === today;
    const actions = [{ label, at: new Date().toISOString() }, ...(Array.isArray(existing.actions) ? existing.actions : [])].slice(0, 20);
    await db.entities.StaffActivity.update(existing.id, {
      last_ping_at: new Date().toISOString(),
      actions,
      today_date: today,
      today_invoices: (sameDay ? Number(existing.today_invoices) || 0 : 0) + (type === "invoice" ? 1 : 0),
      today_quotations: (sameDay ? Number(existing.today_quotations) || 0 : 0) + (type === "quotation" ? 1 : 0),
      today_revenue: (sameDay ? Number(existing.today_revenue) || 0 : 0) + (Number(revenue) || 0),
    });
  } catch { /* tracking is best-effort */ }
}