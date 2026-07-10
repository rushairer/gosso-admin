# Production Operations

## Deployment

1. Copy `.env.production.example` to a secret-managed environment source.
2. Replace every placeholder and pin every image by digest.
3. Put TLS termination in front of `127.0.0.1:8080` and preserve `X-Forwarded-Proto: https`.
4. Run `./scripts/preflight.sh production` and `docker compose --env-file .env.production -f docker-compose.production.yml config`.
5. Start the stack, run the one-time bootstrap profile, rotate the initial password, then run authenticated smoke checks.

The bundled PostgreSQL and Redis communicate on an isolated Compose network. `GOSSO_ADMIN_ALLOW_INTERNAL_PLAINTEXT_DATASTORE=true` is an explicit exception for that topology; use TLS and remove the exception when connecting to managed or cross-host datastores.

## Backup and recovery

- Take encrypted PostgreSQL custom-format backups and record the Admin/Gosso image digests and migration version with every backup.
- Test restore into an isolated environment before calling a backup valid.
- Redis contains sessions, revocations, and rate-limit state. After Redis loss or an old restore, revoke existing sessions and require reauthentication rather than trusting stale state.
- Store signing keys and encryption keys in a separate recovery system. Database restoration without the matching keys may make encrypted credentials unusable.

## Upgrade and rollback

- Read both repositories' changelogs and compatibility matrix.
- Back up PostgreSQL before migrations and stage the exact target digests.
- Test migration, login, refresh, MFA, account administration, and rollback in staging.
- Roll back application images only when the database migration is backward compatible. Otherwise restore the database and matching keys from the coordinated restore point.

## Monitoring

Scrape Gosso `/metrics` only from the monitoring network. Alert on readiness failures, elevated authentication failures, refresh failures, admin mutation errors, Redis/PostgreSQL latency, and sustained rate limiting. The public gateway intentionally blocks `/metrics` and Swagger.
