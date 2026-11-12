# GOSSO Admin documentation index

The source repository owns the **GOSSO login, account and identity administration React UI**, not the `gouno-blog` product's `/admin/*` routes. Current implementation and deployment source are `gosso-admin-frontend/src`, root Compose/Nginx files and the upstream [GOSSO backend](https://github.com/rushairer/gosso).

## Current usage and operational reference

- [Standalone bootstrap](BOOTSTRAP.md), [operations](OPERATIONS.md) and [production baseline](PRODUCTION_BASELINE.md).
- [Identity Cookie / session model](SESSION_SECURITY.md) — distinguish identity-domain browser cookies from the separate Blog Confidential BFF.
- [Compatibility and versioning](COMPATIBILITY.md) — historical release combinations are snapshots; new compatibility must be established with exact released artifacts.
- [Repository settings](REPOSITORY_SETTINGS.md), [loading ownership](LOADING_OWNERSHIP.md).
- [Gouno Blog/Blog Admin/GOSSO actual architecture and SVG](https://github.com/rushairer/gouno-blog/blob/main/docs/architecture/README.md).
- [Root release checklist](../RELEASE_CHECKLIST.md) and [root roadmap](../ROADMAP.md): publication and unverified operational gates must be distinguished.

## Certification and dated evidence

- [Showcase certification ledger](ui/showcase-parity-certifications.json) is an actively enforced source for specific UI ownership/version paths; automatic green tests do not replace manual-first recertification.
- [November 2026 release closeout audit](quality/ecosystem-release-final-2026-11.md) and [November 11 independent release evidence](quality/release-evidence-2026-11-11/independent-verification.json) are immutable point-in-time records. The formal [v0.7.25 release](https://github.com/rushairer/gosso-admin/releases/tag/v0.7.25) exists; manual Showcase certification and external Staging remain unverified in the recorded publication exception.
- [Historical Gosso v1.7.1 local patch packets](quality/proposals/) document the November 8–9 investigation and were **superseded by official Gosso v1.7.1/v1.7.2**. They are not a current patch queue and should not be re-applied to upstream main.
- Dated `quality/*` and `ui/*-RECERTIFICATION*` files preserve the outcome known at the time; consult current source, ledger and published releases for current status.

## Documentation hygiene

No second `doc/` directory. Keep one canonical location `docs/`, while preserving exact historical receipts. Do not claim code shipped, operational approval or manual review simply because a checklist or proposal changed status. Only remove truly duplicated evidence after checking Git history and inbound links.
