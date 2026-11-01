# Westara — Tesla Owner Services

A responsive, premium EV-ownership support platform built on React, Express, tRPC, Drizzle, and MySQL. Westara is independent and is not affiliated with Tesla, Inc.

## Main routes

- `/` — public overview and service discovery.
- `/login` — secure Manus OAuth sign-in/account creation.
- `/app` — protected owner dashboard with requests, charging discovery, rentals, maintenance, trip planning, My Garage, My Requests, notifications, profile, and feedback.
- `/admin` — administrator-only operations for requests, customer records, feedback, settings, team assignments, and administrator roles.

Dashboard features remain sections within `/app` and `/admin`; they do not create additional top-level pages.

## Run locally in the Manus project

1. Use the initialized project environment so its managed `DATABASE_URL`, OAuth, and Manus service variables are available.
2. Install from the committed lockfile with the project's pinned pnpm toolchain.
3. Run `pnpm dev` (default port 3000; honors `PORT`).
4. Run `pnpm check`, `pnpm test`, and `pnpm build` for checks and the existing Manus/Docker production build.

The Vite app runs through Express so OAuth callbacks, tRPC, health checks, maps configuration, and Preview share one origin. Do not run the client from a separate port for authenticated use.

## Vercel hosting

The repository includes a Vercel Express entrypoint (`index.ts`) that directly imports and instantiates Express, a shared app factory (`server/_core/app.ts`), an explicit `vercel.json`, and the `pnpm build:vercel` Vite build. Vercel builds static files into the generated root `public/` directory and serves them from its CDN; the Express function handles `/api/*`, OAuth, and the custom `/404` response. Extensionless frontend routes (`/`, `/login`, `/app`, and `/admin`) are served by the Express HTML fallback, without internal Vercel rewrites. The generated root `public/` directory is intentionally ignored by Git; Vercel creates it during each build.

To deploy, import `lezzley02/Westara` into Vercel with the repository root as the project root, then add the environment variables below to the appropriate Production and Preview environments. Vercel's build invokes `pnpm build:vercel` through `vercel.json`. The current Manus deployment remains available through its existing `pnpm build` and `pnpm start` commands.

### Vercel environment variables

Set these in Vercel Project Settings → Environment Variables. `.env.example` contains blank names only; no values or credentials are committed.

| Variables | Use | Exposure |
| --- | --- | --- |
| `MANUS_PROJECT_ID`, `MANUS_OAUTH_PORTAL_URL`, `MANUS_API_URL`, `MANUS_API_BROWSER_KEY` | Vite build time, because the build emits `/api/platform/config.js` for OAuth and the Maps browser proxy | The app serializes only this explicit browser-safe allowlist; `MANUS_API_BROWSER_KEY` is a public/browser key, not a server secret. Changes require a new deployment. |
| `DATABASE_URL`, `MANUS_OAUTH_API_URL`, `MANUS_JWT_SECRET`, `OWNER_OPEN_ID` | Express function runtime | Private; add only in Vercel's protected environment-variable settings, never in source or client build variables. |
| `MANUS_API_KEY` | Express function runtime when using Manus storage helpers | Private; never expose it to the browser. |

`MANUS_API_URL` is needed at build time for browser-safe Maps configuration and at runtime by the server storage helper. Do not rename variables to `VITE_*` or add private variables to the generated browser configuration. Vercel's `PORT` is managed by the platform; the exported function does not start a custom listener.

The OAuth client constructs its callback from the deployed browser origin. Add the exact callback URL `https://<your-production-vercel-domain>/api/oauth/callback` to the Manus OAuth redirect allowlist; add Preview domains too only if you intend to use them and the OAuth policy accepts them. The app retains `HttpOnly; SameSite=None; Secure` session cookies for HTTPS.

Vercel functions must be able to reach the configured MySQL endpoint over TLS. The Manus-managed database may have platform-specific network access rules; confirm its external connectivity and connection limits before using it from Vercel. If it is not reachable, use a Vercel-accessible MySQL provider and migrate the existing schema/data through an authorized process. The project does not provision that database, add environment-variable values, or run migrations during the Vercel build. Development and production must not be treated as isolated if pointed at the same database.

The repository has been imported into Vercel and an initial build was attempted. That build did not detect Express in the root entrypoint; the entrypoint has since been corrected and pushed, so start a fresh deployment and confirm the build succeeds. No Vercel environment values or secrets were copied or transferred by this session.

## Database

- `drizzle/schema.ts` contains account, garage, request, messaging, notification, favorites, trip, feedback, and settings records.
- The checked-in incremental migration preserves existing users and adds feature tables/nullable profile fields.
- `pnpm db:migrate` applies checked-in migrations. Review additive migrations before applying; the managed database is shared by development and production, so do not create test customer records.
- Customer reads/writes are scoped to the signed-in user's ID. Private administrator notes are separate from customer-visible messages.
- New submissions start in `new`. If an administrator marks a service unavailable, the UI reflects the pause and the server rejects new requests for it. An unconfigured provider means the request is not a confirmed booking, payment, or dispatch.

## Authentication and administrator bootstrap

- Sign-in uses the secure Manus OAuth flow; Westara does not store provider passwords or simulate accounts.
- The business owner's OAuth `openId` is held in `OWNER_OPEN_ID`. On sign-in, the server compares the authenticated ID and grants the initial administrator role to that account. The owner cannot be demoted through the app.
- The configured owner should sign in once after deployment. Other accounts can only be promoted by an existing administrator in Settings; server procedures enforce roles.
- On Vercel, configure the OAuth callback allowlist and private environment values before expecting sign-in to work.

## Maps, imagery, and provider boundaries

- The Google Maps browser proxy uses the allowlisted public runtime configuration; the UI falls back to an illustrated map when Maps is unavailable.
- Optimized hero and travel images are stored in `client/public/images/` and use ordinary `/images/...` URLs, so they work on both Manus and Vercel without Manus-only storage routes.
- Charging stations, connector details, map pins, and rental prices are illustrative until verified providers are connected. Route-matched live charging availability is not connected.
- Email, SMS, payments, roadside dispatch, and third-party booking are not claimed as active. In-app messages and request-status notifications are database-backed; external delivery/fulfillment requires approved providers and credentials.
- Location is requested only after an explicit user action. The server rejects coordinates unless the request also includes the user's consent.
