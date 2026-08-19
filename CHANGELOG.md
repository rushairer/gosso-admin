# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Delegate profile, password, email, MFA, passkey, session, and password-reset flows to `@gosso/client#main` instead of maintaining endpoint and response logic in React pages.
- Validate the commit-pinned SDK lock entry in CI while retaining the fast-moving `main` development channel.

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

[Unreleased]: https://github.com/rushairer/gosso-admin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/rushairer/gosso-admin/releases/tag/v0.1.0
