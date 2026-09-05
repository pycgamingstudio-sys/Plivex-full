// Shared workspace identifier & invite-token engine (backend).

const HEX = "0123456789ABCDEF";
const ALNUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomFrom(chars, len) {
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// Workspace ID: WS-[TIMESTAMP_HEX]-[RANDOM_4_HEX]  e.g. WS-6B2A8F-9F2B
export function generateWorkspaceId() {
  return `WS-${Date.now().toString(16).toUpperCase()}-${randomFrom(HEX, 4)}`;
}

// User ID: USR-[TIMESTAMP_HEX]-[RANDOM_6_ALPHANUMERIC]  e.g. USR-6B2A8F-X9K3M2
export function generateUserRef() {
  return `USR-${Date.now().toString(16).toUpperCase()}-${randomFrom(ALNUM, 6)}`;
}

// App role → invite-token role prefix
const ROLE_PREFIX = { manager: "MNG", employee: "S", storekeeper: "SHOP", accountant: "A" };

// [ROLE_PREFIX]-[WORKSPACE_ID]-[UNIQUE_STAMP]  e.g. S-WS-6B2A8F-9F2B-K9X2M4
export function generateInviteToken(role, workspaceId) {
  const prefix = ROLE_PREFIX[role] || "S";
  return `${prefix}-${workspaceId}-${randomFrom(ALNUM, 6)}`;
}