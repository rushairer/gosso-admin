# Gosso Admin Showcase Parity Hardening

This document is the audit ledger and durable contract map for the Gosso Admin Showcase parity program.

## Baseline

- Gouno UI starting main: `0a3b352013d4dc8bdb2562907dca7f12474715d5`
- Gosso Admin starting main: `0c689a38347ca3c9c62d8bd85ede9671f9d714ce`
- Published/canonical Gouno UI release at audit start: `0.4.1`
- Gosso Admin started on `0.4.0`; the registry updater was hardened to Node 24/default `0.4.1` and successfully produced the exact `0.4.1` npm lock on main.
- `rushairer/gouno-blog` is read-only reference material for the hardening mechanism only.

## Route inventory

| Family | Showcase | Product | Visual parity owner |
| --- | --- | --- | --- |
| Overview | `gosso-admin/overview.tsx` | `/` | Hero, quick links, surface hierarchy |
| Clients | `system-management/clients.tsx` | `/system-management/clients` | collection/filter/actions/modal presentation |
| Users | `system-management/users.tsx` | `/system-management/users` | collection/actions/Sudo presentation |
| Audit logs | `system-management/audit-logs.tsx` | `/system-management/audit-logs` | filters/table/detail presentation |
| Site settings | `system-management/site-settings.tsx` | `/system-management/site-settings` | settings form + LoginPreview sibling ownership |
| System status | `system-management/system-status.tsx` | `/system-management/system` | status surface |
| Profile | `account-settings/profile.tsx` | `/account-settings/profile` | Account Tabs + form surface |
| Password | `account-settings/password.tsx` | `/account-settings/password` | form/recent-auth presentation |
| MFA | `account-settings/mfa.tsx` | `/account-settings/mfa` | enrollment/state presentation only; real state machine remains product-owned |
| Passkeys | `account-settings/security.tsx` | `/account-settings/passkeys` | empty/list/WebAuthn presentation |
| Sessions | `account-settings/security.tsx` | `/account-settings/sessions` | list/revoke presentation |
| Login | `auth/login.tsx` | `/login` | auth surface/feedback; real auth state machine remains product-owned |
| Forgot password | `auth/forgot-password.tsx` | `/forgot-password` | AuthPageSurface/form presentation |
| Reset password | `auth/reset-password.tsx` | `/reset-password` | AuthPageSurface/form/error presentation |
| OAuth callback | `auth/callback.tsx` | `/callback` | indeterminate processing/error presentation |
| Not found | `auth/not-found.tsx` | `*` | result/navigation surface |

Redirect-only `/account-settings` and `/system-management` are routing contracts, not independent visual pages.

## Ownership invariants

- System Management durable domains are Sidebar destinations. No route-family Tabs.
- Account Settings owns one PageHeader plus page-local Tabs; Tabs own their active panel relationship.
- Auth surfaces remain outside AppShell and are not forced into ordinary admin Card grammar.
- Site Settings real form and LoginPreview are siblings. Preview controls never participate in product form validation or submit.
- Known future structure uses Skeleton/PageSkeleton. Empty means a successful no-data result. Existing data refresh remains visible. Spinner is reserved for genuinely indeterminate work such as OAuth callback processing.
- Persistent load/security status uses page feedback such as Alert. Transient mutation success/failure uses the Gosso Message grammar where the product already owns that behavior.
- FixtureDock/scenario controls are Showcase-only and excluded from product parity.

## Mismatch ledger

| ID | Surface | Mismatch | Severity | Root cause | Fix / guard | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GOS-P0-001 | dependency baseline | product and updater pinned `@gouno/ui 0.4.0` while canonical release was `0.4.1` | P0 | stale exact pin/default | registry updater Node 24 + exact 0.4.1 + lock/integrity/quality/subpath/container verification | fixed |
| GOS-P0-002 | cross-repo | no direct Showcase ↔ Gosso Product parity gate | P0 | parity was convention, not executable contract | paired DOM/style/geometry/browser harness | in progress |
| GOS-P0-003 | reciprocal consumer | Gouno UI changes did not test current Gosso Admin | P0 | only Blog consumer gate existed | reuse Gosso canonical parity harness from Gouno UI workflow | in progress |
| GOS-P0-004 | Auth family | durable browser acceptance covered AppShell routes but not Auth surfaces | P0 | historical authenticated matrix scope | add Auth loaded/default matrix plus high-risk interactions | in progress |
| GOS-P1-001 | Showcase feedback | Clients/Users/Site Settings transient fixture success used page Alert while real Gosso uses Message | P1 | Showcase semantic drift | canonical Showcase Message fixture helper + conformance test | fixed in Gouno UI hardening branch |
| GOS-P1-002 | Site Settings Showcase | LoginPreview was nested inside real settings form fixture | P1 | composition drift | form and preview become siblings + structural contract | fixed in Gouno UI hardening branch |
| GOS-P1-003 | collection empty | selected Showcase fixtures wrapped self-surfaced Empty in Card | P1 | redundant surface ownership | remove redundant wrappers + structural guard | in progress |
| GOS-P1-004 | CI runtime/trigger | browser gate used Node 20 and did not run on main push | P1 | stale workflow | Node 24 + relevant PR/main/manual | in progress |
| GOS-P2-001 | docs | DESIGN_SYSTEM retained retired Panel wording and loading doc named the old 0.4.0 baseline | P2 | completion docs drifted behind code | update docs to canonical grammar/current release | in progress |

P0/P1 status is only closed when the corresponding CI proof is green on the merged main branch.

## Security boundary

Parity hardening must not change OAuth2/OIDC semantics, Authorization Code + PKCE, callback/token exchange behavior, session restoration, auth redirects, RequireAuth/RequireAdmin, Sudo/recent-MFA, MFA enrollment/verification/recovery codes, Passkey/WebAuthn semantics, password reset security, account mismatch handling, session revocation, OAuth client credential behavior, permissions, audit logging, CSP/security headers, cookies, API contracts, or backend behavior.

Fixture and mocked-browser evidence proves presentation/state rendering only. It is not production authentication, WebAuthn-device, destructive mutation, or real OAuth-provider E2E evidence.
