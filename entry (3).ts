import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { sendGmail } from "../../shared/mailer.ts";
import { generateInviteToken, generateWorkspaceId } from "../../shared/inviteTokens.ts";

const ROLE_LABELS = {
  admin: "Owner / Boss",
  manager: "Manager",
  employee: "Billing Executive / Sales",
  storekeeper: "Store Keeper / Inventory",
  accountant: "Accountant / CA",
};

// Unambiguous character set for 6-digit codes
const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function genCode(len = 6) {
  let out = "";
  for (let i = 0; i < len; i++) out += CHARS[Math.floor(Math.random() * CHARS.length)];
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Only admins can send team invites' }, { status: 403 });
    const body = await req.json();
    const { to, name, role, workspaceName, senderEmail, appPassword } = body || {};
    if (!to) return Response.json({ error: 'Recipient email is required' }, { status: 400 });

    const assignedRole = role || "employee";
    // Dynamic role-prefixed invite token: [ROLE_PREFIX]-[WORKSPACE_ID]-[UNIQUE_STAMP]
    let workspaceId = user.workspace_id;
    if (!workspaceId) {
      workspaceId = generateWorkspaceId();
      await base44.asServiceRole.entities.User.update(user.id, { workspace_id: workspaceId });
    }
    const code = generateInviteToken(assignedRole, workspaceId);
    await base44.asServiceRole.entities.InviteCode.create({
      code,
      email: to,
      role: assignedRole,
      workspace_id: workspaceId,
      used: false,
    });

    const roleLabel = ROLE_LABELS[assignedRole] || assignedRole;
    const subject = `You're invited to join ${workspaceName || "Plivex"} — Invite code: ${code}`;
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1e293b;">
      <h2 style="color:#6D28D9;margin-bottom:8px;">You're invited to Plivex</h2>
      <p>Hi ${name || "there"},</p>
      <p>${user.full_name || "Your team owner"} has invited you to join <strong>${workspaceName || "Plivex"}</strong> as <strong>${roleLabel}</strong>.</p>
      <div style="margin:20px 0;padding:18px;border:1px solid #E5E7EB;border-radius:12px;background:#F9FAFB;text-align:center;">
        <p style="margin:0 0 6px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">Your Workspace Invite Token</p>
        <p style="margin:0;font-size:18px;font-weight:bold;letter-spacing:1px;word-break:break-all;color:#6D28D9;">${code}</p>
        <p style="margin:6px 0 0;font-size:10px;color:#94a3b8;">Role-prefixed token · workspace ${workspaceId}</p>
      </div>
      <p><strong>How to join:</strong> Click the button below — the invite token is filled in automatically — or sign up and paste this token into the <em>"Have a Workspace Invite Code?"</em> field. This binds your account to the ${workspaceName || "Plivex"} workspace with your assigned role.</p>
      <p style="margin-top:16px;"><a href="https://plivex.base44.app/register?invite_token=${encodeURIComponent(code)}" style="background:#6D28D9;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">Accept invite &amp; sign up</a></p>
      <p style="margin-top:24px;color:#64748b;font-size:12px;">If you weren't expecting this invite, you can ignore this email. — Plivex Support · plivex.helps@gmail.com</p>
    </div>`;

    await sendGmail({ to, subject, html, senderEmail, appPassword });
    return Response.json({ ok: true, sentTo: to, code });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}