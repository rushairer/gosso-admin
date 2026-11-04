# GOSSO Admin - AI Agent Architectural & Operational Guidelines

This document defines the **immutable architectural rules, security baselines, and deployment conventions** for AI agents working in this repository.

---

## 1. Architectural Baseline

1. **Role & Boundaries**:
   - `gosso-admin` is the administrative control plane for the `gosso` Identity Provider.
   - All management operations (client management, user administration, session revocation, audit query) require authenticated JWT + Admin role.
2. **Frontend-Backend Integration**:
   - The UI communicates with GOSSO via `/api/admin/*` endpoints.
   - Authentication tokens are managed with strict session lifecycle and CSRF protection.

---

## 2. Container & Image Conventions

1. **Development Compose (`docker-compose.yml`)**:
   - Dynamic tag defaults: `${GOSSO_IMAGE_TAG:-main}`, `${GOSSO_ADMIN_FRONTEND_IMAGE_TAG:-main}`.
   - Follows latest `main` images across dependencies during development.
2. **Source Compose (`docker-compose.source.yml`)**:
   - Uses `:local` tag and `build:` contexts for live local code development.
3. **Production Compose (`docker-compose.production.yml`)**:
   - Requires explicit image tags (`:v1.x.y` or immutable digests).

---

## 3. Versioning & Release Chain

- Follow Semantic Versioning (SemVer).
- Dependent on `@gosso/client` and `gosso`. Changes in GOSSO API contract must be reflected here before releasing downstream projects.

### UI Certification Freshness

Before changing `@gouno/ui` or a certified Gosso Admin UI owner, read `docs/ui/showcase-parity-certifications.json`.

- `verified` is valid only for the recorded Product ref, Gouno UI ref, exact package version, owned paths and canonical paths.
- If a certified Product path or package version changes, demote the entry to `needs-manual-recertification` in the same PR unless fresh manual-first evidence is completed there.
- Restore `verified` only after paired Showcase parity, Product browser acceptance and direct rendered review.
- Never use the registry verification workflow to push an uncertified `@gouno/ui` upgrade directly to `main`.
- The Gouno UI registry verification workflow is intentionally `workflow_dispatch`-only. Run it explicitly for an exact published package version after the manual-first certification ledger is `verified`; do not auto-run it on workflow-maintenance pushes while recertification is pending.
- If current `gouno-ui/main` changes a certified canonical path, stop propagation and recertify from the canonical owner rather than patching around the difference locally.

## Frontend toolchain baseline

- The admin frontend build/runtime baseline is Node 24 LTS, with Node >=24.15 and <25. Keep the Docker builder and CI setup on Node 24, declare the same range in package.json/package-lock.json, and keep @types/node on major 24.
- TypeScript 6 remains the JavaScript Compiler API provider for scripts/check-ui-contracts.mjs, which imports typescript and calls ts.createSourceFile. Do not upgrade the typescript package to v7 as a simple version bump. A future TypeScript 7 CLI migration must preserve the TypeScript 6 API through an explicit alias or migrate the AST script with regression tests.
- Any Node major migration must update Docker builders, CI setup, package engines, lockfile metadata, @types/node, and the browser/Showcase/image-security gates together. Node 24 and Node 26 are both LTS today; do not mix majors across runtime, types, and CI as an isolated dependency update.
- Pin all GitHub Actions by full commit SHA and keep setup-node/setup-go on the approved current majors. Security scans must fail closed: retry transient npm audit failures, but never convert an unavailable audit service into a successful security result.

## Nested-scroll parity evidence

- A `fullPage` screenshot is not sufficient for pages whose Showcase or Product content uses nested scroll containers. Scroll each governed below-the-fold semantic section into view on both sides, assert it is rendered and visible, and retain viewport screenshots of those sections.
- Compare shared structure and semantic data, not identical localized copy or fixture-only capabilities. Product-owned localization and live OIDC metadata may legitimately differ from Showcase fixtures; document intentional differences rather than forcing Product output to mimic demo data.
