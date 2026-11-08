# GOSSO Admin Release Checklist

Use this checklist before tagging a release, publishing an image, or handing the stack to anyone outside local development.

## Security Gate

- [ ] `./scripts/preflight.sh production` passes with zero failures.
- [ ] Default administrator password is not `admin123`.
- [ ] RSA signing key exists, is not committed, and has `600` or stricter permissions.
- [ ] `GOUNO_AUTH_ISSUER` is the final HTTPS issuer origin.
- [ ] `GOUNO_AUTH_TOTP_ENCRYPTION_KEY` is a unique 64-character hex key.
- [ ] `GOUNO_AUTH_VERIFY_HASH_PEPPER` is unique and not the all-zero local value.
- [ ] PostgreSQL and Redis credentials are unique and stored as deployment secrets.
- [ ] SMTP uses a verified sender domain and `GOUNO_SMTP_TLS_POLICY=mandatory`.
- [ ] CORS origins and trusted proxy CIDRs are explicit.
- [ ] Swagger access is disabled, internal-only, or otherwise access-controlled.

## Verification Gate

- [ ] `docker compose config` passes at repository root.
- [ ] Frontend passes `npm run format:check`, `npm run lint`, `npx tsc -b --noEmit`, `npm run test:run`, and `npm run build`.
- [ ] Frontend passes `npm run test:coverage` without lowering the committed coverage ratchet.
- [ ] Seed passes `go test ./...` or `go build ./...`.
- [ ] `go vet ./...`, `govulncheck`, CodeQL, dependency review, and container vulnerability scans pass.
- [ ] The referenced `ghcr.io/rushairer/gosso` image has passed the `gosso` repository release gates.
- [ ] `./scripts/smoke.sh` passes against the target deployment.
- [ ] `ADMIN_PASSWORD=<secret> ./scripts/smoke.sh` or `SMOKE_ACCESS_TOKEN=<token> ./scripts/smoke.sh` passes against a disposable admin account or staging environment.
- [ ] `SMOKE_MUTATE=true` smoke checks pass in staging, including temporary OAuth2 client and user create/cleanup.

## Product Gate

- [ ] README quick start works from a clean clone.
- [ ] Admin can sign in, create a user, register an OAuth2 client, revoke consent, and view audit logs.
- [ ] Normal users cannot access `/admin`.
- [ ] System Status shows readiness and OIDC discovery metadata.
- [ ] Referenced Gosso OpenAPI documentation matches the deployed Gosso image.

## Operations Gate

- [ ] Backup and restore procedure has been rehearsed for PostgreSQL.
- [ ] Redis persistence and token/session loss behavior are understood by operators.
- [ ] Upgrade notes mention migrations, rollback limits, and expected downtime/rolling behavior.
- [ ] Monitoring includes `/health`, `/readiness`, application logs, and metrics.
- [ ] Rollback image/tag and database restore point are available.
- [ ] Every promoted image is referenced by digest, has SPDX and CycloneDX SBOMs, build provenance, and a verifiable keyless Cosign signature.
- [ ] Release tag matches `gosso-admin-frontend/package.json`, and the compatibility matrix names the exact Gosso API/schema line.

## v0.7.25 release-train blockers (2026-11-05)

- [x] Version metadata pins 0.7.25; frontend dependencies pin @gouno/ui 0.4.9 and @gosso/client 0.9.3.
- [ ] Renew `docs/ui/showcase-parity-certifications.json` through manual-first rendered review and a PR; current status is `needs-manual-recertification`.
- [ ] Validate the complete global `/api/v1/admin/oauth2/clients` contract, including retired-secret rejection and replacement-secret authentication, against the signed published immutable Gosso release. Earlier v1.7.0 smoke observed a rotation response but did not verify credential behavior; the stronger November 6 acceptance proves the published image is defective. See the November 8 audit and repair proposal.
- [ ] Complete the deployment, secret, backup/restore and operator gates above against an identified staging environment. No production deployment is authorized by this release task.

No v0.7.25 tag may be created while these gates remain open. Historical green CI/browser/parity evidence is supporting evidence, not manual certification or staging acceptance.

Evidence: [main compatibility run 42015649627](https://github.com/rushairer/gosso-admin/actions/runs/42015649627) accepted `64f4c437898eec66962cb966c840588eb331c9e1`; the same main SHA passed CI, Security and Images. [PR #88](https://github.com/rushairer/gosso-admin/pull/88) passed its pre-merge gates. Manual Showcase status remains `needs-manual-recertification`; target staging, backup/restore and operator gates remain open. No v0.7.25 tag was created.

## November 6 closeout evidence (still blocked)

See [the final ecosystem audit](docs/quality/ecosystem-release-final-2026-11.md).
Main `51fe7448e3ff526e961630133443221507e9633f` passed fresh
[Browser Acceptance, 150 tests](https://github.com/rushairer/gosso-admin/actions/runs/42195385357)
and [Showcase Parity, 32 tests](https://github.com/rushairer/gosso-admin/actions/runs/42195392313).
[PR #97](https://github.com/rushairer/gosso-admin/pull/97) adds real cross-owner
privilege/session coverage and repairs authenticated release smoke; its final
head must pass compatibility, CI, Security and Images before review/merge.

These results do not check off the manual or operational gates. Direct Chromium
inspection found broken font delivery in the Canonical Showcase while Product
fonts load. The certification ledger remains pending, and an authorized Staging
target, maintainer approval, actual backup restore and rollback receipts are
still missing. No v0.7.25 tag, target image or deployment is asserted.

## November 8 resumed closeout — mandatory blockers retained

Canonical font delivery is repaired in [UI PR #161](https://github.com/rushairer/gouno-ui/pull/161); exact UI main d171541 passes normal Golden (187), both consumers and Pages. Real public Chromium font-load/network verification succeeded November 8. This closes the delivery defect only; the ledger still requires maintainer direct rendered review and a separate approval.

[Released-image acceptance 42203332667](https://github.com/rushairer/gosso-admin/actions/runs/42203332667) **fails**: old secret still authenticates, returned replacement does not. Keep the full governance checkbox open and retain the failing test. [The concrete local Gosso repair proposal](docs/quality/proposals/gosso-v1.7.1-local-proposal.md) passes local race/integration/security checks, but Gosso is read-only until a scope exception; no v1.7.1 publication or baseline is asserted. No Staging, backup restore, rollback or maintainer certification box may be checked from these tests.
