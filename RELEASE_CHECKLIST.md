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
- [ ] Seed passes `go test ./...` or `go build ./...`.
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
