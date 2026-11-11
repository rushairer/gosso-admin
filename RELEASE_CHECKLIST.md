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

- [x] `docker compose config` passes at repository root.
- [x] Frontend passes `npm run format:check`, `npm run lint`, `npx tsc -b --noEmit`, `npm run test:run`, and `npm run build`.
- [x] Frontend passes `npm run test:coverage` without lowering the committed coverage ratchet.
- [x] Seed passes `go test ./...` or `go build ./...`.
- [x] `go vet ./...`, `govulncheck`, CodeQL, dependency review, and container vulnerability scans pass.
- [x] The referenced `ghcr.io/rushairer/gosso` image has passed the `gosso` repository release gates.
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
- [x] Validate the complete global `/api/v1/admin/oauth2/clients` contract, including retired-secret rejection and replacement-secret authentication, against signed immutable Gosso v1.7.1. [Acceptance42605082483](https://github.com/rushairer/gosso-admin/actions/runs/42605082483) passes at source852f527; the earlier v1.7.0 failure is historical. This does not satisfy manual or Staging gates.
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


## November 10 release-gate refresh

Gosso v1.7.1 is formally published at6c8ced618408f3625bbf022b67a08980a26a807d.
Its independently verified index is
`sha256:cdf81b3e6f532455aa8964e7921355c54e3bfca72bf5910cd21689d87fe80cbb`.
The earlier read-only scope and missing upstream patch blockers are resolved.
All Admin source852f527 automated gates passed, including actual rotation.

[Supplemental rendered review](docs/ui/system-status-release-review-2026-11-10.md)
covers desktop/mobile light/dark policy panels, complete scrolling and keyboard
refresh. It is AI-assisted fixture evidence, not maintainer certification or
real Staging. The certification ledger remains needs-manual-recertification.
Required approving PR review, real backup/restore/upgrade/rollback, target smoke
and operational receipts remain open. Do not create v0.7.25 while they are open.


## November 10 continued release preparation

Canonical development dependency findings are repaired through [UI PR163](https://github.com/rushairer/gouno-ui/pull/163), merged asad29789e. Exact-main CI, Golden, reciprocal Admin/Blog parity and Pages all complete successfully; full npm audit reportszero vulnerabilities. Public Pages browser interaction/font checks also pass. Package0.4.9 and all canonical component/fixture paths remain unchanged. Earlier risk statements are historical and superseded by this verified repair.

Blog [PR423](https://github.com/rushairer/gouno-blog/pull/423) addresses actual settings panel-order drift and BFF version-label consistency. Its results remain independent from this Admin PR. No dependency upgrade, certification promotion, Staging receipt or downstream release is inferred.

Admin PR97 code/test/workflow inputs remain identical to accepted852f527; this evidence update changes documentation only. Required approving review, maintainer direct certification and actual authorized Staging/restore/rollback remain open. Both target Tags stay prohibited until their mandatory gates pass.


## November 10 exact automated checklist receipt

The six checked automated verification rows above are supported by PR97 head
`0cc209c2e23ec17f6bf86194a23f73e04668a1d4`: [CI42785996181](https://github.com/rushairer/gosso-admin/actions/runs/42785996181),
[Security42785996346](https://github.com/rushairer/gosso-admin/actions/runs/42785996346),
[Images42785996200](https://github.com/rushairer/gosso-admin/actions/runs/42785996200),
[Browser42785996431](https://github.com/rushairer/gosso-admin/actions/runs/42785996431),
[Parity42785996618](https://github.com/rushairer/gosso-admin/actions/runs/42785996618)
and [released-Gosso42785996519](https://github.com/rushairer/gosso-admin/actions/runs/42785996519)
all completed successfully. Coverage runs the unit suite; the committed ratchet
was unchanged. Compose checks use CI fixture configuration, including placeholder
production digests; they do not accept a real deployment or its secrets.
Gosso1.7.1 independent publication evidence is recorded in the ecosystem report.
Any successor final merged/release SHA still requires its own checks.
All manual certification, real target preflight/smoke, backup/restore, rollback,
operator and formal artifact rows remain unchecked until actually accepted.
No Tag or deployment is authorized by checking these automated rows.


## November10 real local recovery evidence

- [x] [Disposable PostgreSQL15 recovery rehearsal](docs/quality/admin-disposable-recovery-2026-11-10.md) passes14 real checks using exact signed formal Gosso1.7.1, current Seed, encrypted custom-format backup, independent restore, fresh login and old/new Client Secret authentication. Operator secret-file inheritance is excluded and owned cleanup verified.
- [ ] Perform real target Staging preflight, TLS/MFA/SMTP checks, historical-data upgrade/rollback, keys/Redis recovery and operator sign-off. The local snapshot exercise does not complete the mandatory target Operations Gate.

Blog's bounded Connector decoder-error confidentiality repair is merged through
[PR424](https://github.com/rushairer/gouno-blog/pull/424) atff5f2198. No separate
Connector repair authorization is pending. Its final-main checks and artifacts
remain independently recorded in the ecosystem report. Human Showcase ledgers
and required approving PR review remain pending; no target Tag is permitted.
