# Westara — Implementation Plan

## Product and implementation approach

Build the requested Westara ownership-support platform as exactly four primary application routes: public Home (`/`), Authentication (`/login`), Owner Dashboard (`/app`), and Administration (`/admin`). Dashboard services and account features remain sections in `/app`; no service receives an unnecessary standalone page. Keep `/404` as the starter's not-found route. Add and maintain `public/manus-routes.json` for the real page routes.

Use the initialized `web-db-user` stack: React, Vite, Wouter, Tailwind, Express, tRPC, Drizzle, and the managed MySQL database. The server and database are enabled. Put persistent models and migrations in `drizzle/`, database access in `server/db.ts`, authenticated/authorized procedures in `server/routers.ts` and related server modules, and shared, responsive UI in `client/src/`. Keep feature sections and repeated UI reusable rather than adding pages or oversized files.

Use the supplied Manus OAuth identity/session implementation as the real authentication mechanism. Preserve the starter's JWT validation and `webdev_app_session` cookie requirements, including `SameSite=None; Secure` for public HTTPS Preview. Protect customer pages and ensure every customer's records are scoped to the authenticated user. Grant administrator access only through a server-verified authorized role; never allow a customer to elevate their own role. The login UI will not simulate provider logins: Google, Apple, email, or phone choices should be offered only to the extent the available authentication portal actually supports them; Apple is conditional as requested. Do not invent a separate email/password or OTP backend without a configured provider.

Add additive, non-destructive Drizzle tables and migrations for customer vehicles, service requests, customer-visible request messages, private administrator notes, request assignments/status history, in-app notifications, favorite charging stations, saved journeys, customer feedback, and service availability/settings as needed. Preserve the base users table and existing records. Implement server-side input validation and authorization for creating/viewing requests, adding messages, changing status/assignment, and managing records. Admin replies appear in customer request threads and create in-app notifications; private notes never appear to customers. Avoid inserting test/demo customer records into the shared managed database.

Implement request workflows for roadside assistance (flat tyre, battery, breakdown, towing, lockout; user-consented location and notes), rental requests (vehicle, pickup, dates, estimate), and maintenance/service requests (inspection, battery diagnostics, tyres/brakes, general maintenance, detailing). Their states distinguish a submitted request from confirmed service, completed dispatch, payment, or booking. Show recent requests, updates, vehicles, favorites and trips using real signed-in-user records. Include garage and profile editing within the dashboard.

Use the platform's Google Maps proxy for the interactive charging finder and route directions where its runtime browser credentials are available. Preserve CCS2 and Type 2 filters and saved favorites. Charging stations and rental vehicles must be visibly identified as sample/demo data until verified providers are connected; do not present sample pins as live availability. For routes, use a real directions result when available, label distances and durations as estimates, and clearly indicate unavailable provider functionality rather than fabricating results. Keep Google Maps directions as an outbound link where useful. Location is requested only after the user elects to use it. Maps, Open Charge Map, email/SMS, Razorpay, rental-provider, and roadside-provider integrations remain inactive unless supported credentials/access are actually configured; no secret appears in browser code.

Build `/admin` as a protected administration dashboard with overview counts derived from real database rows; request filtering, assignment, status management, customer-visible replies and private notes; customer/vehicle/request views; feedback ratings/replies; and settings for service availability, service areas, notifications, and administrators. Never substitute invented customer activity for real records. Empty states are explicit; any static illustrative content is labeled sample.

Create a concise `README.md` covering development, database migration, authentication/runtime configuration, provider integration boundaries, and deployment. Use additive migrations only; do not perform destructive SQL. Run code/type diagnostics, `pnpm check`, `pnpm test` where applicable, production build, route-manifest HTTP check, and read-only review of ownership/RBAC paths. Do not create or delete records in the shared managed database to test flows.

## Design direction

### Design movement

Neo-industrial automotive editorial: cinematic electric mobility rendered with restrained luxury, technical clarity, and a quiet sense of forward motion.

