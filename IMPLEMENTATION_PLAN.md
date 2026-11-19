# CryptoFlow implementation plan

## Delivery workflow

Implementation proceeds in small, independently reviewable commits on the
existing `testing-main` branch. Each phase is pushed to `testing-main` after its
relevant checks pass. The implementation pull request targets `main`; direct
pushes to `main` are not part of this workflow.

The documentation-only preflight in pull request #1 verified that the repository
accepts an attributed commit, branch push, pull request, and ruleset-compliant
merge before application code was changed.

## Phase 1 — Security and build baseline

- Upgrade Next.js to a patched compatible release and update matching lint tooling.
- Resolve compatible development dependency advisories without forced breaking upgrades.
- Pin the supported Node runtime and remove build-time font downloads.
- Strengthen CI with explicit permissions, concurrency cancellation, dependency
  auditing, and browser regression coverage.
- Correct setup documentation and remove unsupported feature claims.

**Exit gate:** clean install, typecheck, lint, unit tests, production build, and
documented dependency audit results.

## Phase 2 — Reliable market data

- Introduce a shared, deduplicated client cache with visibility-aware polling.
- Expose freshness, last successful update, retry, and unavailable-data states.
- Restrict proxy paths and query parameters to supported CoinGecko operations.
- Move upstream configuration server-side and validate its origin.
- Add timeouts, response validation, bounded errors, and tested cache behavior.

**Exit gate:** market panels share refresh behavior and no unavailable quote is
represented as a successful current valuation.

## Phase 3 — Correct portfolio and candlesticks

- Align candle bodies and wicks on a time-based axis with useful tick formatting.
- Consolidate chart tooltips and provide an accessible summary and data fallback.
- Disclose CoinGecko OHLC granularity.
- Distinguish live, stale, and unavailable portfolio quotes.
- Report partial totals explicitly instead of substituting purchase prices.

**Exit gate:** chart geometry and portfolio calculations have regression tests,
including missing and stale quote cases.

## Phase 4 — Persistent user data

- Add versioned device-local storage for portfolio, watchlist, and alert state.
- Preserve user changes across panel switches and reloads.
- Provide an optional authenticated Supabase mode with SSR session handling,
  Next.js proxy integration, migrations, ownership constraints, and RLS policies.
- Use publishable keys and never expose secret or service-role credentials.
- Keep device-local and authenticated storage boundaries explicit.

**Exit gate:** local data survives reloads; authenticated data is isolated by
owner and database policies are verified before deployment.

## Phase 5 — Accessible, resilient interactions

- Implement keyboard tab navigation and valid tab-panel relationships.
- Keep mobile navigation labels visible and use accessible touch targets.
- Improve contrast, numeric alignment, and compact mobile layouts.
- Add field-level validation, stable identifiers, and reversible deletion.
- Replace misleading watchlist metrics and remove nonfunctional delivery controls.

**Exit gate:** keyboard and mobile workflows pass component and browser checks.

## Phase 6 — Regression and release verification

- Expand unit coverage for API validation, hooks, storage, charts, and calculations.
- Add desktop and mobile browser workflows for all critical user actions.
- Cover rate limits, upstream failures, reload persistence, and authentication
  boundaries where configured.
- Run the complete verification suite and inspect final production screenshots.
- Reconcile README behavior and setup instructions with the implemented product.

**Exit gate:** all required checks pass, the pull request is merged into `main`,
and the resulting main-branch CI run is verified.

## External verification boundary

Supabase migrations and policies can be implemented and tested locally without
creating a hosted project. Hosted deployment requires an explicitly selected
Supabase organization and project; no hosted resources or paid services are
created implicitly by this plan.
