# Compatibility and Versioning

GOSSO Admin follows Semantic Versioning. During `0.x`, breaking changes may occur but are always called out in `CHANGELOG.md` with migration guidance.

| Admin line | Gosso API | Database schema | `@gosso/client` | Status |
|---|---|---:|---|---|
| `0.1.x` | OpenAPI `1.2.x` | `20` | `0.1.x` | Development baseline |

The legacy Seeder refuses to write to a dirty or unexpected schema. Override `GOSSO_SCHEMA_VERSION` only after verifying the matching Gosso migrations and updating this matrix.

Image tags are discovery aids, not deployment identifiers. Production manifests must use `image@sha256:digest`, and the Admin, Gosso, and Seeder digests must come from one tested release set.

## Public contracts

Public contracts include HTTP APIs, OpenAPI schemas, environment variables, Compose/Helm values, image behavior, bootstrap behavior, and browser session storage. Additive changes are minor releases; incompatible changes require a major release, or an explicitly documented `0.x` migration.