### Core principles

1. Make ownership support feel dependable and immediately actionable, not like a vehicle-sales funnel.
2. Use strong editorial scale and generous negative space; keep operational information precise and scannable.
3. Reserve lime for decisions, current state, and useful signals rather than decoration.
4. Make data provenance unmistakable: customer record, sample, estimate, or integration unavailable.

### Color philosophy

Use the brief's near-black `#080909` foundation and `#151719` / `#202326` surfaces to evoke a calm instrument panel. Warm near-white `#F4F1EA` keeps headlines human; `#B8BDC4` carries secondary and technical copy. The ownable `#C8F169` signal green marks primary actions and active states sparingly. Maintain readable contrast and use hairline dividers and soft gradients instead of heavy shadows.

### Layout paradigm

Compose the public page as a long-form, asymmetric editorial journey: a cinematic full-bleed hero, numbered service modules, and alternating wide visual/text bands. Keep information-rich sections compact and aligned to a clear content edge. Inside the dashboard, use a persistent desktop rail and a collapsible mobile drawer, with a stable top utility row and a content canvas that changes section in place.

### Signature elements

- A twin-bar Westara mark used as an ownable compact symbol, paired with a carefully set wordmark.
- Fine mono-spaced section indices and status labels that make service details feel like precise vehicle instrumentation.
- A thin lime route/charge trace used as a restrained progress motif across route, request, and journey components.

### Interaction philosophy and animation

Interactions should be quiet, immediate, and reversible where possible. Make primary actions unmistakable, forms validate inline, and all uncertain or pending states explicit. Use short opacity/translate transitions and subtle line-draw or signal-glow effects; honor reduced-motion preferences, avoid parallax that harms usability, and keep motion out of core form completion.

### Typography system

Use Space Grotesk for display and section headings, with a compact, responsive scale and confident line breaks. Use DM Mono for technical labels, station connector types, request identifiers, and status metadata. Use a highly legible neutral sans-serif fallback for long body copy, with comfortable line height.

### Brand essence and voice

Positioning: independent ownership support and mobility for Tesla drivers in India, bringing the next practical step into one place. Personality: composed, capable, forward-looking.

Headlines are concise and human; microcopy says what is known and what happens next. Examples: “Keep moving, with a clearer next step.” “Request received. We’ll update you here.”

### Wordmark and signature color

Create a distinctive twin-bar symbol with two unequal parallel strokes suggesting a road/charge pulse; pair it with a custom-spaced WESTARA wordmark in Space Grotesk. Do not use Tesla marks or imply affiliation. Electric lime `#C8F169` is Westara's signature color.

## Project structure

- `client/src/pages/`: the four primary route shells (`Home`, `Login`, `App`, `Admin`) and existing not-found page.
- `client/src/components/`: shared navigation, brand mark, service cards, forms, request timeline, status labels, dashboard rail/drawer, dialogs, and responsive utilities.
- `client/src/sections/` (or an equivalently small feature-organized directory): in-place dashboard sections for Overview, Assistance, Charging, Rentals, Maintenance, Trips, Garage, Requests, Notifications, and Profile; admin sections remain within `/admin`.
- `client/src/lib/`: tRPC client, authentication helpers, route/state utilities, and safe public Maps-loader support.
- `drizzle/schema.ts` and `drizzle/`: typed business tables and additive migrations.
- `server/db.ts` and `server/`: database queries, validation, tRPC feature routers, RBAC, request and notification logic, and authorized admin operations.
- `public/`: route manifest, small site metadata/icons; generated large photos use durable project asset storage when available.
- `README.md`: setup, migrations, sign-in, integration boundaries, and deployment.

The Vite frontend is served by the existing Express-backed WebDev runtime on port 3000. Keep browser-facing requests relative, expose only browser-safe Maps configuration if the proxy integration requires it, and keep all private credentials and ownership decisions server-side.
