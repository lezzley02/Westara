# Westara — Tesla Owner Services

A responsive, premium EV-ownership support platform built on React, Express, tRPC, Drizzle, and the Manus managed database/authentication services. Westara is independent and is not affiliated with Tesla, Inc.

## Main routes

- `/` — public overview and service discovery.
- `/login` — secure Manus OAuth sign-in/account creation.
- `/app` — protected owner dashboard containing service requests, charging discovery, rentals, maintenance, trip planning, My Garage, My Requests, notifications, profile, and feedback.
- `/admin` — administrator-only operations for requests, customer records, feedback, settings, service team assignments, and administrator roles.

Dashboard features are sections within `/app`; they do not create additional top-level pages.

## Run locally

1. Use the initialized project environment so the managed `DATABASE_URL`, OAuth, and Manus service variables are available.
2. Install from the committed lockfile with the project's pinned pnpm toolchain.
3. Start the server with `pnpm dev` (default port 3000; honors `PORT`).
4. Check source with `pnpm check`, tests with `pnpm test`, and build with `pnpm build`.

The Vite app runs through Express so OAuth callbacks, tRPC, health checks, maps configuration, and Preview share the expected origin. Do not run the client from a separate port for authenticated use.

## Database

- `drizzle/schema.ts` contains the account, garage, request, messaging, notification, favorites, trip, feedback, and settings records.
- Existing users are retained. The checked-in incremental migration adds nullable profile fields and the new feature tables.
- `pnpm db:migrate` applies checked-in migrations. For a schema change, update the Drizzle schema, generate and review an additive migration, then apply it. The managed database is shared by development and production; do not add or alter customer records as test fixtures.
- Customer reads and writes are scoped to the signed-in user's ID. Internal request notes are stored separately from customer-visible messages.
- New submissions start in the `new` state. When an administrator marks a service `unavailable`, the customer UI reflects the pause and the server rejects new requests for that service; `not_configured` remains request-only rather than claiming provider fulfillment.

## Authentication and administrator bootstrap

- Sign-in uses the secure Manus OAuth flow. Westara does not store provider passwords or simulate an account.
- The business-owner OAuth `openId` is stored as protected project configuration under `OWNER_OPEN_ID`; it is not committed to source. On sign-in, the server compares the authenticated ID and grants the initial administrator role to that account. The configured owner cannot be demoted through the app.
- The project owner should sign in once after configuration. Other registered accounts may only be promoted by an existing administrator in Settings. Server procedures enforce the admin role; hiding the admin UI is not the security boundary.
- Session cookies use `HttpOnly; SameSite=None; Secure` for HTTPS Preview embedding.

## Maps and provider boundaries

- The Google Maps JavaScript proxy uses the platform's browser-safe runtime configuration. The app falls back to an illustrated map when Maps is unavailable.
- Charging stations, connector details, map pins, and rental category/pricing examples are clearly marked as illustrative. Live station/availability data and rental inventory/pricing are not connected.
- Email, SMS, payments, roadside dispatch, and third-party booking are not claimed as active. In-app messages and request-status notifications are database-backed; external delivery requires an approved provider integration and credentials.
- Location is only requested after an explicit user action. The server rejects coordinates unless the request also includes the user's consent.

## Design and assets

The site uses the Westara charcoal/ivory/electric-lime palette, Space Grotesk and DM Mono typography, a twin-bar wordmark, and optimized original unbranded EV imagery in managed storage. Tesla logos and T marks are not used. Sample estimates and unavailable provider capabilities are labeled in the UI.
