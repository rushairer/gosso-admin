# Bootstrap Contract

The current `gosso-admin-seed` image is a compatibility bridge. It writes the Gosso database directly and is restricted by these safeguards:

- one serializable transaction;
- a transaction-scoped PostgreSQL advisory lock;
- exact, clean `schema_migrations` validation;
- idempotent account, role, assignment, and client creation;
- production password policy enforcement;
- random database-generated account identifiers.

Run it only once through the production Compose `bootstrap` profile:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml --profile bootstrap run --rm seed
```

Rotate the initial password after first sign-in and remove `ADMIN_PASSWORD` from the deployment environment.

## Target API

The Gosso service should replace direct database access with `POST /api/v1/bootstrap`. The endpoint contract is:

- enabled only while no administrative account exists;
- requires a high-entropy, operator-provided one-time bootstrap token;
- atomically creates the initial admin account, role assignment, and Admin OAuth client through service-layer APIs;
- consumes the token on success and cannot be re-enabled without an explicit operator action;
- emits an audit event containing no token or password material;
- returns `409` after bootstrap is complete and uses the standard error envelope.

Until this endpoint exists in a released Gosso version, the legacy Seeder remains deprecated but supported for the exact schema listed in `COMPATIBILITY.md`.
