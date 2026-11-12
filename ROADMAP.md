# GOSSO Admin roadmap

> **Current source and release baseline (reviewed 2026-11-12):** [v0.7.25](https://github.com/rushairer/gosso-admin/releases/tag/v0.7.25) is published; the source contains GOSSO login, account/self-service and SSO administrative UI. See [docs/README.md](docs/README.md) and [the integration architecture](https://github.com/rushairer/gouno-blog/blob/main/docs/architecture/README.md) for actual deployment boundaries. Existing audit/publishing receipts preserve **unverified manual Showcase certification and external Staging/production acceptance**. A future item is not a defect claim; verify code and evidence first.

## Delivered foundations (not an all-gates production certification)

- React/Vite administrative frontend using the published `@gosso/client` dependency from the lockfile, with account security and management routes.
- GOSSO identity service and frontend deployed as separate containers in the integrated Blog topology; this repository also maintains a **standalone Nginx gateway** Compose option.
- Server-side GOSSO API authorization, login/MFA/Passkey/session security mechanisms, Compose security baseline, published release artifacts and smoke/CI gates.
- Cross-product Showcase parity fixtures and a certification ledger; `verified` is valid only under the ledger's exact version, canonical-path and manual-review conditions.

## Work requiring explicit fresh evidence before calling complete

- Manual-first rendered Showcase recertification and browser review for any `needs-manual-recertification` entries.
- Authorized external Staging, backup/restore, upgrade/rollback and production deployment receipts.
- Observability and audit retention SLOs, disaster-recovery RPO/RTO, scalability and accessibility (WCAG 2.2 AA): measure and document actual tested scope rather than assuming a P0/P1/P2 label implies readiness.
- Optional enterprise protocols (SCIM, LDAP/AD, SAML federation, conditional access and LTS policy): **future product decisions**, not features guaranteed by the current release.

## Historical milestone taxonomy (not actionable checkboxes)

- **P0 — Open-source and distribution baseline:** governance, CI, SBOM/signatures, release discipline; versioned artifacts already exist.
- **P1 — Identity security and compatibility:** active code area; only verified contracts count as completed.
- **P2 — Production operations:** platform/environment-specific acceptance and repeatable recovery evidence.
- **P3 — Enterprise integrations:** opt-in roadmap after core operational needs are established.

Roadmap entries are directional, not delivery commitments. Do not turn dated local proposals into current TODOs; the original November 8–9 Gosso v1.7.1 patches were superseded by official Gosso v1.7.1/v1.7.2 releases.
