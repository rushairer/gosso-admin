# Gosso rotation repair — November 9 proposal refresh

Status: **local proposal only, not submitted upstream, not released**. Gosso
remains read-only under the release task. No branch, PR, tag or publication was
created in its remote. Proposed v1.7.1 is not a replacement release baseline.

- Official base: `5bd45c8f9946662274117c4644b31ce90a003464` (v1.7.0).
- Local isolated source commit: `cb0035c013bf3f9552e7ba125cb66a2ce90aef14`.
- [Complete patch](gosso-v1.7.1-local-proposal-2026-11-09.patch), SHA-256
  `fa833ed305dada05f0d27b93fa5e47d58182824b4da0e8ddf3b7d8aa496d0191`.
- [Sanitized verification receipt](gosso-v1.7.1-local-proposal-2026-11-09.json)
  includes exact local log hashes, test scope and existing skips. Raw synthetic
  session/database logs remain outside Git.

The dedicated secret-only CAS and narrow integration-race fixes are retained
from the [November 8 proposal](gosso-v1.7.1-local-proposal.md). This refresh adds
only the security-required x/net v0.62.0 update and verified/tidied checksums,
covering GO-2026-6860 / CVE-2026-78661. Core stays v1.4.0; all other module
requirements, public endpoints and database schema stay unchanged. Published
CHANGELOG entries and Chart version stay unchanged. A read-only `git apply
--check` against the original clean v1.7.0 checkout passes.

## Actual local results

Tests, coverage, Vet, gosec and govulncheck use the supported CI toolchain Go1.26.10 on macOS/arm64. The explicitly pinned golangci-lint2.15.0 runs on Go1.27.3. The earlier host-default linter was 2.12.2; that result is not accepted for the required lint gate.

| Gate | Measured result |
| --- | --- |
| Module verification | All modules verified; only x/net requirement and corresponding sums change |
| Full unit Race / Vet | Passed |
| golangci-lint v2.15.0 | Passed, zero issues |
| gosec v2.27.1 | 149 files, 19 unchanged nosec, zero findings |
| govulncheck v1.6.0 | Zero reachable/imported-package findings; one unused required-module advisory, GO-2026-5932 in x/crypto/openpgp |
| CI aggregate coverage command | 70.0%, meets the unchanged 70% floor |
| Critical package coverage | Auth63.7%, OAuth2 60.4%, Token81.6%, OIDC74.4%, Session74.5%; every existing floor passed |
| Full selected real PostgreSQL/Redis integration with Race | 571 passed test events, six passing packages; account package has no test files; 20 existing miniredis/CJSON variants skip |
| New rotation regressions | Seven passed test events, zero skips: owner/admin fresh-read authentication, stale metadata protection, ownership denial, rollback, concurrent CAS and deleted-client behavior |

The unused OpenPGP advisory is disclosed, not suppressed or described as zero
module findings. Local tests do not establish a deployed environment, official
Linux CI, maintainer sign-off, container safety or an actual immutable release.
Disposable database/Redis are loopback-bound and removed after verification;
unrelated host services are preserved.

## Required next upstream work after the read-only scope exception

Use this complete patch instead of stacking it over the historical November 8
patch. In a clean authorized work branch based on the official commit:

```sh
git apply --check /absolute/path/gosso-v1.7.1-local-proposal-2026-11-09.patch
git apply /absolute/path/gosso-v1.7.1-local-proposal-2026-11-09.patch
```

Read Gosso AGENTS and the existing release workflow, then prepare reviewed
v1.7.1 CHANGELOG, Chart version/appVersion and checklist changes together. Run
all upstream CI, integration/migration, coverage, security and image gates on
the final SHA. Obtain required review, publish a new immutable annotated tag
without changing v1.7.0, and independently verify image identities/digests,
SPDX/CycloneDX, provenance and Helm OCI. Downstream compatibility must use the
actual accepted released digest, never this local build or Gosso main.

Admin and Blog manual-first certification and authorized Staging/backup/restore/
rollback remain separate required gates. No downstream release may proceed
merely because this local repair passes.
