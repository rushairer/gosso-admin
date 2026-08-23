# Compatibility and Versioning

GOSSO Admin follows Semantic Versioning. During `0.x`, breaking changes may occur but are always called out in `CHANGELOG.md` with migration guidance.

| Admin line | Gosso release | Gosso API | Database schema | `@gosso/client` | Status |
|---|---|---|---:|---|---|
| `0.1.x` | `1.1.x` | OpenAPI `1.2.x` | `20` | `0.1.x` | Supported baseline |

Gosso `1.1.0` is the minimum supported server release. It includes the role-cache migration required for a newly issued admin access token to contain the permissions used by the Admin API; earlier server builds can return `403` until a token refresh.

The legacy Seeder validates the tables and columns it writes instead of pinning a migration number. Additive migrations therefore do not block bootstrap; a missing or renamed required capability fails with an explicit error.

Image tags are discovery aids, not deployment identifiers. Production manifests must use `image@sha256:digest`, and the Admin, Gosso, and Seeder digests must come from one tested release set.

## Public contracts

Public contracts include HTTP APIs, OpenAPI schemas, environment variables, Compose/Helm values, image behavior, bootstrap behavior, and browser session storage. Additive changes are minor releases; incompatible changes require a major release, or an explicitly documented `0.x` migration.
