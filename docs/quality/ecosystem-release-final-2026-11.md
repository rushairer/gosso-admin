# Gouno Ecosystem 1.4 — final closeout audit, 2026-11-06

**Release Complete: NO.** GOSSO Admin v0.7.25 and Gouno Blog v1.6.0 remain unpublished candidates. Neither target tag exists in the audited remote state. No target tag, GitHub Release, release image or production deployment was created by this closeout.

This report separates current automated evidence from required direct human certification and real operational acceptance. It is a review document, not permission to bypass an open gate. Reference versions were not republished or retagged; formal compatibility documentation remains unchanged.

## 1. Remote state and formal versions

All original worktrees were clean when audited. Remote references, Releases, Actions and open PRs were queried afresh on November 6. Work uses isolated clones and review branches; original worktrees and host services were preserved. Blog's historical local tag-object conflicts were preserved; a fresh isolated clone acquired authoritative remote tags without overwriting local tags.

The table reports **existing formal release tags**, not proposed tags. Main and release-tag commits are intentionally distinct.

| Repository | Formal version | Audited main SHA | Formal tag peeled commit SHA | GitHub Release |
| --- | --- | --- | --- | --- |
| gouno | v1.4.0 | `13d4a0adc4b6cf343c709019159b8609ab4b5875` | `20efba0af181cb3e03c5bcb199576bfcdec1bd7f` | [Release](https://github.com/rushairer/gouno/releases/tag/v1.4.0) |
| gouno-template | v1.4.0 | `01f227f34f6c056998a006bb8320f6187822aaf4` | `9f0cba9c8a6be6331f48596c83663efbec5490a2` | [Release](https://github.com/rushairer/gouno-template/releases/tag/v1.4.0) |
| gouno-cli | v1.3.0 | `a3930d1391ce3aedb8661eef472555611fd54540` | `087c00a523a6ec8c512d5eb9c65f657f6be8d5fb` | [Release](https://github.com/rushairer/gouno-cli/releases/tag/v1.3.0) |
| gosso | v1.7.0 | `5bd45c8f9946662274117c4644b31ce90a003464` | `5bd45c8f9946662274117c4644b31ce90a003464` | [Release](https://github.com/rushairer/gosso/releases/tag/v1.7.0) |
| gosso-admin | v0.7.24 | `51fe7448e3ff526e961630133443221507e9633f` | `974ddfce7c4efe5abe7edfa7b4e597e9258573d3` | [Release](https://github.com/rushairer/gosso-admin/releases/tag/v0.7.24) |
| gouno-blog | v1.5.26 | `53d4a7c9eb781b12bc583800fdda3a62af515be2` | `107ee2e28eb96bda1409926fdb324550bb1bae98` | [Release](https://github.com/rushairer/gouno-blog/releases/tag/v1.5.26) |
| gouno-ui | v0.4.9 | `b706b6c25c6252c7f55500b69eb08e17c1de554b` | `4495147ae0b9807d2e5c9137187cfdc3e906cceb` | [Release](https://github.com/rushairer/gouno-ui/releases/tag/v0.4.9) |
| gouno-doc | v1.3.1 | `fad499f7f28ff2e86d03d5c26ae6de127222d915` | `fad499f7f28ff2e86d03d5c26ae6de127222d915` | [Release](https://github.com/rushairer/gouno-doc/releases/tag/v1.3.1) |
| gouno-agent-demo | v0.3.0 | `735794f1982a0f969e5b956a929f5e9a92440e86` | `ca372fc72379dbf63e6794f5d4e65af7c88e8ba7` | [Release](https://github.com/rushairer/gouno-agent-demo/releases/tag/v0.3.0) |

Target refs `gosso-admin:v0.7.25` and `gouno-blog:v1.6.0`: **ABSENT**. Target release artifact digests: **not published / not accepted**. Their existing formal versions remain v0.7.24 and v1.5.26 respectively.

Admin open PRs #89–96 were existing Dependabot work; no dependency batch was merged. In particular, Node 26 types and Vitest 5 updates are separate maintenance and cannot silently change this release baseline. Blog had no open PRs at initial audit. Closeout changes are proposed through [Admin PR #97](https://github.com/rushairer/gosso-admin/pull/97); required review and merge remain separate from green checks. The API reported no active classic main protection/rulesets, while the repository's settings document prescribes PR reviews; no direct-main bypass was used.

## 2. Readiness and blockers

| State | GOSSO Admin v0.7.25 | Gouno Blog v1.6.0 |
| --- | --- | --- |
| Code Ready | Candidate baseline; test/script corrections proposed in PR #97; final merged SHA still pending | Candidate baseline; no product changes in this closeout; complete final release review remains open |
| CI Ready | Main browser/parity pass; test PR has separate exact-head gates; rerun after final merge | Main CI, BFF, browser and parity pass; a later merged SHA requires its own gates |
| Manual Certification Ready | **NO**: frozen ledger needs manual recertification; maintainer live review/sign-off absent; Canonical font delivery broken | **NO**: blog-admin-ai needs manual recertification; full state review and reviewed ledger renewal absent; same Canonical font defect |
| Staging Ready | **NO**: authorized target/configuration and backup/restore/rollback receipts not supplied | **NO**: target/configuration and operational receipts not supplied; Admin release also pending |
| Release Published | **NO** | **NO** |
| Production Deployed | **Not performed; no named production authorization** | **Not performed; no named production authorization** |

Blocking order: resolve Canonical Showcase delivery and review its evidence; finish required manual-first certification through reviewed commits; identify authorized Staging and pass actual operational gates; accept final merged Admin SHA; release and independently verify Admin artifacts; then accept Blog's final SHA and release/verify all three Blog images. Only then update formal ecosystem compatibility matrices. Do not create tags from this report's candidates.

The latest PR check status is available on PR #97; the evidence tables below deliberately distinguish intermediate test SHAs from the eventual accepted final main. No intermediate success is promoted to a final release approval.

## 3. Exact-head automated evidence

### Admin

Main: `51fe7448e3ff526e961630133443221507e9633f`.

| Gate | Evidence | Result |
| --- | --- | --- |
| Main CI | [42016212154](https://github.com/rushairer/gosso-admin/actions/runs/42016212154) | completed/success |
| Main Security | [42016212099](https://github.com/rushairer/gosso-admin/actions/runs/42016212099) | completed/success |
| Main Images | [42016212304](https://github.com/rushairer/gosso-admin/actions/runs/42016212304) | completed/success; main channel, not v0.7.25 |
| Fresh Product Browser Acceptance | [42195385357](https://github.com/rushairer/gosso-admin/actions/runs/42195385357) | 150 passed, Ubuntu 24.04 |
| Fresh Gosso Showcase Parity | [42195392313](https://github.com/rushairer/gosso-admin/actions/runs/42195392313) | 32 passed; no human certification inferred |
| Expanded real cross-owner compatibility | [42195526695](https://github.com/rushairer/gosso-admin/actions/runs/42195526695) | success at `e5f501e48f511be3928ea260f3c5c29e7945899d`; later smoke changes require fresh acceptance |
| PR quality/security/images at e5f501e | [CI](https://github.com/rushairer/gosso-admin/actions/runs/42195527105), [Security](https://github.com/rushairer/gosso-admin/actions/runs/42195526692), [Images](https://github.com/rushairer/gosso-admin/actions/runs/42195526756) | success; no target release manifest published |

The cross-owner acceptance uses the released Gosso v1.7.0 immutable image, creates a normal owner via real HTTP, checks anonymous 401 and non-admin global list/create/update/rotation/delete 403, preserves the owner-scoped cross-account denial, verifies administrator update/secret replacement/deletion without changing ownership, and checks live-session/logout/revoked-session behavior. Existing real cookie, PKCE, seed and discovery assertions remain. This does not establish MFA deployment policy or a real operator's Staging session.

The first added test failed because the synthetic account password did not satisfy the released special-character policy. The fixture was corrected; the security policy was not changed. A further release-smoke audit found `json_value` consumed stdin as Python source instead of JSON; the fix preserves input JSON and removes curl's TLS-verification bypass. Full authenticated mutation/cleanup smoke was added to the disposable compatibility runner. Its next run demonstrated working login/client/user cleanup but correctly failed the old Swagger-307 expectation on the non-debug release image. The release check now explicitly requires both `/swagger` and `/swagger/index.html` to be 404; it does not accept a broader status range. This final correction still requires its own green run. The final PR head must pass; historical e5f501e success does not certify later corrections.

### Blog

Main: `53d4a7c9eb781b12bc583800fdda3a62af515be2`.

| Gate | Evidence | Result |
| --- | --- | --- |
| Backend, isolated PostgreSQL integration, Seed, Frontend, Compose, image contract | [42016283335](https://github.com/rushairer/gouno-blog/actions/runs/42016283335) | completed/success; dependency-review job skipped on main by event rules, not described as a PR dependency review pass |
| Published Gosso v1.7.0 confidential BFF compatibility | [42016283306](https://github.com/rushairer/gouno-blog/actions/runs/42016283306) | completed/success on exact main |
| Current main image build/publish | [42016283318](https://github.com/rushairer/gouno-blog/actions/runs/42016283318) | completed/success; not v1.6.0 release evidence |
| Fresh Product Browser Acceptance | [42195398048](https://github.com/rushairer/gouno-blog/actions/runs/42195398048) | 366 passed, completed/success |
| Fresh Showcase Parity | [42195404351](https://github.com/rushairer/gouno-blog/actions/runs/42195404351) | 86 passed; no human certification inferred |
| Supplemental local interaction review | original three Playwright files, unchanged assertions, isolated Vite port 4175 | 23 passed, macOS; supplemental, not the official Ubuntu certification runner |

Main CI includes Go race, vet, govulncheck, required isolated-database integration with race, Seed validation, frontend format/lint/typecheck/build/coverage and image-signature contract tests. Frontend: 392 tests/67 files passed. Security-package coverage: secretbox 88.7%, provider 86.5%, authbff 83.0%; ratchets were not changed. Govulncheck reported zero reachable vulnerabilities and also three findings in required modules not called by this code; do not translate that result into a claim of zero module findings.

The real BFF test validates confidential seed policy, Authorization Code + PKCE with a Blog-only RFC 8707 resource, UserInfo audience rejection, refresh audience retention, an HttpOnly login-flow handle requesting AAL2, HTTPS back-channel logout, and server-held refresh revocation against the release digest. It does not substitute for final deployment TLS/Cookie/CSRF/CORS acceptance.

The v1.6.0 minor decision remains appropriate for External Capability Gateway, API Access management, provider configuration and guarded recovery/reconciliation capabilities. No patch-only downgrade, Connector behavior change, approval/recovery business rewrite or UI/Client upgrade was made. Existing atomic-approval, database fault/concurrency, owner-lock, OIDC/logout, error-redaction and in-document JSON Schema regressions belong to the full backend/integration gates; a full final human release-diff review remains explicitly open in RELEASE_CHECKLIST.

## 4. Showcase evidence and certification limits

Ledgers were read and **not changed**:

- Admin: `docs/ui/showcase-parity-certifications.json`, `gosso-admin-frozen`, needs-manual-recertification. The pending November 3/4 review explicitly distinguishes assistant inspection from maintainer live interaction sign-off.
- Blog: `docs/ui-redesign/showcase-parity-certifications.json`, `blog-admin-ai`, needs-manual-recertification. November 2 latest-intent requirements include current loading/error/retry, stale success/error and leaving a pending read.

Fresh real Chromium review used unmodified Product source and the current UI reference `b706b6c25c6252c7f55500b69eb08e17c1de554b`. Canonical Pages was also really opened. Browser-plugin tools were unavailable; MCP browser initially worked, then closed its connection, so native repository Playwright was used as the documented fallback. Deterministic API fixtures are labelled fixture evidence, never live API, MFA or Staging proof.

36 supplemental rendered captures cover Admin System Status and its scrolled lower capability/security panels, plus Blog AI Settings Agents/Skills/Tools/knowledge sections and AI Operations overview/review/automation/Run Center tabs, desktop light and mobile dark. DOM inspection found no document overflow or unexpected fixture requests in these captures. Selected images were directly inspected; this is **partial assistant review**, not exhaustive maintainer certification. Supplemental 23 interaction tests include delayed stale Workflow success/error, pending-read invalidation, Agent desktop/mobile selection, refresh ownership, API Access credential/revocation interaction, controlled Skill modal and invalid JSON recovery, and Provider/Embedding layout. They do not prove real backend mutations.

**New blocker:** the public Canonical Showcase requests missing Inter and JetBrains Mono assets under `https://rushairer.github.io/src/fonts/…`; both returned 404 and `document.fonts` reported `error`. Unmodified local Canonical also has failed font faces; Product registry fonts load. UI `src/base.css` references source fonts absent from the source tree; npm asset preparation populates `dist/fonts`. Existing golden/parity green did not catch this delivery defect. No Product fallback-font adaptation, golden refresh or forged certification was made. UI is read-only under this task; a minimal Showcase-only fix requires the requested scope exception, review and fresh Pages/golden/consumer verification. Keep @gouno/ui at 0.4.9.

Retained CI artifacts (API digests are distinct from independently downloaded hashes):

| Artifact | Run | Artifact ID | Archive SHA-256 |
| --- | --- | --- | --- |
| Admin Browser Acceptance | 42195385357 | 13491912782 | `1f888510c94c9872bc6f05bfd5d70144ba95cf08e083a6f890f9b646e92cd41a` independently downloaded and matched |
| Admin Showcase Parity | 42195392313 | 13491852965 | `c7cd55aad8edb7370af20cb5993cac101e113d9f11f21b02d6596deb128cbf7d` independently downloaded and matched |
| Blog Browser Acceptance | 42195398048 | 13492610459 | `b1c85023f59ccc94363d5f20cd3a4d0e90379423a3f438f360cf3c56b9216b58` API digest; local verification tracked in receipts |
| Blog Showcase Parity | 42195404351 | 13492445481 | `e4c594f58407393975c06c1d86e664463ad7a4a30ebc2649d65694c65c40f7d0` API digest; local archive verification tracked in evidence receipts |

Local evidence delivery: workspace `docs/quality/final-evidence-2026-11/`, including the original public screenshot `canonical-public-status-font-failure.jpg`, Product/Canonical screenshots, browser-review.json, native Playwright report, remote-state.json and signature verification JSON/log. Screenshots/build output are outside the Git repositories and not committed. Download failures are not accepted as verified archives. Evidence hashing does not itself certify visual correctness.

## 5. Dependency and registry compatibility

| Consumer | Required baseline | Acceptance / release relationship |
| --- | --- | --- |
| Template v1.4.0 | Core v1.4.0; Go 1.26/1.27 CI | Already published template; root go.mod is a template, not a proxy module |
| CLI v1.3.0 | Template v1.4.0 pinned bootstrap | Already published; no repeat tag |
| Gosso v1.7.0 | Core v1.4.0 | Published signed immutable image |
| Admin v0.7.25 candidate | @gouno/ui **0.4.9**, @gosso/client **0.9.3**, Node **>=24.15 <25**; Gosso v1.7.0 governance | Exact pins retained; no formal v0.7.25 until all blockers close |
| Blog v1.6.0 candidate | Core **v1.4.0**, UI **0.4.9**, Client **0.9.3**, patched Go 1.27.x, Node 24 | Independent BFF acceptance passed; formal release waits for Admin acceptance |
| UI v0.4.9 | Published package; no new runtime/API release justified | Main changes since tag are Showcase/CI/docs, not a reason for v0.4.10 |
| Doc v1.3.1 | Existing formal compatibility matrix | Keep Admin v0.7.24 / Blog v1.5.26 as formal; candidates must be labelled |
| Agent Demo v0.3.0 | Core v1.4.0 | Already published; independent maintenance |

Previously accepted registry receipts (November 5; retained in the earlier ecosystem audit, not claimed as a fresh November 6 registry download): Core v1.4.0 sum `h1:cCs2eGv6XCJMN4q2RFaFPCL1Ip0PY21RSHp3mT4tAYY=`, go.mod `h1:S2DmlM4BlX3BLoeRw7s66aABDJDexP4Gj/xov28MmvA=`; UI 0.4.9 integrity `sha512-+mOkw+VL/whS2bBK8mQlU6kMHjL5AxleOE1qO2rK3xD58KZsQ6IyO+0S/UciKklvrJIH+qz/LhMUrJ04XxWjlQ==`; Client 0.9.3 integrity `sha512-weH+uD44qTxV6rGnvlaXXj9VHkulCiq6vk6NoHgd9P19eH8VL9e9g0G7aJOHcR+0nrJaD2yuYUXgAEUpI/F/Pg==`.

UI existing current-main runs: [Pages 41805317403](https://github.com/rushairer/gouno-ui/actions/runs/41805317403), [Golden 41805317297](https://github.com/rushairer/gouno-ui/actions/runs/41805317297), [Blog consumer 41805317271](https://github.com/rushairer/gouno-ui/actions/runs/41805317271), [Admin consumer 41805317291](https://github.com/rushairer/gouno-ui/actions/runs/41805317291), all green, with the newly observed font defect still blocking acceptance. Reference CI URLs and full main refs are retained in remote-state.json.

## 6. Image identity, signatures, SBOM and provenance

Published Gosso v1.7.0:

- OCI index: `sha256:b88b0475af7633afa8d6fda8ca7c3f4297d235a36e88219d9010818e76ff889a`.
- linux/amd64 child: `sha256:71b33234b42340092d4ed39f726854c89554e136cea2b9a7d463421744b62637`.
- linux/arm64 child: `sha256:b0d232aa5a0ee257951f16da844ffbc1cd3fdb306340f7d69be3514f481a1079`.
- November 6 independent Cosign verification succeeded against exact certificate identity `https://github.com/rushairer/gosso/.github/workflows/release.yml@refs/tags/v1.7.0`, issuer `https://token.actions.githubusercontent.com`, and the index digest. Two signatures returned; claims, certificate chain and transparency-log inclusion were verified. This is verification, not merely a signing-step success.
- Prior accepted SPDX file SHA-256 `8f73efe159ea68a9b2aeba70671d75a76ccc81faaa4bcec8a5007c51043a3175`; CycloneDX `bc9f1bff0d16ad5b2a8e37912dc3004948354cb8bd486f79b2bed3c8a0c7dbae`. Prior attestation and dual-architecture HIGH/CRITICAL scan receipts are in the November 5 audit; not presented as fresh November 6 rescans.
- Helm OCI 1.7.0 digest: `sha256:97a538f2049c377218051bcaa58b225c77495e1140a4193c646afcac6601f33c` (prior accepted receipt).

For **Admin v0.7.25**, frontend/Seed/identity-admin tagged digests, tag-ref Cosign verification, SPDX/CycloneDX, provenance and release attachments are **PENDING**. Successful main or PR image builds do not supply those artifacts.

For **Blog v1.6.0**, backend/frontend/Seed tagged digests, exact `publish-images.yml@refs/tags/v1.6.0` identity verification, SPDX/CycloneDX, provenance and release attachments are **PENDING**. `doc/release-manifest-v1.6.0.md` remains blocked and cannot contain main-channel digests as substitute release artifacts. Record actual own-image digests in a post-publication documentation commit without moving the validated tag.

## 7. Operational acceptance still required

No authorized Staging host/URL, non-secret connection method, backup restore receipt or rollback exercise record has been supplied. No production secrets were sought or printed; the unrelated existing local Docker service was preserved. Disposable CI PostgreSQL/Redis tests and static Compose/preflight checks are not real Staging acceptance.

The operator must identify the target and read its local operations notes, then supply non-secret receipts covering: final TLS issuer/trust, explicit proxy/CORS/Cookie/CSRF policy, database/Redis configuration, secret-file permissions, mandatory SMTP TLS, migrations, actual backup restore, rollback image/database restore point, health/readiness/metrics, real MFA/session boundaries and mutation cleanup.

On that identified, authorized Admin Staging host, use existing repository commands with credentials provided through the established environment/secret mechanism (do not paste secrets into shell history or the report):

```sh
./scripts/preflight.sh production
docker compose config --quiet
BASE_URL="$AUTHORIZED_STAGING_GOSSO_ORIGIN" SMOKE_MUTATE=true ./scripts/smoke.sh
```

A verified Staging administrator credential/token must already be supplied safely; the script otherwise skips authenticated checks. Require output proving authentication and both temporary user/client create+cleanup, not just a generic final success line. Standard curl TLS verification must remain enabled. Backup/restore and rollback require the target's approved runbook; no guessed host commands are supplied or run. Blog must additionally pass its release checklist, independent confidential BFF topology and operational rollback review.

## 8. Completion decision and safe continuation

1. Keep both certification ledgers pending. Resolve Canonical font delivery through an authorized, reviewed UI Showcase-only change; do not publish UI 0.4.10 or refresh golden images merely to make this pass.
2. Review the complete fresh evidence with the maintainer, including all applicable loading/empty/error/feedback/modal/auth/focus/scroll/responsive/dark states, then use separate reviewed certification commits recording exact product/UI refs and retained artifact hashes. The current partial assistant review is not approval.
3. Review/merge PR #97 only after final-head checks and required human review, then rerun required checks on actual final main. Complete authorized Staging, backup/restore and rollback acceptance. Full release-diff and unresolved risk review remain open; no checkbox is marked passed without evidence.
4. Before any new annotated tag: fetch tags, ensure target absent, clean worktree, accepted final SHA, matching version/changelog and every release-checklist gate satisfied. No force push, retag, or downstream shortcut.
5. Release Admin first; independently verify release-tag image identities, digests, signatures, SBOM, provenance and attachments. Only after acceptance may Blog be tagged and its three images independently verified.
6. Update both Doc compatibility matrices only when those versions truly exist and are accepted. Until then preserve the old formal versions and labelled candidates. Decide a Doc version through its normal governance; do not republish v1.3.1.

**Final audit result: release chain is blocked, not complete.** Technical evidence and release-script fixes advance readiness; they do not satisfy missing Canonical/manual/Staging/upstream-release gates. Production remains undeployed by this task.
