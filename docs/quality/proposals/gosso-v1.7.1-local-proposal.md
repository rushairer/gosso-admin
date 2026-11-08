# Gosso secret rotation repair — local proposal

Status: **not submitted to Gosso, not published**. The task limits Gosso to read-only. This text patch makes the required scope decision reviewable without changing that repository or its remote. Proposed SemVer is v1.7.1; no published section, Chart version or target tag has been changed.

- Base: official v1.7.0 commit `5bd45c8f9946662274117c4644b31ce90a003464`.
- [Patch](gosso-v1.7.1-local-proposal.patch), SHA-256 `f4b77c60b0d5654cb0a35e9167b5e382f431b226ddb3f29adecadf47015d696b`.
- [Verification receipt](gosso-v1.7.1-local-verification.json) records exact test scope, skips, local log hashes and limitations. Raw logs stay outside Git because database/HTTP tests can emit synthetic session material.

The dedicated secret-only SQL CAS persists the replacement while keeping metadata writes unable to resurrect stale credentials. No dependency, database schema, public endpoint or administrator authorization boundary changes. Narrow consent request-context and test-receiver race fixes were required by full integration-race execution; assertions and timeouts are not relaxed.

## Reproduce after scope authorization

Use a clean branch based on the official commit, preserve unrelated work, read AGENTS.md and apply the patch. Do not apply over an occupied checkout or retag v1.7.0.

```sh
git apply --check /absolute/path/gosso-v1.7.1-local-proposal.patch
git apply /absolute/path/gosso-v1.7.1-local-proposal.patch
GOTOOLCHAIN=go1.27.3 go test -race ./...
GOTOOLCHAIN=go1.27.3 go vet ./...
```

Provision an isolated PostgreSQL/Redis using the repository test utility and CI conventions; export `GOUNO_DATABASE_DRIVERS_POSTGRES_DSN` and `GOUNO_REDIS_DSN` through the authorized local environment. Never paste live secrets into commands or logs.

```sh
GOTOOLCHAIN=go1.26.10 go test -p 1 -race -tags=integration -count=1 -timeout=180s ./internal/auth/service/ ./internal/session/service/ ./internal/token/service/ ./internal/oauth2/service/ ./internal/account/ ./middleware/ ./tests/http/
GOTOOLCHAIN=go1.26.10 go run github.com/securego/gosec/v2/cmd/gosec@v2.27.1 ./...
GOTOOLCHAIN=go1.26.10 go run golang.org/x/vuln/cmd/govulncheck@v1.6.0 ./...
```

Run the pinned lint and every other mandatory repository CI/release gate. The local proposal is not a completed release checklist. With authorization, prepare reviewed v1.7.1 CHANGELOG/Chart/checklist changes together, obtain required approvals, accept the final main SHA, create a new annotated immutable tag and independently verify official images/signature identities/SBOM/provenance/Helm. Then update downstream pins to actual published digests and rerun real released-image acceptance. Never replace official v1.7.0 with a local or main build.
