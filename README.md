# GOSSO Admin Console

GOSSO Admin Console is a self-hosted identity administration stack built around the `gosso` OpenID Connect / OAuth 2.0 provider. It packages the identity server, React admin console, PostgreSQL, Redis, a first-run seeder, Mailpit for local email testing, and an Nginx same-origin gateway.

The P0 goal of this repository is a professional, testable release baseline: local users can try it quickly, operators get clear production guardrails, and contributors can verify the critical authentication and administration paths.

## What Is Included

- OIDC/OAuth2 provider endpoints: discovery, JWKS, authorization code + PKCE, refresh token, client credentials, device code, token revocation/introspection, userinfo, and RP-initiated logout.
- Authentication: username/password, sessions, password change/reset, email verification, TOTP MFA, backup codes, WebAuthn/passkeys, and social login hooks.
- Admin console: OAuth2 clients, user accounts, role assignment, account lockout clearing, MFA reset, consent revocation, audit log search, and system status.
- Operations: Docker Compose local stack, PostgreSQL migrations, Redis-backed sessions/rate limits, health/readiness probes, OpenAPI/Swagger, Prometheus metrics, OpenTelemetry tracing, Helm assets in the `gosso` submodule, preflight and smoke scripts.

## Architecture

```text
Browser
  |
  v
Nginx Gateway :8080
  |-- /                         -> gosso-admin-frontend
  |-- /api/v1/*                 -> gosso
  |-- /oauth2/* /oidc/*         -> gosso
  |-- /.well-known/* /swagger/* -> gosso

gosso -> PostgreSQL + Redis
seed  -> PostgreSQL first-run bootstrap
```

The gateway keeps the SPA and identity APIs on the same origin, which avoids local CORS and third-party cookie surprises during OIDC redirects.

## Local Quick Start

1. Initialize the submodule if needed:

   ```bash
   git submodule update --init --recursive
   ```

2. Generate a local RSA signing key:

   ```bash
   mkdir -p gosso/keys
   openssl genpkey -algorithm RSA -out gosso/keys/private.pem -pkeyopt rsa_keygen_bits:2048
   chmod 600 gosso/keys/private.pem
   ```

3. Run a local preflight:

   ```bash
   ./scripts/preflight.sh development
   ```

   Warnings about local defaults are expected in development.

4. Start the stack:

   ```bash
   docker compose up -d --build
   ```

5. Open [http://localhost:8080](http://localhost:8080).

Local development seeds an administrator account by default:

- Username: `admin`
- Password: `admin123`

These credentials are for local development only. Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `docker-compose.yml` for any shared demo, staging, or production-like environment.

## First Verification

After startup, run:

```bash
./scripts/smoke.sh
```

To include authenticated admin API checks:

```bash
ADMIN_PASSWORD=admin123 ./scripts/smoke.sh
```

Expected unauthenticated checks include `/readiness`, `/.well-known/openid-configuration`, `/.well-known/jwks.json`, and `/swagger`. Authenticated checks verify admin login, account listing, and audit log listing.

To also create and clean up a temporary OAuth2 client and user account, run against a disposable local or staging environment:

```bash
ADMIN_PASSWORD=admin123 SMOKE_MUTATE=true ./scripts/smoke.sh
```

If your admin APIs require an access token minted through the admin SPA OIDC flow, pass `SMOKE_ACCESS_TOKEN` instead of `ADMIN_PASSWORD`.

## Production Baseline

Before using this stack outside your laptop:

1. Use HTTPS and set `GOUNO_AUTH_ISSUER` to the public HTTPS issuer.
2. Replace every default secret: admin password, PostgreSQL password, Redis password, TOTP encryption key, verification hash pepper, OAuth provider secrets, SMTP password.
3. Use a real SMTP service with `GOUNO_SMTP_TLS_POLICY=mandatory`.
4. Set explicit CORS origins and trusted proxy CIDRs.
5. Keep the RSA private key outside Git, set file mode `600`, and plan key rotation.
6. Run:

   ```bash
   ./scripts/preflight.sh production
   docker compose config
   ```

See [docs/PRODUCTION_BASELINE.md](docs/PRODUCTION_BASELINE.md) and [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for the release gate.

## Development

Frontend:

```bash
cd gosso-admin-frontend
npm ci --legacy-peer-deps
npm run dev
```

Set `VITE_SHOW_DEV_CREDENTIALS=true` only when you intentionally want the local login screen to show seeded development credentials.

Backend:

```bash
cd gosso
make check
```

Useful root-level checks:

```bash
./scripts/preflight.sh development
docker compose config
./scripts/smoke.sh
```

## API Documentation

Swagger is served in local/debug deployments at [http://localhost:8080/swagger](http://localhost:8080/swagger). The OpenAPI source lives at [gosso/docs/openapi.yaml](gosso/docs/openapi.yaml).

For production, keep Swagger behind administrative network controls or disable it at the gateway.

## Security Notes

- The seeder refuses to use `admin123` in production-like environments.
- The preflight script fails production-like environments for weak/default secrets and unsafe issuer/SMTP/database settings.
- `/readiness` checks PostgreSQL and Redis only. SMTP failures appear when email is actually sent.
- Redis stores sessions, rate-limit state, and revocation/blacklist data. Treat Redis persistence and restore age as security-sensitive.

## Release Status

This repository is ready to be hardened toward a mature self-hosted identity platform. P0 intentionally does not include SAML, SCIM, LDAP/AD, multi-tenancy, or conditional access; those belong in later product milestones.
