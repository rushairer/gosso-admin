# Gosso Admin Showcase Parity Hardening

This document is the audit ledger and durable contract map for the Gosso Admin Showcase parity program.

## Baseline

- Gouno UI starting main: `0a3b352013d4dc8bdb2562907dca7f12474715d5`
- Gosso Admin starting main: `0c689a38347ca3c9c62d8bd85ede9671f9d714ce`
- Published/canonical Gouno UI release at audit start and close: `0.4.1`
- Gosso Admin started on `0.4.0`; the registry updater was hardened to Node 24/default `0.4.1` and successfully produced the exact `0.4.1` npm lock on main.
- `rushairer/gouno-blog` was read-only reference material for the hardening mechanism only; no Blog product rules were copied and no Blog files were modified.

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

Inventory at close: 16 visual route mappings + 2 redirect-only routing contracts.

## Ownership invariants

- System Management durable domains are Sidebar destinations. No route-family Tabs.
- Account Settings owns one PageHeader plus page-local Tabs; Tabs own their active panel relationship.
- Auth surfaces use their dedicated auth grammar and are not forced into ordinary admin Card grammar. The product `*` route intentionally remains inside the authenticated AdminLayout while using the canonical NotFound Result composition.
- Site Settings real form and LoginPreview are siblings. Preview controls never participate in product form validation or submit.
- Known future structure uses Skeleton/PageSkeleton. Empty means a successful no-data result. Existing data refresh remains visible. Spinner is reserved for genuinely indeterminate work such as OAuth callback processing.
- Persistent load/security/form state uses local persistent feedback such as Alert. Transient mutation feedback uses the existing Gosso Message grammar where that is the product owner. Interaction-scoped persistent failures, such as passkey registration while its Modal is open, remain owned by that interaction surface.
- FixtureDock/scenario controls are Showcase-only and excluded from product parity.

## Mismatch ledger

| ID | Surface | Mismatch | Severity | Root cause | Fix / guard | Status |
| --- | --- | --- | --- | --- | --- | --- |
| GOS-P0-001 | dependency baseline | product and updater pinned `@gouno/ui 0.4.0` while canonical release was `0.4.1` | P0 | stale exact pin/default | registry updater Node 24 + exact 0.4.1 + lock/integrity/quality/subpath/container verification | closed |
| GOS-P0-002 | cross-repo | no direct Showcase ↔ Gosso Product parity gate | P0 | parity was convention, not executable contract | 16-case paired DOM/style/geometry/browser harness on PR/main/manual + retained evidence | closed |
| GOS-P0-003 | reciprocal consumer | Gouno UI changes did not test current Gosso Admin | P0 | only Blog consumer gate existed | Gouno UI checks out current Gosso Admin main and reuses the canonical Gosso parity harness | closed |
| GOS-P0-004 | Auth family | durable browser acceptance covered AppShell routes but not Auth surfaces | P0 | historical authenticated matrix scope | 5 Auth routes added to 4-viewports × 2-themes matrix plus high-risk auth interactions | closed |
| GOS-P1-001 | Showcase feedback | Clients/Users/Site Settings transient fixture success used page Alert while real Gosso uses Message | P1 | Showcase semantic drift | canonical Showcase Message fixture helper + conformance coverage | closed |
| GOS-P1-002 | Site Settings Showcase | LoginPreview was nested inside real settings form fixture | P1 | composition drift | form and preview are siblings + structural contract | closed |
| GOS-P1-003 | collection empty | selected Showcase fixtures wrapped self-surfaced Empty in Card | P1 | redundant surface ownership | remove redundant wrappers + structural contract | closed |
| GOS-P1-004 | NotFound product | product used a custom padded Card instead of canonical Result composition | P1 | composition drift hidden by route-only smoke coverage | canonical Result composition + direct parity | closed |
| GOS-P1-005 | Login product | Login Card carried unnecessary `position: relative` absent from canonical Showcase | P1 | local product chrome drift | remove local positioning ownership + computed-style parity | closed |
| GOS-P1-006 | Passkeys product | registration failure rendered as page-level Alert while registration Modal remained open | P1 | interaction feedback ownership was too broad | error is persistent inside the active registration Modal; page feedback resumes after close | closed |
| GOS-P1-007 | CI/runtime | Browser Acceptance used Node 20 and did not provide durable main-push proof | P1 | stale workflow runtime/trigger | Node 24 + relevant PR/main/manual trigger + artifacts | closed |
| GOS-P1-008 | profile copy | denied Clipboard write could surface as an unhandled pageerror | P1 | browser capability failure was not presentation-owned | await/catch clipboard write, keep failure as persistent product feedback; browser success proof grants explicit clipboard permission | closed |
| GOS-P2-001 | docs | DESIGN_SYSTEM retained retired Panel wording and loading doc named the old 0.4.0 baseline | P2 | completion docs drifted behind code | align docs with current canonical grammar/release | closed |

