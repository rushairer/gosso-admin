# Production Baseline

This document describes the minimum baseline for running GOSSO Admin outside local development.

## Environment

Set a production-like environment explicitly:

```bash
export GOSSO_ADMIN_ENV=production
export GOUNO_ENV=production
```

Run the preflight before deploying:

```bash
./scripts/preflight.sh production
```

The script is intentionally strict for `production`, `staging`, `preview`, and `uat`.

## Required Secrets

Generate unique values per environment:

```bash
openssl rand -hex 32 # TOTP encryption key
openssl rand -hex 32 # verification hash pepper
mkdir -p keys
openssl genpkey -algorithm RSA -out keys/private.pem -pkeyopt rsa_keygen_bits:2048
chmod 600 keys/private.pem
```

Required production settings:

- `ADMIN_PASSWORD`: unique, at least 12 characters, never `admin123`.
- `GOUNO_AUTH_ISSUER`: final HTTPS issuer, for example `https://sso.example.com`.
- `GOUNO_AUTH_PRIVATE_KEY_PATH`: RSA private key path.
- `GOUNO_AUTH_TOTP_ENCRYPTION_KEY`: unique 64-character hex key.
- `GOUNO_AUTH_VERIFY_HASH_PEPPER`: unique secret for verification-code hashing.
- `GOUNO_DATABASE_DRIVERS_POSTGRES_DSN`: PostgreSQL DSN with production credentials and TLS where supported.
- `GOUNO_REDIS_DSN`: Redis DSN with authentication.
- `GOUNO_CORS_ALLOWED_ORIGINS`: JSON array of allowed application origins.
- `GOUNO_WEB_SERVER_TRUSTED_PROXIES`: JSON array of trusted proxy CIDRs.

## SMTP

Production password reset and verification email require a real SMTP provider:

```env
GOUNO_SMTP_HOST=smtp.example.com
GOUNO_SMTP_PORT=587
GOUNO_SMTP_USERNAME=your-smtp-user
GOUNO_SMTP_PASSWORD=your-smtp-password
GOUNO_SMTP_FROM=noreply@example.com
GOUNO_SMTP_TLS_POLICY=mandatory
GOUNO_AUTH_PASSWORD_RESET_BASE_URL=https://sso.example.com/reset-password
```

Configure SPF, DKIM, and DMARC for the sender domain.

## Network And Gateway

- Terminate TLS at a trusted proxy or ingress.
- Forward only required routes to `gosso`.
- Keep `/swagger` internal-only or disabled for production.
- Ensure `/.well-known/openid-configuration` and `/.well-known/jwks.json` are publicly reachable by relying parties.

## Verification

After deployment:

```bash
BASE_URL=https://sso.example.com ./scripts/smoke.sh
ADMIN_USERNAME=<admin> ADMIN_PASSWORD=<secret> BASE_URL=https://sso.example.com ./scripts/smoke.sh
```

Use a staging admin account when possible. Avoid putting production admin credentials in shell history.

Run mutating smoke checks only in staging or against disposable test data:

```bash
SMOKE_ACCESS_TOKEN=<admin-token> SMOKE_MUTATE=true BASE_URL=https://staging-sso.example.com ./scripts/smoke.sh
```

## Backup And Recovery

- Back up PostgreSQL with `pg_dump -Fc` or managed database snapshots.
- Treat Redis as security-sensitive because it stores sessions, rate-limit counters, and token blacklist data.
- Restoring old Redis data can reintroduce stale token/session state. Prefer short-lived tokens and controlled re-authentication after incidents.
- Rehearse restore before the first production release.

## Release Discipline

Use [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) for every release. Do not promote a build when preflight, smoke checks, or the admin-console quality gates are failing.
