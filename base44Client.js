import { createClient } from "@base44/sdk";

// appId is safe to expose publicly - it's the same ID visible in your
// Base44 editor URL. Do NOT put secret/service-role API keys here: this
// file ships inside your public frontend bundle, and anyone can read it.
const appId = import.meta.env.VITE_BASE44_APP_ID;

// Optional: only needed if your app is served from a custom Base44 host.
// Leave VITE_BASE44_APP_BASE_URL unset to use the SDK default.
const serverUrl = import.meta.env.VITE_BASE44_APP_BASE_URL;

export const base44 = createClient({
  appId,
  ...(serverUrl ? { serverUrl } : {}),
});

export const db = base44;
export default base44;