Closure status: **P0 = 0, P1 = 0, P2 = 0 unresolved**. Intentional product differences are documented below rather than treated as parity failures.

## Static and structural guardrails

The Gosso UI contract checks now fail on the high-risk drift families that previously depended on reviewer memory:

- `@gouno/ui` package-root imports and unsupported entrypoints; canonical `@gouno/ui/brand-icons/*` remains allowed.
- direct Radix use and visible native button/select/textarea/input recreations; hidden native file inputs remain narrowly allowed.
- browser `alert`/`confirm`/`prompt` and raw product fixed-overlay recreation.
- Account Settings sub-destinations returning to Sidebar.
- System Management route-family Tabs.
- Site Settings LoginPreview nesting inside the real settings form.
- Account Settings PageHeader/Tabs ownership drift.
- retired vendored/runtime assets and local primitive recreation patterns.
- CSS consumer takeover through `[data-slot]`, canonical primitive selectors, raw concrete design-system colors, or `!important`.

## Rendered browser contract

Default rendered matrix:

- 11 authenticated/AppShell routes × 4 viewports × 2 themes = 88 cases.
- 5 Auth routes × 4 viewports × 2 themes = 40 cases.
- Total default matrix = 128 cases.

Viewports: 1440×900, 1024×768, 768×1024, 390×844. Themes: light and dark.

The full Browser Acceptance suite closes at **149 tests**, adding 21 focused interaction/state proofs including Account Tabs, Clients edit/delete presentation, Users destructive confirm → Sudo presentation, Password recent-auth failure, MFA enrollment presentation, Passkeys empty/register/failure, Sessions revoke, Audit filters/detail, Site Settings error→retry, System Status degraded→healthy refresh, Login validation/backend-error/MFA/Passkey branches, Forgot/Reset validation/error, OAuth callback processing→error, AppShell/mobile navigation, and responsive modal behavior.

Browser evidence uses fixture session/API state. It proves rendered presentation and interaction ownership, not production authentication or authorization.

## Direct Showcase parity contract

The canonical Gosso harness compares current Product and current Gouno UI Showcase using:

1. DOM/structural assertions,
2. computed-style comparison,
3. stable geometry comparison,
4. paired screenshots retained as CI artifacts.

It intentionally does not use a brittle full-page zero-pixel diff.

Representative surfaces are Overview hero/quick links, Clients collection/actions, Site Settings form/LoginPreview, Account Tabs/Profile, MFA, Login, Forgot Password, and NotFound. Light + dark gives **16 direct parity tests**.

The style/geometry contract includes display/position/gap, four-side padding, border widths/radius, background, opacity, shadow, and stable control/surface width/height roles.

## Reciprocal consumer parity

Gouno UI now owns a dedicated `Gosso Admin Consumer Parity` workflow. For relevant candidate Gouno UI changes it:

