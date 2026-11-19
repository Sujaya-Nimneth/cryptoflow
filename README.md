# CryptoFlow Analytics

CryptoFlow is a responsive cryptocurrency dashboard built with Next.js,
TypeScript, Tailwind CSS, Chart.js, and optional Supabase cloud storage.
It combines live USD market data with portfolio tracking, a watchlist,
candlestick charts, and on-screen price alerts.

## Implemented Features

- Five live price cards, global market statistics, and OHLC charts for a curated
  catalog of 18 coins.
- Portfolio cost basis, quoted value, and gain/loss calculations. Missing quotes
  are labeled unavailable; partial totals are never presented as complete values.
- A watchlist with quote coverage and highest-priced tracked coins.
- Above/below price targets evaluated while the dashboard is open.
- Keyboard-operable tabs, linked form errors, focus restoration, and Undo for
  deleted holdings, watchlist entries, and alerts.
- Versioned device-local persistence, with optional owner-isolated cloud storage.

Alerts do **not** send email, push notifications, or SMS, and do not run in the
background. Closing the dashboard stops checks. Market values are informational,
not financial advice.

## Requirements

- Node.js **22.12.0 or newer within the supported Node 22 runtime**. The repository
  pins 22.12.0 in `.nvmrc`.
- npm; use `npm ci` for a reproducible installation.
- Docker Desktop or another compatible Docker runtime, only for local Supabase
  development and database tests.

```bash
nvm use
npm ci
```

## Run Without Cloud Storage

No environment variables are required for device-local mode:

```bash
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Holdings, watchlist entries,
and alerts are stored in this browser under versioned `cryptoflow:local:*` keys.
They are not synchronized between devices. Invalid saved data is preserved until
the user explicitly chooses the reset action. If browser storage is blocked or
full, the dashboard reports that changes cannot be saved.

## Optional Local Supabase

Start the local stack and inspect its public configuration:

```bash
npm run db:start
npm run supabase -- status -o env \
  --override-name api.url=NEXT_PUBLIC_SUPABASE_URL \
  --override-name auth.publishable_key=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Copy `.env.example` to `.env.local` and set the two public values printed by that
command. The local API normally uses `http://127.0.0.1:54321`. Use the
**publishable** key; never place a secret, service-role, JWT, or database credential
in a `NEXT_PUBLIC_*` variable.

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local publishable key>
```

Restart `npm run dev` after changing environment variables. The local stack applies
the migration in `supabase/migrations/` automatically. The schema contains:

| Table | Purpose |
| --- | --- |
| `portfolio_holdings` | Coin, quantity, and purchase price |
| `watchlist_entries` | One entry per coin per owner |
| `price_alerts` | Coin, above/below direction, target, and creation time |

All tables force row-level security, require the authenticated owner, and grant
only the select/insert/delete operations used by the application. Ownership comes
from verified Supabase claims, not editable user metadata. Anonymous identities
cannot use cloud storage.

Local email confirmation is disabled so the authenticated browser tests can
create disposable accounts. The local stack does not create or modify hosted
Supabase resources.

### Local Database Commands

```bash
npm run db:test       # pgTAP ownership and constraint checks
npm run db:advisors   # security and performance advisors
npm run db:reset      # destructive reset of the local database only
npm run supabase -- stop --no-backup
```

Use `db:reset` only when local test data is disposable. It removes local users and
rows. Do not run hosted migration or deployment commands unless a hosted project
has been explicitly selected and approved.

## Market Data Configuration

Browser requests use the allowlisted `/api/crypto/*` route, not a public upstream
URL. The route accepts only the supported market, global, and OHLC queries and
validates response shape, size, timeout, and retry headers.

The following optional variables are **server-only**:

```env
CRYPTO_API_URL=https://api.coingecko.com/api/v3
COINGECKO_API_KEY=
```

`CRYPTO_API_URL` is restricted to CoinGecko's `/api/v3` origin, except HTTP on
localhost for a test double. `COINGECKO_API_KEY`, when set, is sent as the Demo API
key header. It is never embedded in client code. Without it, requests use the
public endpoint and may be rate limited.

Quotes refresh every 30 seconds while visible, global data every 60 seconds, and
OHLC data every five minutes. Quotes older than 90 seconds are marked stale, and
alert evaluation pauses rather than treating old prices as current. CoinGecko
determines OHLC granularity; the chart discloses it and offers a data-table
fallback.

## Storage Boundaries

- Signed-out users always use device-local storage.
- Signed-in users default to their private cloud collection.
- **View device data** switches to local storage without copying cloud records.
- **Use cloud account** returns to the cloud collection without copying local records.
- Signing out returns to device-local storage.

Cloud errors never overwrite device-local data. Supabase SSR cookies and verified
claims are used for server identity; the Next.js proxy refreshes sessions when an
auth cookie is present.

## Production Checklist

Before exposing cloud accounts publicly:

1. Select and configure an explicit Supabase project; apply and verify the checked-in
   migrations there deliberately.
2. Set the project's HTTPS URL and publishable key in the hosting environment.
3. Configure the Auth site URL and exact allowed redirect URLs.
4. Enable email confirmation and configure custom SMTP. Supabase's default SMTP
   service is restricted to project organization members and is not suitable for
   public confirmation email.
5. Review Auth rate limits, password policy, session expiry, and monitoring.
6. Run database policy tests and advisors against a safe environment, then verify
   two separate owners cannot read or mutate each other's records.
7. Run `npm run build`, followed by `npm run start` on a Node.js host. This App
   Router application needs its server runtime; copying only `.next` to static
   hosting is not a deployment.

No deployment is performed by the test scripts or by this repository's CI.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run audit:prod
npm run db:test
npm run db:advisors
npm run build
npm run test:e2e
```

The browser suite runs desktop and mobile Chromium projects. It mocks market
responses for deterministic UI checks. Authenticated cloud isolation tests run
only when these test-only variables are provided:

```bash
E2E_SUPABASE_URL=http://127.0.0.1:54321 \
E2E_SUPABASE_PUBLISHABLE_KEY=<local publishable key> \
npm run test:e2e
```

In CI, the workflow starts a clean local Supabase stack, publishes only its URL
and publishable key, runs all checks, builds with Node 22.12, and runs authenticated
desktop/mobile tests. Failure traces and screenshots are uploaded as artifacts.

## Project Layout

```text
src/app/                 App Router pages, auth actions, and market proxy
src/components/          Dashboard panels, forms, charts, and shared UI
src/hooks/               Market polling, persistence, forms, and Undo lifecycle
src/lib/                 Validation, calculations, caching, and Supabase adapters
src/types/               Current domain and generated database types
supabase/migrations/     Schema, grants, constraints, and RLS policies
supabase/tests/          pgTAP ownership and constraint checks
e2e/                     Desktop/mobile browser workflows
.github/workflows/ci.yml Complete verification pipeline
```

Theme tokens live in `src/app/globals.css`. Shared polling intervals live in
`src/lib/marketSchemas.ts`; the supported coin catalog lives in `src/lib/coins.ts`.
Extend the catalog and its validation together rather than adding arbitrary
upstream paths.

## Delivery Workflow

Changes are developed on the existing `testing-main` branch in focused commits.
Each implementation phase is pushed, opened as a separate pull request to `main`,
verified by CI, and merged before the next phase. See `IMPLEMENTATION_PLAN.md` for
the phase exit gates.
