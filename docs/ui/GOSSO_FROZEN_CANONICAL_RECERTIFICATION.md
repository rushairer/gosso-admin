# Gosso Admin Frozen Canonical Recertification

Status: **candidate / awaiting fresh package, rendered and manual review evidence**

Date: 2026-09-22

## Purpose

This review renews Gosso Admin Showcase parity after Gouno UI completed CSA-5 and froze `canonical-showcase.json`.

The 2026-09-15 hardening program remains historical engineering evidence, but it is not current certification evidence:

- it closed against `@gouno/ui@0.4.1`;
- Gosso Admin subsequently moved to `0.4.7`;
- the frozen consumer baseline is the published `@gouno/ui@0.4.8`;
- the current Gouno UI frozen main is `059bc2806689f70be7178c16fc50a339f6526405`;
- the frozen Gosso Product matrix now contains 12 Product Showcase ids.

This is a normal explicit dependency upgrade and recertification, not a broad product-side migration restart.

## Starting baselines

- Gosso Admin starting main: `a322644c97142bb26af37a93128a6ca2e3c60360`.
- Previous exact package pin: `@gouno/ui@0.4.7`.
- Candidate exact package pin: `@gouno/ui@0.4.8`.
- Gouno UI frozen main: `059bc2806689f70be7178c16fc50a339f6526405`.
- Browser plugin: not available in this session; repository Playwright/GitHub Actions is the rendered validation path.

The package change from 0.4.7 to 0.4.8 is intentionally small: Gouno UI changed shared Modal/Drawer nested-overlay interaction handling and associated tests. That makes a fresh Product quality/parity pass necessary even though the package API surface remains compatible.

## Frozen Showcase scope

The 12 frozen Gosso Admin Product ids are:

1. `gosso-overview`
2. `gosso-account-settings`
3. `gosso-not-found`
4. `gosso-system-clients`
5. `gosso-system-users`
6. `gosso-system-audit-logs`
7. `gosso-system-site-settings`
8. `gosso-system-status`
9. `gosso-login`
10. `gosso-forgot-password`
11. `gosso-reset-password`
12. `gosso-callback`

The Product has 16 real visual routes because the single frozen Account Settings Showcase page owns five real Product subroutes: Profile, Password, MFA, Passkeys and Sessions.

## Required evidence

Before promotion to verified/manual-reviewed status, the same candidate head must pass:

- Gosso Admin CI / frontend quality;
- Security;
- Images;
- Gosso Showcase Parity against current frozen Gouno UI main;
- UI Browser Acceptance;
- exact registry/lock integrity and `/identity-admin` subpath build.

Manual review must inspect the new paired and Product rendered artifacts directly.

The direct parity harness must cover all 12 frozen Product ids, not only the historical eight representative pairs. Account Settings must also exercise all five real Product subroutes under the single frozen canonical owner.

## Security boundary

This recertification does not change OAuth2/OIDC semantics, Authorization Code + PKCE, callback/token exchange behavior, JWT/session lifecycle, RequireAuth/RequireAdmin, Sudo/recent-MFA, MFA enrollment/recovery, Passkey/WebAuthn, password reset security, session revocation, OAuth client credentials, permissions, audit logging, API contracts, backend behavior, CSP or cookie policy.

Fixture/browser evidence proves presentation and interaction ownership only.

## Promotion rule

Do not claim Gosso Admin is re-certified merely because builds are green.

If fresh evidence finds a canonical defect, reopen/fix the canonical owner first. If it finds Product-only drift, fix Gosso Admin and rerun the same exact-head gates. Only after direct artifact inspection may the review move from candidate to verified.
