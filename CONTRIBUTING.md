# Contributing to GOSSO Admin

Thank you for helping improve GOSSO Admin.

## Before opening a change

- Search existing issues and open a proposal before large API, security, or deployment changes.
- Keep changes focused and include tests for changed behavior.
- Never commit credentials, private keys, identity data, or generated build output.

## Local verification

```bash
cd gosso-admin-frontend
npm ci --legacy-peer-deps
npm run quality

cd ../seed
go test ./...
go vet ./...

cd ..
./scripts/preflight.sh development
docker compose config
```

Use Conventional Commit-style subjects where practical. User-visible changes must update `CHANGELOG.md`. Breaking configuration or API changes require migration notes and a SemVer-compatible version decision.

By submitting a contribution, you agree that it is licensed under Apache-2.0 and that you have the right to submit it.

The default branch is protected according to `docs/REPOSITORY_SETTINGS.md`; direct pushes and force pushes are not part of the contribution workflow.
