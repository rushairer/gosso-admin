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
- If current `gouno-ui/main` changes a certified canonical path, stop propagation and recertify from the canonical owner rather than patching around the difference locally.
