# Loading Ownership

Status: accepted frontend loading contract, 2026-09-14.

This document records the boundary between application infrastructure loading, unresolved product data, refresh transitions and mutations. It complements `APP_RULES.md` and prevents future migrations from treating every `Skeleton` composition as the same problem.

## Infrastructure loading

Session bootstrap, auth guards and React lazy-chunk boundaries are infrastructure concerns. They do not know the eventual page's business data and must not fabricate PageHeader, Tabs, cards or table geometry.

`gosso-admin-frontend/src/App.tsx` therefore uses private Spinner fallbacks for:

- `GossoProvider` session initialization;
- `RequireAuth` / `RequireAdmin` guard resolution;
- React `Suspense` route chunk loading.

These fallbacks retain one localized/named status region and must remain separate from Gouno `PageSkeleton`.

## Approved PageSkeleton candidates after registry release

The runtime migration must wait until the npm registry contains the exact immutable `@gouno/ui` release with PD-076 `PageSkeleton`. Do not vendor or copy the component locally.

### System collections — `layout="collection"`

File: `gosso-admin-frontend/src/pages/system-management/loading.tsx`

`SystemCollectionLoading` is a direct candidate. Clients, Users and Audit Logs all have stable management-page structure and known table headings before row data resolves. Migrate the unresolved collection region while preserving caller-owned headings through presentation-only column descriptors.

Do not move filtering, pagination, table selection, row actions or API state into `PageSkeleton`.

### System status — `layout="dashboard"`

`SystemStatusLoading` is a direct dashboard candidate. It represents statistic cards plus larger read-dominant health/configuration regions. The management panel lead and route structure remain visible outside the loading region.

### Account profile

The Showcase fixture proved that a generic profile/settings initial read can match `layout="form"`, but the real Gosso Admin profile flow must be migrated only if a genuine unresolved initial-read state exists at the page boundary.

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

## Migration gate

When the registry release is available:

1. upgrade the exact `@gouno/ui` dependency and lockfile through the existing registry-sync path;
2. migrate `SystemCollectionLoading` and `SystemStatusLoading` first;
3. keep specialized security/settings loaders local;
4. preserve accessible loading names and all error/empty/retry behavior;
5. run frontend quality, exact registry checks, subpath build, security checks and browser acceptance where the workflow supports it;
6. commit and push each narrow migration stage independently.
