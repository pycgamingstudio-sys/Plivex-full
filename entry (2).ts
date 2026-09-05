import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const code = (body?.code || "").trim().toUpperCase();
    const email = (body?.email || "").trim().toLowerCase();
    if (!code) return Response.json({ error: 'Invite code is required' }, { status: 400 });

    const records = await base44.asServiceRole.entities.InviteCode.filter({ code });
    const record = records.find((r) => !r.used);
    if (!record) return Response.json({ error: 'Invalid or already-used invite code.' }, { status: 404 });
    if (record.email && email && record.email.toLowerCase() !== email) {
      return Response.json({ error: 'This invite was issued for a different email address.' }, { status: 403 });
    }

    // Strict role matrix — invite tokens can never grant owner (that role is
    // permanent and standalone-signup-only). Role-prefixed tokens derive their
    // role ONLY from the explicit token prefix (S- → SALES_EXECUTIVE); legacy
    // 6-digit codes fall back to the stored record role, never admin.
    const PREFIX_ROLE = { S: 'employee', A: 'accountant', SHOP: 'storekeeper', MNG: 'manager', CA: 'accountant' };
    const tokenPrefix = code.includes('-') ? code.split('-')[0].toUpperCase() : '';
    const storedRole = record.role === 'admin' ? 'employee' : (record.role || 'employee');
    const role = (tokenPrefix && PREFIX_ROLE[tokenPrefix]) || storedRole;
    const workspaceId = record.workspace_id || record.created_by_id;

    // Strictly attach the member to the inviter's isolated workspace — they never join or create their own.
    if (user.workspace_id && user.workspace_id !== workspaceId) {
      return Response.json({ error: 'Your account is already bound to another workspace.' }, { status: 409 });
    }
    await base44.asServiceRole.entities.User.update(user.id, { role, workspace_id: workspaceId });
    await base44.asServiceRole.entities.InviteCode.update(record.id, { used: true });

    return Response.json({ ok: true, role, workspaceId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}