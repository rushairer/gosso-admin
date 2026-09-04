# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.7] - 2026-09-04

### Added
- Introduce in-app Sudo Mode (`useSudo` / `SudoModal`) with 5-minute verification grace period (`sessionStorage`, aligned with backend strong-auth TTL) for sensitive operations.
- Add Sudo Mode view in `LoginSurface` and `Login.tsx` that skips username/password re-entry for active sessions, verifying TOTP/Passkey directly before returning.
- Protect Site Settings modification (`SiteSettingsTab`), Role Assignment/Revocation, Reset User MFA, Reset User Password (`UsersTab`), Client Secret Rotation / Deletion (`ClientsTab`), Passkey registration and removal (`PasskeysPanel`), and MFA backup code regeneration (`MFAPanel`) with unified Sudo MFA challenge.
- Auto-catch stale strong authentication errors on passkey registration and prompt Sudo step-up modal immediately.

### Fixed
- Fix Radix Dialog overlay and content z-index hierarchy by removing conflicting `z-50` utility classes, ensuring dialog overlay (`z-index: 1000`) and content (`z-index: 1001`) reliably cover background elements and sticky bars.
- Fix `EmptyState` visual alignment across all pages by setting `.empty-state` as a centered flex column and centering `.empty-state-icon svg`, eliminating leftward icon drift.
- Wrap `EmptyState` in `PasskeysPanel` inside `PanelBody` to conform to panel container standards.

## [0.7.6] - 2026-09-03

### Changed
- Upgrade `Drawer` with Tab focus trapping, Esc close, previous focus restoration, body scroll locking, and explicit ARIA modal attributes.
- Extend `AsyncState` with built-in empty state rendering, standardizing empty and error handling across sessions and audit log tabs.
- Add explicit Chinese font fallbacks (`PingFang SC`, `Microsoft YaHei`) to body typography stack.
- Modernize `SessionsPanel` to use `Badge` instead of deprecated `Tag`, replacing full-page spinner with table skeletons and localized empty state.
- Standardize grid and spacing utility classes across user creation modal and audit log filters.

## [0.7.5] - 2026-09-02

### Added
- Add strong authentication warning and localized messages when authorization requests require MFA step-up.

## [0.7.4] - 2026-09-01

### Fixed
- Upgrade `@gosso/client` to `0.9.2` to preserve in-flight OAuth flow state (`auth_state`, `pkce_verifier`, `post_login_redirect`) during unauthenticated session initialization and session clear, fixing `State mismatch. Potential CSRF attack.` error on direct IdP login.
- Fix button text vertical centering on authentication error callback page.

### Changed
- Provide tailored overview dashboard for non-admin users with quick shortcuts to profile, security, and session management instead of an access denied error.

## [0.7.3] - 2026-08-31

### Security
- Allow the seed job to receive its database DSN and initial administrator
  password through authoritative Docker Secret files, failing closed when a
  configured file is unavailable or empty.

## [0.7.2] - 2026-08-30

### Fixed
- Pin `@gosso/client` to the immutable registry release `0.9.1`.

## [0.7.1] - 2026-08-30

### Fixed
- Pin `@gosso/client` to the immutable registry release `0.9.0`.

## [0.7.0] - 2026-08-30

### Added
- Add a confirmed Client secret rotation action that displays the replacement secret only once.

## [0.6.1] - 2026-08-29

### Changed
- Upgrade `@gosso/client` to `0.8.8` to enforce RFC 10017 BFF boundary isolation.

## [0.6.0] - 2026-08-29

### Added
- Add RFC 8707 `allowed_resources` input field to ClientEditorModal with form serialization and validation.
- Add English and Chinese translation keys for allowed resources.

### Changed
- Upgrade `@gosso/client` to `0.8.7`.

## [0.5.1] - 2026-08-28

### Changed
- Upgrade `@gosso/client` to `0.8.4`.

## [0.5.0] - 2026-08-28

### Changed
- Upgrade `@gosso/client` to `0.8.0` and adopt provider session initialization so Cookie-backed sessions restore before guarded routes render.
- Centralize authentication and admin authorization at the application route boundary; remove page-level redirect and imperative profile checks.
- Keep system-management user profile updates reactive through `useUserProfile`.

## [0.4.1] - 2026-08-28

### Changed
- Upgrade `@gosso/client` to `0.6.1`.
- Refactor admin API services (`clientService`, `accountService`, `auditService`, `siteSettingsService`) to use `gossoClient.get / post / put / delete` with unified error handling.
- Adopt `useRequireAuth` hook in `AccountSettings` and `SystemManagement` pages to eliminate duplicate authentication redirect logic.

## [0.4.0] - 2026-08-28

### Changed
- Upgrade `@gosso/client` dependency to `0.6.0`, enabling declarative route guards, typed API clients, and seamless responsive session subscriptions.
- Align authentication, profile, MFA, and passkey management with latest SDK contracts.

## [0.3.0] - 2026-08-24

### Changed
- Delegate profile, password, email, MFA, passkey, session, and password-reset flows to `@gosso/client` instead of maintaining endpoint and response logic in React pages.
- Consume the registry-published `@gosso/client` 0.4.0 package with lockfile integrity.

### Fixed
- Preserve CSP, HSTS, Permissions-Policy, COOP, CORP, and related security headers on cached assets and SPA fallback responses.

### Security
- Upgrade the Seeder to Go 1.26.6 and `golang.org/x/text` 0.39.0 to resolve reachable advisories.
- Redact development default credential values from Seeder warning logs.

## [0.2.0] - 2026-08-15

### Changed
- Passkey registration, listing, and deletion now delegate to `@gosso/client`
  instead of the hand-rolled WebAuthn ceremony and base64 helpers.
- MFA enrollment QR now renders declaratively with `qrcode.react` instead of
  the imperative `qrcode.toDataURL` flow.

### Security
- Update transitive development dependencies `nanoid`, `postcss`, and `undici`
  to versions that resolve the open Dependabot advisories.

## [0.1.0] - 2026-07-11

### Added

- Apache-2.0 licensing and community governance documents.
- Release, compatibility, security, and production-operations baselines.
- Automated dependency, code, container, SBOM, provenance, and signature checks.

### Changed

- Release quality gates now include formatting, coverage, Go vet, vulnerability checks, and production configuration validation.
- The supported server baseline is Gosso `1.1.x` with OpenAPI `1.2.x` and database schema `20`.

### Security

- Hardened browser security headers and legacy database seeding safeguards.
- Updated the Seeder to Go 1.26.5 and pgx 5.9.2 to remove reachable standard-library and SQL sanitizer vulnerabilities.
- Upgrade Alpine runtime packages during frontend image builds so published images do not retain fixed high-severity base-image vulnerabilities.

[Unreleased]: https://github.com/rushairer/gosso-admin/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/rushairer/gosso-admin/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/rushairer/gosso-admin/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/rushairer/gosso-admin/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/rushairer/gosso-admin/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/rushairer/gosso-admin/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/rushairer/gosso-admin/releases/tag/v0.1.0
