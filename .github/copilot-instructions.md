# CryptoFlow Development Guidelines

## Stack And Runtime

- Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, and Chart.js.
- Use Node 22.12 from `.nvmrc` and `npm ci` for reproducible checks.
- This Next.js version may differ from model training data. Read the relevant
  installed guide under `node_modules/next/dist/docs/` before changing framework APIs.
- Use `src/proxy.ts`, `NextRequest`, generated `RouteContext`, and current Server
  Action conventions. Do not restore deprecated middleware or old route signatures.

## Architecture

- `src/app/api/crypto/[...path]/route.ts` is the only browser market-data boundary.
  Keep upstream paths, parameters, origin, payload size, and timeout constrained.
- `src/lib/marketSchemas.ts` defines the supported query/response contracts and
  polling intervals. `src/lib/marketCache.ts` deduplicates quote snapshots.
- `useLocalUserData` owns versioned browser persistence. `useCloudCollection` owns
  authenticated mutations and must tolerate overlapping requests and account changes.
- Cloud adapters live in `src/lib/supabase/`, not `src/lib/supabase.ts`.
- Current domain types are `PortfolioHolding`, `WatchlistEntry`, and `PriceAlert`.
- Current tables are `portfolio_holdings`, `watchlist_entries`, and `price_alerts`.

## Data And Security Boundaries

- Device-local and cloud collections are separate. Never silently merge or copy them.
- Use publishable keys in public clients. Secret/service-role keys and CoinGecko keys
  remain server-only.
- Verify cloud identity with Supabase SSR claims; never authorize from user metadata.
- Keep forced RLS, owner predicates, explicit grants, and database constraints.
- Validate all action, form, proxy, storage, and database inputs at their boundary.
- Never return a submitted password in action state.
- Do not create hosted Supabase resources or deploy without explicit approval.

## Product Accuracy

- The supported catalog is defined in `src/lib/coins.ts`; do not claim arbitrary
  CoinGecko search, trending data, or all-coin coverage.
- Quotes are USD. Missing values are unavailable, and partial portfolio totals must
  remain explicitly partial.
- Alerts are evaluated only while the dashboard is open. Email, push, SMS, and
  background delivery are not implemented; do not add controls implying otherwise.
- Preserve keyboard tabs, visible mobile labels, 44px targets, linked errors, focus
  recovery, numeric alignment, and reversible deletion.

## Implementation Style

- Use functional components and existing shared UI primitives.
- Keep theme tokens in `src/app/globals.css`; avoid unrelated visual redesigns.
- Prefer focused changes and existing schemas/helpers over duplicated validation.
- Do not add speculative features, inline explanatory comments, or new dependencies
  without a concrete need.
- Use `apply_patch` for edits and keep generated output out of commits.

## Verification

Run the narrowest relevant tests first, then:

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

Local database commands require Docker. Browser cloud tests require
`E2E_SUPABASE_URL` and `E2E_SUPABASE_PUBLISHABLE_KEY`; market responses are mocked,
but authenticated ownership checks use the local Supabase stack.

## Git Workflow

Use the existing `testing-main` branch. Make focused commits, push each verified
slice, and open a separate phase PR to `main`. Wait for the exact-head CI run,
merge through the PR, synchronize `testing-main`, and verify the resulting main CI.
Do not create another feature branch or push directly to `main`.