1. checks out current `rushairer/gosso-admin/main`,
2. checks out candidate Gouno UI,
3. installs both from their lockfiles on Node 24,
4. invokes the same canonical parity harness from the Gosso Admin repository,
5. retains paired browser evidence.

Assertions are not duplicated in Gouno UI. The consumer repository remains the canonical owner of its consumer-specific parity contract.

This produces the intended two-way defense:

```text
Gosso Admin change -> current Gouno UI main parity gate
Gouno UI change    -> current Gosso Admin main consumer parity gate
```

The existing Blog Consumer Parity remains independent and green; the reciprocal Gosso workflow does not modify or replace it.

## CI closure evidence

### Gosso Admin merged main

Hardening merge: `be18267a0a3f0a0bc2344c6fda5ee8a34772d511`.

Main-push evidence on that merge:

- CI: run `34974080964` — success.
- Security: run `34974080944` — success.
- Images: run `34974081042` — success.
- Gosso Showcase Parity: run `34974081033` — success.
- UI Browser Acceptance: run `34974081094` — success, including the 149-test rendered suite.

The normal frontend CI includes registry integrity validation, format, lint, `lint:ui`, `lint:css`, typecheck, tests/coverage, build, and `/identity-admin` subpath build.

### Gouno UI reciprocal gate

Reciprocal parity merge: `7e8872a4a216191ce56cf34ed3c3827c03645c37`.

- PR CI before merge: run `34974696306` — success.
- PR Gosso Admin Consumer Parity: run `34974696404` — success.
- main-push Gosso Admin Consumer Parity: run `34975119164` — success.
- main-push Showcase/Pages verify and deploy: run `34975119031` — success.
- latest completed relevant Blog Consumer Parity observed during closure: run `34974436960` — success. The final reciprocal merge changes only its workflow path, so Blog Consumer Parity is not re-triggered by that workflow-only merge.

Gouno UI remains version `0.4.1`; this hardening changed Showcase/tests/workflows/docs rather than a published package API/CSS contract, so no artificial SemVer release was created.

## Intentional differences

- The real product `*` route remains inside AdminLayout/AppShell while using the canonical NotFound Result composition; Showcase auth fixture routing is not the product routing owner.
- OAuth callback keeps Spinner for genuinely indeterminate token-exchange processing. The Skeleton rule does not apply to this state.
- Real MFA, Sudo/recent-MFA, Passkey/WebAuthn, OAuth client, session, permission, and account state machines remain richer than Showcase fixtures. Parity governs presentation, not security state ownership.
- FixtureDock, scenario controls, fake routes, and Showcase helper UI are excluded from product parity.
- Runtime branding, real data, route context, and authenticated identity may differ while canonical structure and presentation roles remain guarded.

## Security boundary

This program did **not** change OAuth2/OIDC semantics, Authorization Code + PKCE, callback/token exchange behavior, session restoration, auth redirects, RequireAuth/RequireAdmin, Sudo/recent-MFA semantics, MFA enrollment/verification/recovery-code semantics, Passkey/WebAuthn semantics, password reset security, account mismatch handling, session revocation semantics, OAuth client credential behavior, permissions, audit logging, CSP/security headers, cookies/security policy, API contracts, or backend behavior.

Fixture and mocked-browser evidence proves presentation/state rendering only. It is not production authentication, hardware/platform WebAuthn, destructive admin mutation authorization, real recent-MFA/Sudo, deployed proxy/cookie/CSP, or real OAuth-provider E2E evidence.

## Remaining risks

The parity program deliberately does not claim to prove:

- production IdP/OAuth-provider integration,
- real browser/OS authenticator WebAuthn ceremony and user activation,
- hardware/device attestation behavior,
- destructive administrator mutations against a production backend,
- real recent-MFA/Sudo enforcement across services,
- real session revocation propagation,
- deployed reverse-proxy, CSP, cookie, network, and external-provider behavior.

Those remain security/integration test concerns outside fixture-based Showcase parity.
