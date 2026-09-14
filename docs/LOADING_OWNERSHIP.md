# Loading Ownership

Status: completed against exact registry release `@gouno/ui@0.4.0`, 2026-09-14.

This document records the boundary between application infrastructure loading, unresolved product data, refresh transitions and mutations. It complements `APP_RULES.md` and prevents future migrations from treating every `Skeleton` composition as the same problem.

## Infrastructure loading

Session bootstrap, auth guards and React lazy-chunk boundaries are infrastructure concerns. They do not know the eventual page's business data and must not fabricate PageHeader, Tabs, cards or table geometry.

`gosso-admin-frontend/src/App.tsx` therefore uses private Spinner fallbacks for:

- `GossoProvider` session initialization;
- `RequireAuth` / `RequireAdmin` guard resolution;
- React `Suspense` route chunk loading.

These fallbacks retain one localized/named status region and remain separate from Gouno `PageSkeleton`.

## Adopted PageSkeleton boundaries

The approved runtime migration is now complete through the exact immutable npm registry release `@gouno/ui@0.4.0`; the component is not vendored or copied locally.

### System collections — `layout="collection"`

File: `gosso-admin-frontend/src/pages/system-management/loading.tsx`

`SystemCollectionLoading` now delegates the shared unresolved collection geometry to `PageSkeleton`. Clients, Users and Audit Logs retain product-owned headings, filtering, pagination, selection, row actions and API state.

The PageSkeleton visual table is intentionally `aria-hidden`; assistive technology receives the named `role="status"` loading region rather than placeholder column semantics. Product tests should assert that contract instead of treating skeleton cells as real data-table headers.

### System status — `layout="dashboard"`

`SystemStatusLoading` now delegates statistic cards plus larger read-dominant health/configuration placeholders to the dashboard PageSkeleton layout. The management panel lead and route structure remain visible outside the loading region.

### Account profile

The Showcase fixture proves that a generic profile/settings initial read can match `layout="form"`, but the real Gosso Admin profile flow should migrate only if a genuine unresolved initial-read state exists at the page boundary.

Do not replace save/mutation loading with a form skeleton. Control-level save loading remains owned by the form/button.

## Keep product-local

These loaders intentionally remain local unless independent future evidence changes their anatomy:

- Site Settings: settings editor plus login-page live preview is a product-specific two-region layout.
- MFA enrollment: security-state machine and QR/verification lifecycle are domain-specific.
- Passkeys: FIDO2 credential collection and actions are security-specific.
- Sessions: session/device semantics and destructive actions are security-specific.
- Authentication/callback pages: auth protocol state must not become page-data skeleton policy.

## Initial, refresh and mutation rules

- Initial request with no usable data: use an admitted structural skeleton when the page anatomy matches.
- Same-query refresh with usable data: keep the resolved data visible; mark the affected region busy when useful and let the initiating control expose loading/disabled state.
- Query-changing transition: previous rows may no longer represent the active filter/page, so the product may replace the unresolved collection region with structural loading rather than display semantically stale rows.
- Mutation: preserve unrelated page content and use the canonical control loading/disabled state plus product feedback.
- Initial read failure: fail closed into the page's error/retry state; do not convert an unavailable resource into Empty.

## Release gate

For this migration, the gate has been satisfied by `@gouno/ui@0.4.0` and the registry-sync workflow. Future shared-loading changes must continue to:

1. upgrade an exact `@gouno/ui` dependency and lockfile through the registry-sync path;
2. keep specialized security/settings loaders local unless their ownership boundary genuinely changes;
3. preserve accessible loading names and all error/empty/retry behavior;
4. run frontend quality, exact registry checks, subpath build, security checks and browser acceptance where the workflow supports it;
5. commit and push each narrow migration stage independently.
