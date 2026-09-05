import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { generateWorkspaceId, generateUserRef } from "../../shared/inviteTokens.ts";

// Called only from the fresh-signup path when NO workspace invite code was provided.
// Permanently binds the new independent user as the Business Owner (admin) and
// provisions a brand-new, completely isolated workspace with enterprise identifiers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const updates = { role: 'admin' };
    if (!user.workspace_id) updates.workspace_id = generateWorkspaceId();
    if (!user.user_ref) updates.user_ref = generateUserRef();
    await base44.asServiceRole.entities.User.update(user.id, updates);
    return Response.json({ ok: true, role: 'admin', workspaceId: updates.workspace_id || user.workspace_id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}