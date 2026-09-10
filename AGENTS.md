# AGENTS.md

## Project Context

**Plivex** — a smart invoicing & business OS (GST billing, payment automation, CRM, stock).
Vite + React 18 frontend using the Base44 SDK for backend operations (auth, entities, serverless functions).

All source files are **flat in the repo root** (no `src/` directory). A custom Vite plugin
(`aggressiveRootResolver` in `vite.config.js`) resolves bare/aliased imports like `@/lib/stores`
or `@/components/ui/button` by taking the last path segment and looking for a matching file in root.

## Running in Base44

```bash
docker compose -f docker-compose.base44.yml up -d
```

- Node 22 image, repo bind-mounted at `/app`, runs `npm install && npx vite --host 0.0.0.0 --port 5173`.
- Port 3000 (host) → 5173 (Vite). Live reload is active.
- `VITE_BASE44_APP_ID` is required at boot (delivered via `/run/base44/app.env`).
  A development placeholder is generated automatically; replace it with the real Base44 app ID
  (from your Base44 editor URL) to enable backend calls.

## Key Files

- `vite.config.js` — Vite config with `aggressiveRootResolver` plugin (handles flat-root imports).
- `base44Client.js` — Base44 SDK client (`createClient({ appId: VITE_BASE44_APP_ID })`).
- `app-params.js` — reads app ID, token, and function version from URL params / env.
- `AuthContext.jsx` — auth provider; calls `/api/apps/public/...` on mount, falls through to
  GuestDashboard when no token / backend is available.
- `stores.js` — multi-tenant localStorage layer (namespaced per user).
- `paywall.jsx` — trial/paywall provider (localStorage-based).
- `tailwind.config.js` — content paths set to `./*.{js,jsx,ts,tsx}` (flat root, not `src/`).
- `entry*.ts` — Base44 serverless functions (run on Base44 platform, not locally).

## Working Notes

- The app renders a GuestDashboard (landing page) without a valid Base44 backend or token.
  Authenticated routes (Dashboard, Invoice Builder, etc.) need a real `VITE_BASE44_APP_ID` + token.
- Tailwind `content` must include root-level files (fixed from `./src/**/*` to `./*`).
- `@base44/vite-plugin` is in dependencies but NOT used in `vite.config.js`.
- Run `npm run lint` to check code style before finishing changes.
